import os
import json
import time
import logging
import asyncio
import re
from typing import Dict, Optional, Any, Union, List

from datetime import datetime

from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException, Request, Response, status, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.httpsredirect import HTTPSRedirectMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

from pydantic import BaseModel, Field, validator
# from starlette.middleware.sessions import SessionMiddleware
# from authlib.integrations.starlette_client import OAuth, OAuthError
from supabase import create_client, Client
import uuid
import secrets
from functools import wraps

# HTTP requests
import httpx

# Configure structured logging (env-driven)
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()

class StructuredLogger:
    def __init__(self, name):
        self.logger = logging.getLogger(name)
        handler = logging.StreamHandler()
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        handler.setFormatter(formatter)
        self.logger.addHandler(handler)
        self.logger.setLevel(getattr(logging, LOG_LEVEL, logging.INFO))

    def isEnabledFor(self, level):
        """Check if logger is enabled for the given level"""
        return self.logger.isEnabledFor(level)

    def info(self, message, correlation_id=None, **kwargs):
        extra = {"correlation_id": correlation_id, **kwargs}
        self.logger.info(f"{message} | {extra}")

    def error(self, message, correlation_id=None, **kwargs):
        extra = {"correlation_id": correlation_id, **kwargs}
        self.logger.error(f"{message} | {extra}")

    def warning(self, message, correlation_id=None, **kwargs):
        extra = {"correlation_id": correlation_id, **kwargs}
        self.logger.warning(f"{message} | {extra}")

    def debug(self, message, correlation_id=None, **kwargs):
        extra = {"correlation_id": correlation_id, **kwargs}
        self.logger.debug(f"{message} | {extra}")

logger = StructuredLogger(__name__)

# Circuit Breaker Implementation
class CircuitBreaker:
    def __init__(self, failure_threshold=5, reset_timeout=60):
        self.failure_threshold = failure_threshold
        self.reset_timeout = reset_timeout
        self.failure_count = 0
        self.last_failure_time = None
        self.state = 'CLOSED'  # CLOSED, OPEN, HALF_OPEN
    
    def call(self, func, *args, **kwargs):
        if self.state == 'OPEN':
            if time.time() - self.last_failure_time >= self.reset_timeout:
                self.state = 'HALF_OPEN'
                logger.info("Circuit breaker transitioning to HALF_OPEN")
            else:
                raise Exception("Circuit breaker is OPEN")
        
        try:
            result = func(*args, **kwargs)
            if self.state == 'HALF_OPEN':
                self.state = 'CLOSED'
                self.failure_count = 0
                logger.info("Circuit breaker reset to CLOSED")
            return result
        except Exception as e:
            self.failure_count += 1
            self.last_failure_time = time.time()
            
            if self.failure_count >= self.failure_threshold:
                self.state = 'OPEN'
                logger.error(f"Circuit breaker opened due to {self.failure_count} failures")
            
            raise e

# Global circuit breaker for OpenAI API
openai_circuit_breaker = CircuitBreaker(failure_threshold=3, reset_timeout=30)

# Authentication middleware
class AuthenticationMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        # Use a consistent API key that can be configured
        self.api_key = os.getenv("API_AUTH_KEY", "doom-blocker-extension-api-key-2024")
        logger.info("Authentication middleware initialized", api_key_configured=bool(os.getenv("API_AUTH_KEY")))

    async def dispatch(self, request: Request, call_next):
        # Skip auth for health checks and public endpoints
        if request.url.path in ["/", "/health", "/docs", "/openapi.json"]:
            return await call_next(request)
        
        # Check for API key in header for protected endpoints
        if request.url.path.startswith("/fetch_") or request.url.path.startswith("/api/"):
            auth_header = request.headers.get("Authorization")
            if not auth_header or not auth_header.startswith("Bearer "):
                return JSONResponse(
                    status_code=401,
                    content={"error": "Missing or invalid authorization header"}
                )
            
            token = auth_header.replace("Bearer ", "")
            if token != self.api_key:
                logger.warning("Invalid API key attempt", 
                             correlation_id=str(uuid.uuid4()),
                             ip=get_client_ip(request))
                return JSONResponse(
                    status_code=401,
                    content={"error": "Invalid API key"}
                )
        
        # Add correlation ID to request
        correlation_id = str(uuid.uuid4())
        request.state.correlation_id = correlation_id
        
        response = await call_next(request)
        response.headers["X-Correlation-ID"] = correlation_id
        return response

# Load environment variables (skip local dotenv in production)
ENV = os.getenv("ENV", os.getenv("ENVIRONMENT", "development"))
if ENV != "production":
    load_dotenv('.env.local')

# Load prompts from JSON
logger.info("Loading prompts from JSON file...")
import os
prompts_file_path = os.path.join(os.path.dirname(__file__), 'prompts_simplified.json')
try:
    with open(prompts_file_path, 'r') as f:
        prompts_data = json.load(f)
    logger.info("Prompts loaded successfully")
except FileNotFoundError:
    logger.error(f"Prompts file not found at {prompts_file_path}")
    # Fallback to empty prompts
    prompts_data = {}
except Exception as e:
    logger.error(f"Error loading prompts: {e}")
    prompts_data = {}

# Rate limiting infrastructure
rate_limit_data = {
    'ip_counts': {},  # IP -> request count
    'last_reset': time.time()  # timestamp of last reset
}

# Global counter for blocked items
blocked_items_counter = {
    'count': 0,
    'last_updated': time.time()
}

# Simple in-memory cache for API responses
api_cache = {
    'responses': {},  # hash -> response
    'max_size': 100,  # Maximum number of cached responses
    'max_age': 300    # Cache expires after 5 minutes
}

def reset_rate_limit_if_needed():
    """Reset rate limit counters if an hour has passed"""
    current_time = time.time()
    if current_time - rate_limit_data['last_reset'] >= 3600:  # 3600 seconds = 1 hour
        rate_limit_data['ip_counts'].clear()
        rate_limit_data['last_reset'] = current_time
        #logger.info("🔄 Rate limit counters reset after 1 hour")

def track_ip_request(ip_address: str):
    """Track a request from the given IP address"""
    reset_rate_limit_if_needed()

    ip_counts = rate_limit_data['ip_counts']
    if ip_address not in ip_counts:
        ip_counts[ip_address] = 0

    ip_counts[ip_address] += 1
    request_count = ip_counts[ip_address]

    #logger.info(f"📊 IP {ip_address} has made {request_count} requests this hour")
    return request_count

app = FastAPI(title="Doom Blocker Backend", version="1.0.0")

# Security: optional HTTPS redirect in production
if ENV == "production" and os.getenv("ENABLE_HTTPS_REDIRECT", "true").lower() == "true":
    app.add_middleware(HTTPSRedirectMiddleware)

# Security: Trusted hosts (comma-separated)
trusted_hosts_env = os.getenv("TRUSTED_HOSTS", "")
trusted_hosts = [h.strip() for h in trusted_hosts_env.split(',') if h.strip()]
if ENV == "production" and trusted_hosts:
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=trusted_hosts)

# Security headers middleware
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("Referrer-Policy", "no-referrer")
        response.headers.setdefault("X-XSS-Protection", "0")
        # Only set HSTS on HTTPS
        try:
            if request.url.scheme == "https":
                response.headers.setdefault("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload")
        except Exception:
            pass
        return response

if ENV == "production":
    app.add_middleware(SecurityHeadersMiddleware)

# Add authentication middleware
app.add_middleware(AuthenticationMiddleware)

# Add startup event for debugging
@app.on_event("startup")
async def startup_event():
    logger.info("🚀 Doom Blocker Backend starting up...")
    logger.info(f"📁 Current working directory: {os.getcwd()}")
    logger.info(f"📄 Prompts loaded: {len(prompts_data)} patterns")
    logger.info(f"🔑 OpenAI configured: {OPENAI_HEADERS is not None}")
    logger.info(f"🗄️ Supabase configured: {supabase is not None}")
    logger.info("✅ Startup complete!")

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket client connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        logger.info(f"WebSocket client disconnected. Total connections: {len(self.active_connections)}")

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.error(f"Error broadcasting to connection: {e}")

    async def broadcast_counter_update(self, count: int):
        """Broadcast counter update to all connected WebSocket clients"""
        message = json.dumps({
            "type": "counter_update",
            "count": count,
            "timestamp": time.time()
        })
        await self.broadcast(message)
        logger.info(f"Broadcasted counter update: {count}")

manager = ConnectionManager()

def increment_blocked_counter(items_blocked: int):
    """Increment the global blocked items counter and broadcast update"""
    blocked_items_counter['count'] += items_blocked
    blocked_items_counter['last_updated'] = time.time()
    
    # Schedule broadcast if there are active connections
    if manager.active_connections:
        asyncio.create_task(manager.broadcast_counter_update(blocked_items_counter['count']))
    
    logger.info(f"Blocked items counter updated: {blocked_items_counter['count']} (+{items_blocked})")

def get_cache_key(grid_structure, url, whitelist, blacklist):
    """Generate a cache key for the request"""
    import hashlib
    # Create a hash of the request parameters
    key_data = {
        'url': url,
        'whitelist': sorted(whitelist) if whitelist else [],
        'blacklist': sorted(blacklist) if blacklist else [],
        'grid_ids': [grid.get('id') for grid in grid_structure.get('grids', [])],
        'total_children': sum(grid.get('totalChildren', 0) for grid in grid_structure.get('grids', []))
    }
    key_string = json.dumps(key_data, sort_keys=True)
    return hashlib.md5(key_string.encode()).hexdigest()

def get_cached_response(cache_key):
    """Get cached response if available and not expired"""
    current_time = time.time()
    
    if cache_key in api_cache['responses']:
        cached_data = api_cache['responses'][cache_key]
        if current_time - cached_data['timestamp'] < api_cache['max_age']:
            logger.info(f"🎯 Cache hit for key: {cache_key[:8]}...")
            return cached_data['response']
        else:
            # Remove expired cache entry
            del api_cache['responses'][cache_key]
    
    return None

def cache_response(cache_key, response):
    """Cache the response"""
    current_time = time.time()
    
    # Clean up old cache entries if we're at max size
    if len(api_cache['responses']) >= api_cache['max_size']:
        # Remove oldest entries
        oldest_keys = sorted(api_cache['responses'].keys(), 
                           key=lambda k: api_cache['responses'][k]['timestamp'])[:10]
        for key in oldest_keys:
            del api_cache['responses'][key]
    
    api_cache['responses'][cache_key] = {
        'response': response,
        'timestamp': current_time
    }
    logger.info(f"💾 Cached response for key: {cache_key[:8]}...")

# Add session middleware
# app.add_middleware(
#     SessionMiddleware,
#     secret_key=os.getenv("AUTH0_SECRET", "your-secret-key"),
#     max_age=3600,  # 1 hour in seconds
# )

# Add CORS middleware (env-driven with secure defaults)
cors_origins_env = os.getenv("CORS_ORIGINS", "")
allow_origins = [o.strip() for o in cors_origins_env.split(',') if o.strip()]

# Secure CORS configuration
if ENV == "production":
    # Production: Only allow specific origins
    if not allow_origins:
        allow_origins = [
            "https://www.doomblocker.com",
            "https://internetfilter.org"
        ]
    allow_credentials = False
    allow_methods = ["GET", "POST", "OPTIONS"]
    allow_headers = ["Authorization", "Content-Type", "X-Correlation-ID"]
else:
    # Development: More permissive but still controlled
    if not allow_origins:
        allow_origins = ["http://localhost:3000", "http://localhost:8000"]
    allow_credentials = True
    allow_methods = ["*"]
    allow_headers = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=allow_credentials,
    allow_methods=allow_methods,
    allow_headers=allow_headers,
)

# AUTH0_CLIENT_ID = os.getenv("AUTH0_CLIENT_ID")
# AUTH0_CLIENT_SECRET = os.getenv("AUTH0_SECRET")
# AUTH0_ISSUER_BASE_URL = os.getenv("AUTH0_ISSUER_BASE_URL", "")
# AUTH0_DOMAIN = AUTH0_ISSUER_BASE_URL.replace("https://", "") if AUTH0_ISSUER_BASE_URL.startswith("https://") else AUTH0_ISSUER_BASE_URL
# BASE_URL = os.getenv("AUTH0_BASE_URL", "http://localhost:3000")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")

# Initialize Supabase client only if credentials are provided and valid
if SUPABASE_URL and SUPABASE_KEY and not SUPABASE_URL.startswith("https://dummy"):
    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        logger.info("Supabase client initialized successfully")
    except Exception as e:
        logger.warning(f"Failed to initialize Supabase client: {e}")
        supabase = None
else:
    logger.warning("Supabase disabled (dummy/missing credentials)")
    supabase = None

async def update_visitor_telemetry(visitor_id: str):
    """Update visitor telemetry in Supabase asynchronously - DISABLED for performance"""
    # DISABLED: Telemetry calls are causing 404 errors and slowing down the API
    # The telemetry table doesn't exist or isn't accessible, causing delays
    logger.debug("Telemetry update disabled for performance - skipping visitor tracking")
    return

# oauth = OAuth()
# oauth.register(
#     name="auth0",
#     client_id=AUTH0_CLIENT_ID,
#     client_secret=AUTH0_CLIENT_SECRET,
#     client_kwargs={"scope": "openid profile email"},
#     server_metadata_url=f"https://{AUTH0_DOMAIN}/.well-known/openid-configuration",
# )

logger.info("Initializing OpenAI API configuration...")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    logger.warning("OPENAI_API_KEY not found - AI analysis will be disabled")
    OPENAI_HEADERS = None
else:
    OPENAI_URL = "https://api.openai.com/v1/chat/completions"
    OPENAI_HEADERS = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json"
    }
    logger.info("OpenAI client initialized successfully")

# Helper: get client IP honoring proxies
def get_client_ip(request: Request) -> str:
    try:
        xff = request.headers.get('x-forwarded-for')
        if xff:
            return xff.split(',')[0].strip()
        return request.client.host if request.client else "unknown"
    except Exception:
        return "unknown"

class GridAnalysisRequest(BaseModel):
    gridStructure: dict
    currentUrl: str
    whitelist: list[str] = []
    blacklist: list[str] = []
    visitorId: str
    
    @validator('currentUrl')
    def validate_url(cls, v):
        if not v or len(v) > 2000:
            raise ValueError('URL must be provided and less than 2000 characters')
        # Basic URL validation
        if not (v.startswith('http://') or v.startswith('https://')):
            raise ValueError('URL must start with http:// or https://')
        return v
    
    @validator('gridStructure')
    def validate_grid_structure(cls, v):
        if not isinstance(v, dict):
            raise ValueError('gridStructure must be a dictionary')
        if 'grids' not in v:
            raise ValueError('gridStructure must contain grids key')
        if not isinstance(v['grids'], list):
            raise ValueError('grids must be a list')
        if len(v['grids']) > 50:  # Reasonable limit
            raise ValueError('Too many grids (max 50)')
        return v
    
    @validator('whitelist', 'blacklist')
    def validate_lists(cls, v):
        if not isinstance(v, list):
            raise ValueError('Must be a list')
        if len(v) > 100:  # Reasonable limit
            raise ValueError('Too many items (max 100)')
        for item in v:
            if not isinstance(item, str) or len(item) > 100:
                raise ValueError('List items must be strings under 100 characters')
        return v
    
    @validator('visitorId')
    def validate_visitor_id(cls, v):
        if not v or len(v) > 100:
            raise ValueError('visitorId must be provided and less than 100 characters')
        return v

class AnalysisResult(BaseModel):
    """
    Complete analysis result containing removal instructions for interface cleanup.

    This is the final output that specifies exactly which UI elements should be hidden
    from the grid interface as a newline-separated list.
    """
    children_to_remove: str = Field(
        description="Newline-separated list of child element IDs that should be removed. Each ID must exactly match a child ID from the input data (e.g., 'g1c0\\ng1c5\\ng1c3\\ng2c9'). Return empty string if no children should be removed.",
        example="g1c0\ng1c5\ng1c3\ng2c9"
    )

# Pydantic models for user session and analytics endpoints
class UserSessionRequest(BaseModel):
    session_id: str
    device_info: dict
    created_at: str
    extension_version: str
    first_install: bool = False

class BlockedItemsRequest(BaseModel):
    session_id: str
    blocked_items: List[dict]

class UserMetricsRequest(BaseModel):
    session_id: str
    total_blocked: int = 0
    blocked_today: int = 0
    sites_visited: List[dict] = []
    profiles_used: List[dict] = []
    last_updated: str

# Pydantic models for other API endpoints
# class Username(BaseModel):
#     username: str

# class ScoreData(BaseModel):
#     username: str
#     score: int

# Helper functions
# def get_user_from_session(request: Request) -> Optional[Dict[str, Any]]:
#     """Extract user information from session."""
#     return request.session.get("user")

# def is_authenticated(request: Request) -> bool:
#     """Check if the user is authenticated."""
#     return "user" in request.session and request.session["user"] is not None

# async def require_auth(request: Request) -> Dict[str, Any]:
#     """Dependency to require authentication."""
#     user = get_user_from_session(request)
#     if not user:
#         raise HTTPException(status_code=401, detail="Not authenticated")
#     return user

def get_prompt_for_url(url: str, whitelist: list[str] = None, blacklist: list[str] = None) -> str:
    """Get the appropriate prompt based on URL regex matching"""
    # Detect YouTube search URL and extract search query
    youtube_search_match = re.match(r"https?://(www\.)?youtube\.com/results\?(.+)", url)
    search_query = None
    if youtube_search_match:
        # Extract the search_query parameter from the URL
        from urllib.parse import parse_qs, urlparse
        qs = parse_qs(urlparse(url).query)
        search_query = qs.get("search_query", [None])[0]

    for pattern, config in prompts_data.items():
        if re.match(pattern, url):
            prompt = config["prompt"]

            # Replace blacklist and whitelist tags
            if blacklist and len(blacklist) > 0:
                blacklist_items = "\n".join(["- %s" % item for item in blacklist])
                prompt = prompt.replace("<BLACKLIST>", "<BLACKLIST>\n%s" % blacklist_items)
            else:
                prompt = prompt.replace("<BLACKLIST>", "")

            if whitelist and len(whitelist) > 0:
                whitelist_items = "\n".join(["- %s" % item for item in whitelist])
                prompt = prompt.replace("<WHITELIST>", "<WHITELIST>\n%s" % whitelist_items)
            else:
                prompt = prompt.replace("<WHITELIST>", "")

            # If YouTube search, add the search query to the prompt
            if search_query:
                prompt += f"\n\nUSER_SEARCH_QUERY: {search_query}\nOnly keep videos and results relevant to this search query."



            return prompt

    # Default fallback (shouldn't happen with proper config)
    logger.warning("No matching pattern found for URL: %s" % url)
    base_prompt = list(prompts_data.values())[0]["prompt"]

    # Apply same replacement logic for fallback
    if blacklist and len(blacklist) > 0:
        blacklist_items = "\n".join(["- %s" % item for item in blacklist])
        base_prompt = base_prompt.replace("<BLACKLIST>", "<BLACKLIST>\n%s" % blacklist_items)
    else:
        base_prompt = base_prompt.replace("<BLACKLIST>", "")

    if whitelist and len(whitelist) > 0:
        whitelist_items = "\n".join(["- %s" % item for item in whitelist])
        base_prompt = base_prompt.replace("<WHITELIST>", "<WHITELIST>\n%s" % whitelist_items)
    else:
        base_prompt = base_prompt.replace("<WHITELIST>", "")

    # If YouTube search, add the search query to the fallback prompt
    if search_query:
        base_prompt += f"\n\nUSER_SEARCH_QUERY: {search_query}\nOnly keep videos and results relevant to this search query."



    return base_prompt

# WebSocket endpoint
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    
    # Send current counter value to newly connected client
    try:
        initial_message = json.dumps({
            "type": "counter_update",
            "count": blocked_items_counter['count'],
            "timestamp": time.time()
        })
        await manager.send_personal_message(initial_message, websocket)
    except Exception as e:
        logger.error(f"Error sending initial counter: {e}")
    
    try:
        while True:
            data = await websocket.receive_text()
            logger.info(f"Received WebSocket message: {data}")
            
            # Handle incoming messages (can be extended for different message types)
            try:
                message = json.loads(data)
                if message.get("type") == "get_counter":
                    counter_message = json.dumps({
                        "type": "counter_update",
                        "count": blocked_items_counter['count'],
                        "timestamp": time.time()
                    })
                    await manager.send_personal_message(counter_message, websocket)
            except json.JSONDecodeError:
                # Handle plain text messages
                await manager.send_personal_message(f"Echo: {data}", websocket)
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Doom Blocker Backend API",
        "status": "running",
        "timestamp": time.time(),
        "endpoints": {
            "health": "/health",
            "docs": "/docs",
            "blocked_count": "/api/blocked-count",
            "ai_analysis": "/fetch_distracting_chunks"
        }
    }

# Enhanced health check endpoint
@app.get("/health")
async def health_check():
    """Comprehensive health check endpoint"""
    correlation_id = str(uuid.uuid4())
    health_status = {
        "status": "healthy",
        "timestamp": time.time(),
        "correlation_id": correlation_id,
        "services": {},
        "circuit_breakers": {}
    }
    
    # Check OpenAI configuration
    health_status["services"]["openai"] = {
        "configured": OPENAI_HEADERS is not None,
        "status": "available" if OPENAI_HEADERS else "unavailable"
    }
    
    # Check Supabase connection
    supabase_status = "unavailable"
    try:
        if supabase:
            # Quick ping to Supabase
            result = supabase.table("user_sessions").select("count").limit(1).execute()
            supabase_status = "available"
    except Exception as e:
        logger.warning("Supabase health check failed", 
                      correlation_id=correlation_id, 
                      error=str(e))
        supabase_status = "error"
    
    health_status["services"]["supabase"] = {
        "configured": supabase is not None,
        "status": supabase_status
    }
    
    # Check circuit breaker states
    health_status["circuit_breakers"]["openai"] = {
        "state": openai_circuit_breaker.state,
        "failure_count": openai_circuit_breaker.failure_count
    }
    
    # Overall health determination
    critical_services_healthy = (
        health_status["services"]["openai"]["status"] == "available" and
        health_status["circuit_breakers"]["openai"]["state"] != "OPEN"
    )
    
    if not critical_services_healthy:
        health_status["status"] = "degraded"
    
    status_code = 200 if health_status["status"] == "healthy" else 503
    return JSONResponse(content=health_status, status_code=status_code)

# REST endpoint to get current counter (optional)
@app.get("/api/blocked-count")
async def get_blocked_count():
    """Get the current count of blocked items"""
    return {
        "count": blocked_items_counter['count'],
        "last_updated": blocked_items_counter['last_updated']
    }

@app.post("/api/report-blocked-items")
async def report_blocked_items(request: Request):
    """Report actually blocked items from the extension"""
    try:
        data = await request.json()
        count = data.get('count', 0)
        
        if count > 0:
            increment_blocked_counter(count)
            logger.info(f"📊 Extension reported {count} actually blocked items")
        
        return {"success": True, "count": count}
    except Exception as e:
        logger.error(f"❌ Error reporting blocked items: {e}")
        return JSONResponse(status_code=500, content={"success": False, "error": "Internal error"})

# Auth routes
# @app.get("/login")
# async def login(request: Request):
#     redirect_uri = f"{BASE_URL}/callback"
#     return await oauth.auth0.authorize_redirect(request, redirect_uri)

# @app.get("/callback")
# async def callback(request: Request):
#     try:
#         token = await oauth.auth0.authorize_access_token(request)
#         user = token.get("userinfo")
#         if user:
#             request.session["user"] = dict(user)
#             return RedirectResponse(url="/")
#         else:
#             return JSONResponse(
#                 status_code=400,
#                 content={"error": "Failed to get user info"}
#             )
#     except OAuthError as e:
#         return JSONResponse(
#             status_code=400,
#             content={"error": f"OAuth error: {str(e)}"}
#         )

# @app.get("/logout")
# async def logout(request: Request, response: Response):
#     request.session.pop("user", None)
#     response.delete_cookie("session")

#     # Auth0 logout URL for redirection
#     return_to = f"{BASE_URL}"
#     logout_url = f"{AUTH0_ISSUER_BASE_URL}/v2/logout?client_id={AUTH0_CLIENT_ID}&returnTo={return_to}"

#     # Return redirection to Auth0 logout
#     return RedirectResponse(url=logout_url)



# User Session and Analytics Endpoints

@app.post("/api/user-session")
async def create_user_session(session_request: UserSessionRequest, request: Request):
    """Create or update user session in Supabase"""
    try:
        if not supabase:
            logger.warning("Supabase not configured, session not saved")
            return {"success": True, "message": "Session tracking disabled"}

        # Prepare session data for Supabase
        session_data = {
            "session_id": session_request.session_id,
            "device_info": session_request.device_info,
            "created_at": session_request.created_at,
            "extension_version": session_request.extension_version,
            "first_install": session_request.first_install,
            "ip_address": get_client_ip(request),
            "last_active": datetime.now().isoformat()
        }

        # Upsert session data
        result = supabase.table("user_sessions").upsert(
            session_data,
            on_conflict="session_id"
        ).execute()

        logger.info(f"✅ User session saved: {session_request.session_id}")

        return {
            "success": True,
            "message": "Session saved successfully",
            "session_id": session_request.session_id
        }

    except Exception as e:
        logger.error(f"❌ Error saving user session: {e}")
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": str(e)}
        )

@app.post("/api/blocked-items")
async def save_blocked_items(blocked_request: BlockedItemsRequest, request: Request):
    """Save blocked items data to Supabase"""
    try:
        if not supabase:
            logger.warning("Supabase not configured, blocked items not saved")
            return {"success": True, "message": "Blocked items tracking disabled"}

        # Prepare blocked items data
        blocked_records = []
        for item in blocked_request.blocked_items:
            record = {
                "session_id": blocked_request.session_id,
                "timestamp": item.get("timestamp"),
                "count": item.get("count", 0),
                "url": item.get("url", ""),
                "hostname": item.get("hostname", ""),
                "blocked_items": item.get("items", []),
                "created_at": datetime.now().isoformat()
            }
            blocked_records.append(record)

        # Insert blocked items data
        if blocked_records:
            result = supabase.table("blocked_items").insert(blocked_records).execute()
            logger.info(f"✅ Saved {len(blocked_records)} blocked items for session {blocked_request.session_id}")

        return {
            "success": True,
            "message": f"Saved {len(blocked_records)} blocked items",
            "count": len(blocked_records)
        }

    except Exception as e:
        logger.error(f"❌ Error saving blocked items: {e}")
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": str(e)}
        )

@app.post("/api/user-metrics")
async def save_user_metrics(metrics_request: UserMetricsRequest, request: Request):
    """Save user metrics to Supabase"""
    try:
        if not supabase:
            logger.warning("Supabase not configured, metrics not saved")
            return {"success": True, "message": "Metrics tracking disabled"}

        # Prepare metrics data
        metrics_data = {
            "session_id": metrics_request.session_id,
            "total_blocked": metrics_request.total_blocked,
            "blocked_today": metrics_request.blocked_today,
            "sites_visited": metrics_request.sites_visited,
            "profiles_used": metrics_request.profiles_used,
            "last_updated": metrics_request.last_updated,
            "updated_at": datetime.now().isoformat()
        }

        # Upsert metrics data
        result = supabase.table("user_metrics").upsert(
            metrics_data,
            on_conflict="session_id"
        ).execute()

        logger.info(f"✅ User metrics saved for session {metrics_request.session_id}")

        return {
            "success": True,
            "message": "Metrics saved successfully",
            "session_id": metrics_request.session_id
        }

    except Exception as e:
        logger.error(f"❌ Error saving user metrics: {e}")
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": str(e)}
        )

@app.get("/api/analytics/{session_id}")
async def get_user_analytics(session_id: str):
    """Get analytics data for a specific user session"""
    try:
        if not supabase:
            return JSONResponse(
                status_code=503,
                content={"success": False, "error": "Analytics service unavailable"}
            )

        # Get user metrics
        metrics_result = supabase.table("user_metrics").select("*").eq("session_id", session_id).execute()

        # Get blocked items data
        blocked_result = supabase.table("blocked_items").select("*").eq("session_id", session_id).execute()

        # Get session info
        session_result = supabase.table("user_sessions").select("*").eq("session_id", session_id).execute()

        analytics_data = {
            "session_id": session_id,
            "metrics": metrics_result.data[0] if metrics_result.data else None,
            "blocked_items": blocked_result.data,
            "session_info": session_result.data[0] if session_result.data else None,
            "summary": {
                "total_records": len(blocked_result.data),
                "total_blocked": sum(item.get("count", 0) for item in blocked_result.data),
                "unique_sites": len(set(item.get("hostname", "") for item in blocked_result.data if item.get("hostname")))
            }
        }

        return {
            "success": True,
            "data": analytics_data
        }

    except Exception as e:
        logger.error(f"❌ Error fetching analytics: {e}")
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": str(e)}
        )

@app.get("/analytics")
async def analytics_frontend(request: Request):
    """Serve the analytics frontend page"""
    from fastapi.responses import HTMLResponse

    # Get session ID from query parameter
    session_id = request.query_params.get("session")

    html_content = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Doom Blocker Analytics</title>
        <style>
            * {{
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }}

            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: #1a1a1a;
                color: #fff;
                line-height: 1.6;
            }}

            .container {{
                max-width: 1200px;
                margin: 0 auto;
                padding: 20px;
            }}

            .header {{
                text-align: center;
                margin-bottom: 40px;
                padding: 20px 0;
                border-bottom: 1px solid #333;
            }}

            .header h1 {{
                color: #ff9823;
                font-size: 2.5rem;
                margin-bottom: 10px;
            }}

            .header p {{
                color: #ccc;
                font-size: 1.1rem;
            }}

            .stats-grid {{
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 20px;
                margin-bottom: 40px;
            }}

            .stat-card {{
                background: #252525;
                border-radius: 12px;
                padding: 24px;
                border: 1px solid #333;
                transition: transform 0.2s ease;
            }}

            .stat-card:hover {{
                transform: translateY(-2px);
                border-color: #ff9823;
            }}

            .stat-number {{
                font-size: 2.5rem;
                font-weight: bold;
                color: #ff9823;
                margin-bottom: 8px;
            }}

            .stat-label {{
                color: #ccc;
                font-size: 1rem;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }}

            .loading {{
                text-align: center;
                padding: 60px 20px;
                color: #ccc;
                font-size: 1.2rem;
            }}

            .error {{
                text-align: center;
                padding: 60px 20px;
                color: #ff6b6b;
                font-size: 1.2rem;
            }}

            .activity-section {{
                background: #252525;
                border-radius: 12px;
                padding: 24px;
                border: 1px solid #333;
                margin-bottom: 20px;
            }}

            .section-title {{
                color: #ff9823;
                font-size: 1.5rem;
                margin-bottom: 20px;
                padding-bottom: 10px;
                border-bottom: 1px solid #333;
            }}

            .activity-item {{
                padding: 12px 0;
                border-bottom: 1px solid #333;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }}

            .activity-item:last-child {{
                border-bottom: none;
            }}

            .activity-text {{
                color: #ccc;
                flex: 1;
            }}

            .activity-count {{
                color: #ff9823;
                font-weight: bold;
                margin-left: 10px;
            }}

            .session-info {{
                background: #252525;
                border-radius: 12px;
                padding: 24px;
                border: 1px solid #333;
                margin-bottom: 20px;
            }}

            .info-row {{
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
                border-bottom: 1px solid #333;
            }}

            .info-row:last-child {{
                border-bottom: none;
            }}

            .info-label {{
                color: #999;
            }}

            .info-value {{
                color: #fff;
                font-weight: 500;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>📊 Doom Blocker Analytics</h1>
                <p>Your content filtering insights and statistics</p>
            </div>

            <div id="content">
                <div class="loading">
                    Loading your analytics data...
                </div>
            </div>
        </div>

        <script>
            const sessionId = "{session_id or ''}";

            async function loadAnalytics() {{
                try {{
                    if (!sessionId) {{
                        document.getElementById('content').innerHTML = `
                            <div class="error">
                                No session ID provided. Please access analytics through the extension.
                            </div>
                        `;
                        return;
                    }}

                    const response = await fetch(`/api/analytics/${{sessionId}}`);
                    const result = await response.json();

                    if (!result.success) {{
                        throw new Error(result.error || 'Failed to load analytics');
                    }}

                    const data = result.data;
                    renderAnalytics(data);

                }} catch (error) {{
                    console.error('Error loading analytics:', error);
                    document.getElementById('content').innerHTML = `
                        <div class="error">
                            Failed to load analytics: ${{error.message}}
                        </div>
                    `;
                }}
            }}

            function renderAnalytics(data) {{
                const metrics = data.metrics || {{}};
                const summary = data.summary || {{}};
                const sessionInfo = data.session_info || {{}};
                const blockedItems = data.blocked_items || [];

                // Group blocked items by hostname
                const siteStats = {{}};
                blockedItems.forEach(item => {{
                    const hostname = item.hostname || 'Unknown';
                    if (!siteStats[hostname]) {{
                        siteStats[hostname] = 0;
                    }}
                    siteStats[hostname] += item.count || 0;
                }});

                const sortedSites = Object.entries(siteStats)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 10);

                document.getElementById('content').innerHTML = `
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-number">${{metrics.total_blocked || 0}}</div>
                            <div class="stat-label">Total Blocked</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${{metrics.blocked_today || 0}}</div>
                            <div class="stat-label">Blocked Today</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${{summary.unique_sites || 0}}</div>
                            <div class="stat-label">Sites Protected</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${{blockedItems.length}}</div>
                            <div class="stat-label">Filter Events</div>
                        </div>
                    </div>

                    <div class="session-info">
                        <h2 class="section-title">Session Information</h2>
                        <div class="info-row">
                            <span class="info-label">Session ID:</span>
                            <span class="info-value">${{data.session_id.substring(0, 8)}}...</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Extension Version:</span>
                            <span class="info-value">${{sessionInfo.extension_version || 'Unknown'}}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Created:</span>
                            <span class="info-value">${{new Date(sessionInfo.created_at || Date.now()).toLocaleDateString()}}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">First Install:</span>
                            <span class="info-value">${{sessionInfo.first_install ? 'Yes' : 'No'}}</span>
                        </div>
                    </div>

                    <div class="activity-section">
                        <h2 class="section-title">Top Sites by Blocked Content</h2>
                        ${{sortedSites.length > 0 ? sortedSites.map(([site, count]) => `
                            <div class="activity-item">
                                <span class="activity-text">${{site}}</span>
                                <span class="activity-count">${{count}} items</span>
                            </div>
                        `).join('') : '<div class="activity-text">No data available</div>'}}
                    </div>

                    <div class="activity-section">
                        <h2 class="section-title">All Blocked Items (${{blockedItems.length}} total)</h2>
                        <div style="max-height: 400px; overflow-y: auto; border: 1px solid #333; border-radius: 8px; padding: 10px;">
                        ${{blockedItems.map(item => `
                            <div class="activity-item">
                                <div class="activity-text">
                                    <div style="font-weight: 500; margin-bottom: 4px;">
                                        ${{new Date(item.timestamp).toLocaleString()}} - ${{item.hostname || 'Unknown'}}
                                    </div>
                                    ${{item.blocked_items && item.blocked_items.length > 0 ? `
                                        <div style="font-size: 0.9em; color: #999; margin-left: 20px;">
                                            ${{'• ' + item.blocked_items.slice(0, 3).map(blockedItem =>
                                                typeof blockedItem === 'string' ? blockedItem :
                                                (blockedItem.text || blockedItem.title || 'Blocked content')
                                            ).join('<br>• ')}}
                                            ${{item.blocked_items.length > 3 ? `<br>• ...and ${{item.blocked_items.length - 3}} more` : ''}}
                                        </div>
                                    ` : ''}}
                                </div>
                                <span class="activity-count">${{item.count}} blocked</span>
                            </div>
                        `).join('')}}
                        </div>
                    </div>
                `;
            }}

            // Load analytics on page load
            loadAnalytics();
        </script>
    </body>
    </html>
    """

    return HTMLResponse(content=html_content)

@app.post("/fetch_distracting_chunks")
async def fetch_distracting_chunks(analysis_request: GridAnalysisRequest, request: Request):
    # Get correlation ID from request state
    correlation_id = getattr(request.state, 'correlation_id', str(uuid.uuid4()))
    
    # Track the request by IP address
    client_ip = get_client_ip(request)
    request_count = track_ip_request(client_ip)
    
    logger.info("AI analysis request received", 
                correlation_id=correlation_id,
                ip=client_ip,
                url=analysis_request.currentUrl,
                grids_count=len(analysis_request.gridStructure.get('grids', [])),
                request_count=request_count)

    # DISABLED: Update visitor telemetry in Supabase (fire and forget)
    # asyncio.create_task(update_visitor_telemetry(analysis_request.visitorId))

    # Check rate limit
    if request_count > 3000:
        logger.warning("Rate limit exceeded", 
                      correlation_id=correlation_id,
                      ip=client_ip,
                      request_count=request_count)
        raise HTTPException(
            status_code=429,
            detail="RATE_LIMIT_EXCEEDED"
        )

    start_time = time.time()

    # Log grid structure details
    grid_structure = analysis_request.gridStructure
    total_grids = grid_structure.get('totalGrids', 0)
    total_children = sum(grid.get('totalChildren', 0) for grid in grid_structure.get('grids', []))

    # Check cache first
    cache_key = get_cache_key(grid_structure, analysis_request.currentUrl, 
                             analysis_request.whitelist, analysis_request.blacklist)
    cached_response = get_cached_response(cache_key)
    
    if cached_response is not None:
        logger.info(f"⚡ Returning cached response - Total time: {time.time() - start_time:.3f}s")
        return cached_response

    try:
        prompt_start = time.time()
        base_system_instruction = get_prompt_for_url(analysis_request.currentUrl, analysis_request.whitelist, analysis_request.blacklist)
        logger.info(f"📋 Base system instruction loaded ({time.time() - prompt_start:.3f}s)")

        # Check if OpenAI API is configured
        if not OPENAI_HEADERS:
            logger.error("OpenAI API not configured",
                        correlation_id=correlation_id,
                        error="OPENAI_API_KEY missing")
            raise HTTPException(
                status_code=503,
                detail="AI_SERVICE_UNAVAILABLE: OpenAI API not configured"
            )

        # Process entire grid structure in one API call
        api_start = time.time()

        # Clean grid data before sending to LLM
        cleaned_grid = clean_grid_structure_for_llm(grid_structure)

        # Build strong system prompt with explicit schema and valid IDs to avoid hallucinations
        def get_valid_child_ids(cleaned):
            ids = []
            for grid in cleaned.get('grids', []):
                for child in grid.get('children', []):
                    cid = child.get('id')
                    if cid:
                        ids.append(cid)
            return ids

        def build_system_prompt(base_prompt: str, cleaned: dict) -> str:
            valid_ids = get_valid_child_ids(cleaned)
            ids_block = "\n".join(valid_ids)
            rules = (
                "\n\nSTRICT OUTPUT RULES:\n"
                "- Output ONLY a newline-separated list of child IDs to hide (e.g., g1c0, g1c5).\n"
                "- Do NOT include any explanations, JSON, code fences, or extra text.\n"
                "- If nothing should be hidden, return an empty string.\n"
                "- You MUST only return IDs from the VALID_CHILD_IDS list below. Never invent IDs.\n"
                "- Prefer to hide content matching blacklist terms and unrelated to whitelist intent.\n"
                "\nVALID_CHILD_IDS:\n" + ids_block + "\n"
            )
            return f"{base_prompt}{rules}"

        system_instruction = build_system_prompt(base_system_instruction, cleaned_grid)
        content = json.dumps(cleaned_grid, indent=2)
        
        # DEBUG: Log what we're sending to the AI
        if logger.isEnabledFor(logging.DEBUG):
            logger.debug(f"Sending to AI - URL only")
            logger.debug(f"Grid structure has {len(cleaned_grid.get('grids', []))} grids")
            logger.debug(f"Total children: {sum(grid.get('totalChildren', 0) for grid in cleaned_grid.get('grids', []))}")


        payload = {
            "model": "gpt-4o-mini",  # Use a valid OpenAI model
            "messages": [
                {
                    "role": "system",
                    "content": system_instruction
                },
                {
                    "role": "user",
                    "content": content
                }
            ],
            "max_tokens": 256,  # Much smaller for faster response
            "temperature": 0.6  # Deterministic for consistent results
        }

        # Use circuit breaker for OpenAI API call
        async def make_openai_request():
            timeout = httpx.Timeout(30.0, connect=10.0, read=25.0, write=10.0)
            async with httpx.AsyncClient(timeout=timeout) as client:
                response = await client.post(OPENAI_URL, headers=OPENAI_HEADERS, json=payload)
                if response.status_code != 200:
                    raise Exception(f"OpenAI API error: {response.status_code} - {response.text}")
                return response
        
        try:
            response = await openai_circuit_breaker.call(make_openai_request)
        except Exception as e:
            logger.error("OpenAI API call failed", 
                        correlation_id=correlation_id,
                        error=str(e),
                        circuit_breaker_state=openai_circuit_breaker.state)
            
            # Provide graceful fallback
            if openai_circuit_breaker.state == 'OPEN':
                logger.info("Using fallback due to circuit breaker open", 
                           correlation_id=correlation_id)
                result = fallback_keyword_matching(cleaned_grid, analysis_request.blacklist)
                total_children_to_remove = len(result)
                
                total_duration = time.time() - start_time
                logger.info("Fallback completed", 
                           correlation_id=correlation_id,
                           duration=total_duration,
                           items_found=total_children_to_remove)
                
                return result
            else:
                raise HTTPException(status_code=502, detail="AI service temporarily unavailable")

        api_result = response.json()
        response_content = api_result['choices'][0]['message']['content'].strip()

        api_duration = time.time() - api_start
        logger.info(f"✅ OpenAI API call completed ({api_duration:.3f}s)")
        
        if logger.isEnabledFor(logging.DEBUG):
            logger.debug(f"AI response length: {len(response_content)} chars")

        # Parse and sanitize the result
        parse_start = time.time()

        def sanitize_llm_response(text: str, cleaned: dict) -> str:
            """Extract only valid child IDs present in the cleaned grid from arbitrary model text."""
            try:
                # Collect valid IDs set
                valid = set()
                for grid in cleaned.get('grids', []):
                    for child in grid.get('children', []):
                        cid = child.get('id')
                        if cid:
                            valid.add(cid)
                # Regex to find tokens like g12c3 etc.
                ids = re.findall(r"g\d+c\d+", text or "")
                # Filter to only valid ids and deduplicate preserving order
                seen = set()
                filtered = []
                for cid in ids:
                    if cid in valid and cid not in seen:
                        filtered.append(cid)
                        seen.add(cid)
                return "\n".join(filtered)
            except Exception:
                return ""

        # Sanitize first, then convert
        sanitized = sanitize_llm_response(response_content, cleaned_grid)
        if sanitized and sanitized.strip():
            result = convert_newline_format_to_json(sanitized)
            total_children_to_remove = len([child for child in sanitized.split('\n') if child.strip()])
        else:
            # FALLBACK: If AI returns empty, try simple keyword matching
            logger.warning("🤖 AI returned empty response, trying fallback keyword matching")
            result = fallback_keyword_matching(cleaned_grid, analysis_request.blacklist)
            total_children_to_remove = len(result)
            logger.info(f"🔄 Fallback found {total_children_to_remove} items to remove")

        parse_duration = time.time() - parse_start
        logger.info(f"🎯 Found {total_children_to_remove} children to remove ({parse_duration:.3f}s)")

        total_duration = time.time() - start_time
        logger.info(f"✅ Request completed successfully - Total time: {total_duration:.3f}s")
        logger.info(f"⏱️  Breakdown: API={api_duration:.3f}s, Other={total_duration-api_duration:.3f}s")

        # REMOVED: Don't count as blocked until extension confirms they were actually hidden
        # increment_blocked_counter(total_children_to_remove)

        # Cache the response for future requests
        cache_response(cache_key, result)

        return result

    except Exception as e:
        error_duration = time.time() - start_time
        logger.error("Request failed after %.3fs: %s" % (error_duration, str(e)))
        raise HTTPException(status_code=500, detail="Internal server error")


def split_grid_into_chunks(grid_structure, chunk_size):
    """
    Split grid structure into chunks for batched API requests
    Splits by total children count across all grids
    """
    # Handle invalid input
    if not grid_structure or not grid_structure.get('grids') or not isinstance(grid_structure.get('grids'), list):
        return [grid_structure]

    # Collect all children with their parent grid info
    all_children_with_grid_info = []
    for grid in grid_structure.get('grids', []):
        if grid.get('children') and isinstance(grid.get('children'), list):
            for child in grid['children']:
                all_children_with_grid_info.append({
                    'child': child,
                    'gridId': grid['id'],
                    'gridText': grid['gridText']
                })

    # If total children <= chunk size, return original structure
    if len(all_children_with_grid_info) <= chunk_size:
        return [grid_structure]

    # Split children into chunks
    chunks = []
    for i in range(0, len(all_children_with_grid_info), chunk_size):
        children_chunk = all_children_with_grid_info[i:i + chunk_size]

        # Group children by their parent grid
        grid_map = {}
        for item in children_chunk:
            if item['gridId'] not in grid_map:
                grid_map[item['gridId']] = {
                    'id': item['gridId'],
                    'gridText': item['gridText'],
                    'children': []
                }
            grid_map[item['gridId']]['children'].append(item['child'])

        # Convert map to array and create chunk with proper structure
        chunk_grids = list(grid_map.values())
        chunk = {
            'timestamp': grid_structure.get('timestamp'),
            'totalGrids': len(chunk_grids),
            'grids': chunk_grids
        }
        chunks.append(chunk)

    return chunks


def clean_grid_structure_for_llm(grid_structure):
    """
    Optimize grid structure for LLM by removing unnecessary data and limiting content
    """
    cleaned_structure = {
        'totalGrids': grid_structure.get('totalGrids', 0),
        'grids': []
    }

    if 'grids' in grid_structure:
        for grid in grid_structure['grids']:
            # Limit to essential data only
            cleaned_grid = {
                'id': grid.get('id'),
                'totalChildren': grid.get('totalChildren', 0),
                'children': []
            }
            
            # Add grid text if available (truncated for performance)
            if 'gridText' in grid:
                grid_text = grid['gridText']
                # Truncate grid text to prevent huge payloads
                if len(grid_text) > 500:
                    grid_text = grid_text[:500] + "..."
                cleaned_grid['gridText'] = grid_text

            # Process children with size limits - PRIORITIZE VISIBLE CONTENT
            if 'children' in grid:
                children = grid['children']
                # Limit to only the first 10 children (most visible) for faster processing
                max_children = 10  # Further reduced for speed
                if len(children) > max_children:
                    children = children[:max_children]
                
                for child in children:
                    cleaned_child = {
                        'id': child.get('id'),
                        'text': child.get('text', '')
                    }
                    # Truncate child text to prevent huge payloads
                    if len(cleaned_child['text']) > 50:  # Further reduced to 50 chars
                        cleaned_child['text'] = cleaned_child['text'][:50] + "..."
                    cleaned_grid['children'].append(cleaned_child)

            cleaned_structure['grids'].append(cleaned_grid)

    return cleaned_structure

def fallback_keyword_matching(cleaned_grid, blacklist):
    """
    Fallback keyword matching when AI returns empty response
    """
    if not blacklist or not cleaned_grid.get('grids'):
        return []
    
    result = []
    blacklist_lower = [keyword.lower() for keyword in blacklist]
    
    for grid in cleaned_grid.get('grids', []):
        for child in grid.get('children', []):
            child_text = child.get('text', '').lower()
            child_id = child.get('id')
            
            # Check if any blacklist keyword is in the child text
            for keyword in blacklist_lower:
                if keyword in child_text:
                    # Convert to the format expected by the frontend
                    grid_id = child_id.split('c')[0] if 'c' in child_id else grid.get('id', 'g1')
                    result.append({grid_id: [child_id]})
                    break  # Only add once per child
    
    return result

def convert_newline_format_to_json(newline_format):
    """
    Convert newline-separated child IDs back to original JSON format.

    Input: "g1c0\ng1c5\ng2c3"
    Output: [{"g1":["g1c0","g1c5"]},{"g2":["g2c3"]}]
    """
    if not newline_format or not newline_format.strip():
        return []

    # Parse child IDs and group by grid
    grid_map = {}
    child_ids = [child.strip() for child in newline_format.split('\n') if child.strip()]

    for child_id in child_ids:
        # Extract grid ID from child ID (e.g., "g1c0" -> "g1")
        if 'c' in child_id:
            grid_id = child_id.split('c')[0]
            if grid_id not in grid_map:
                grid_map[grid_id] = []
            grid_map[grid_id].append(child_id)

    # Convert to original JSON format
    result = []
    for grid_id, children in grid_map.items():
        result.append({grid_id: children})

    return result

def combine_chunk_results(chunk_results):
    """
    Combine results from multiple chunk API requests
    """
    # Check if any chunk failed
    for result in chunk_results:
        if not result.get('success'):
            return {
                'success': False,
                'error': result.get('error', 'One or more chunks failed')
            }

    # Combine all successful results
    combined_data = []
    for result in chunk_results:
        if result.get('data') and isinstance(result.get('data'), str):
            if result['data'].strip():  # Only add non-empty strings
                combined_data.append(result['data'].strip())

    # Join all chunks with newlines
    newline_format = '\n'.join(combined_data)

    # Convert back to original JSON format
    json_format = convert_newline_format_to_json(newline_format)

    return {
        'success': True,
        'data': json_format
    }

# API routes from server.js
# @app.get("/profile", response_class=FileResponse)
# async def profile(user: Dict = Depends(require_auth)):
#     """Serve the profile page."""
#     return FileResponse(Path(__file__).parent / "static" / "profile.html")

# @app.get("/api/profile-data")
# async def profile_data(user: Dict = Depends(require_auth)):
#     """Get profile data."""
#     try:
#         return {"user": user}
#     except Exception as e:
#         return JSONResponse(
#             status_code=500,
#             content={"error": f"Server error: {str(e)}"}
#         )

# @app.get("/api/user-info")
# async def user_info(user: Dict = Depends(require_auth)):
#     """Get user info."""
#     try:
#         return user
#     except Exception as e:
#         return JSONResponse(
#             status_code=500,
#             content={"error": f"Server error: {str(e)}"}
#         )

# @app.get("/api/config")
# async def get_config():
#     """Get Supabase configuration."""
#     try:
#         return {
#             "supabaseUrl": SUPABASE_URL,
#             "supabaseKey": SUPABASE_KEY,
#         }
#     except Exception as e:
#         return JSONResponse(
#             status_code=500,
#             content={"error": f"Server error: {str(e)}"}
#         )

# @app.get("/api/auth-status")
# async def auth_status(request: Request):
#     """Check authentication status."""
#     try:
#         user = get_user_from_session(request)
#         authenticated = is_authenticated(request)
#         return {
#             "isAuthenticated": authenticated,
#             "user": user if authenticated else None,
#         }
#     except Exception as e:
#         return JSONResponse(
#             status_code=500,
#             content={"error": f"Server error: {str(e)}"}
#         )

# @app.post("/api/logout")
# async def api_logout(request: Request, response: Response):
#     """Handle user logout."""
#     try:
#         # Clear session
#         was_authenticated = is_authenticated(request)
#         if was_authenticated:
#             request.session.pop("user", None)
#             response.delete_cookie("session")
#             # Clear auth cookies similar to Express.js implementation
#             response.delete_cookie("appSession")
#             response.delete_cookie("auth0.is.authenticated")

#         # Simple confirmation response
#         return {"success": True}
#     except Exception as e:
#         return JSONResponse(
#             status_code=500,
#             content={"error": f"Server error: {str(e)}"}
#         )

# @app.post("/api/check-username")
# async def check_username(data: Username):
#     """Check username availability."""
#     try:
#         username = data.username
#         if not username or username.strip() == "":
#             return JSONResponse(
#                 status_code=400,
#                 content={"error": "Username is required"}
#             )

#         clean_username = username.strip()

#         # Check if username exists in Supabase
#         try:
#             existing_score = supabase.table("game_scores").select("id").eq("username", clean_username).execute()

#             return {
#                 "success": True,
#                 "available": len(existing_score.data) == 0,
#                 "username": clean_username,
#             }
#         except Exception as supabase_error:
#             logger.error(f"Supabase error: {supabase_error}")
#             return JSONResponse(
#                 status_code=500,
#                 content={"error": f"Database error: {str(supabase_error)}"}
#             )
#     except Exception as e:
#         return JSONResponse(
#             status_code=500,
#             content={"error": f"Server error: {str(e)}"}
#         )

# @app.post("/api/save-score")
# async def save_score(data: ScoreData):
#     """Save user score."""
#     try:
#         username = data.username
#         score = data.score

#         if not username or username.strip() == "":
#             return JSONResponse(
#                 status_code=400,
#                 content={"error": "Username is required"}
#             )

#         if not isinstance(score, int):
#             return JSONResponse(
#                 status_code=400,
#                 content={"error": "Score must be a number"}
#             )

#         clean_username = username.strip()

#         # Check if user already exists and get their current high score
#         existing_scores = supabase.table("game_scores").select("score").eq("username", clean_username).execute()

#         if existing_scores.data:
#             # User exists, check if this is a new high score
#             current_high_score = max(score_record["score"] for score_record in existing_scores.data)
#             if score > current_high_score:
#                 # New high score - insert new record
#                 supabase.table("game_scores").insert({"username": clean_username, "score": score}).execute()
#                 return {
#                     "success": True,
#                     "username": clean_username,
#                     "score": score,
#                     "message": "New high score saved!",
#                     "highScore": score,
#                 }
#             else:
#                 # Not a high score, but still save the attempt
#                 supabase.table("game_scores").insert({"username": clean_username, "score": score}).execute()
#                 return {
#                     "success": True,
#                     "username": clean_username,
#                     "score": score,
#                     "message": "Score saved!",
#                     "highScore": current_high_score,
#                 }
#         else:
#             # New user - save score
#             supabase.table("game_scores").insert({"username": clean_username, "score": score}).execute()
#             return {
#                 "success": True,
#                 "username": clean_username,
#                 "score": score,
#                 "message": "New high score saved!",
#                 "highScore": score,
#             }
#     except Exception as e:
#         return JSONResponse(
#             status_code=500,
#             content={"error": f"Server error: {str(e)}"}
#         )

# @app.get("/api/leaderboard")
# async def leaderboard():
#     """Get leaderboard data."""
#     try:
#         # Get all scores from Supabase, grouped by username with max score
#         scores = supabase.table("game_scores").select("username, score").execute()

#         if not scores.data:
#             return {
#                 "success": True,
#                 "leaderboard": [],
#             }

#         # Group by username and get highest score for each user
#         user_scores = {}
#         for score_record in scores.data:
#             username = score_record["username"]
#             score = score_record["score"]
#             if username not in user_scores or score > user_scores[username]:
#                 user_scores[username] = score

#         # Convert to list format and sort by score descending
#         leaderboard = [{"username": username, "score": score} for username, score in user_scores.items()]
#         leaderboard.sort(key=lambda x: x["score"], reverse=True)

#         return {
#             "success": True,
#             "leaderboard": leaderboard,
#         }
#     except Exception as e:
#         return JSONResponse(
#             status_code=500,
#             content={"error": f"Server error: {str(e)}"}
#         )

# @app.get("/game")
# async def game():
#     return RedirectResponse(url="/#game-banner")

# @app.get("/")
# async def root():
#     """Serve the landing page."""
#     return FileResponse(Path(__file__).parent / "static" / "index.html")

# Serve individual CSS and JS files
# @app.get("/styles.css")
# async def get_styles():
#     return FileResponse(Path(__file__).parent / "static" / "styles.css")

# @app.get("/script.js")
# async def get_script():
#     return FileResponse(Path(__file__).parent / "static" / "script.js")

# Mount static files - put at the end to avoid conflicts with API routes
# app.mount("/assets", StaticFiles(directory="static/assets"), name="assets")
# app.mount("/static", StaticFiles(directory="static"), name="static")

logger.info("Prompts loaded successfully")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    logger.info("Starting server on localhost:%s" % port)
    uvicorn.run(app, host="localhost", port=port)
