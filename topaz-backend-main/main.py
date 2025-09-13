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

from pydantic import BaseModel, Field
# from starlette.middleware.sessions import SessionMiddleware
# from authlib.integrations.starlette_client import OAuth, OAuthError
from supabase import create_client, Client

# HTTP requests
import requests

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables
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

app = FastAPI(title="Topaz Backend", version="1.0.0")

# Add startup event for debugging
@app.on_event("startup")
async def startup_event():
    logger.info("🚀 Topaz Backend starting up...")
    logger.info(f"📁 Current working directory: {os.getcwd()}")
    logger.info(f"📄 Prompts loaded: {len(prompts_data)} patterns")
    logger.info(f"🔑 Groq configured: {GROQ_HEADERS is not None}")
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

# Add session middleware
# app.add_middleware(
#     SessionMiddleware,
#     secret_key=os.getenv("AUTH0_SECRET", "your-secret-key"),
#     max_age=3600,  # 1 hour in seconds
# )

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
    """Update visitor telemetry in Supabase asynchronously"""
    if not supabase:
        logger.debug("Supabase not available - skipping telemetry update")
        return
        
    try:
        # First try to insert a new record
        supabase.table("telemetry").insert({
            "visitorid": visitor_id,
            "request_count": 1
        }).execute()
        logger.debug(f"Inserted new telemetry record for visitor {visitor_id}")
    except Exception:
        # If insert fails (visitor already exists), update the existing record
        try:
            # Get current count and increment it
            current = supabase.table("telemetry").select("request_count").eq("visitorid", visitor_id).single().execute()
            new_count = current.data["request_count"] + 1

            supabase.table("telemetry").update({
                "last_seen": "now()",
                "request_count": new_count
            }).eq("visitorid", visitor_id).execute()

            logger.debug(f"Updated telemetry for visitor {visitor_id} (count: {new_count})")
        except Exception as e:
            logger.debug(f"Telemetry update failed (table may not exist): {str(e)}")

# oauth = OAuth()
# oauth.register(
#     name="auth0",
#     client_id=AUTH0_CLIENT_ID,
#     client_secret=AUTH0_CLIENT_SECRET,
#     client_kwargs={"scope": "openid profile email"},
#     server_metadata_url=f"https://{AUTH0_DOMAIN}/.well-known/openid-configuration",
# )

logger.info("Initializing Groq API configuration...")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    logger.warning("GROQ_API_KEY not found - AI analysis will be disabled")
    GROQ_HEADERS = None
else:
    GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
    GROQ_HEADERS = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    logger.info("Groq client initialized successfully")

class GridAnalysisRequest(BaseModel):
    gridStructure: dict
    currentUrl: str
    whitelist: list[str] = []
    blacklist: list[str] = []
    visitorId: str

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
        "message": "Topaz Backend API",
        "status": "running",
        "timestamp": time.time(),
        "endpoints": {
            "health": "/health",
            "docs": "/docs",
            "blocked_count": "/api/blocked-count",
            "ai_analysis": "/fetch_distracting_chunks"
        }
    }

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "groq_configured": GROQ_HEADERS is not None
    }

# REST endpoint to get current counter (optional)
@app.get("/api/blocked-count")
async def get_blocked_count():
    """Get the current count of blocked items"""
    return {
        "count": blocked_items_counter['count'],
        "last_updated": blocked_items_counter['last_updated']
    }

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



@app.post("/fetch_distracting_chunks")
async def fetch_distracting_chunks(analysis_request: GridAnalysisRequest, request: Request): # user: Dict = Depends(require_auth)):
    # Configuration - process entire grid structure in one call

    # Track the request by IP address
    client_ip = request.client.host if request.client else "unknown"
    request_count = track_ip_request(client_ip)

    # Update visitor telemetry in Supabase (fire and forget)
    asyncio.create_task(update_visitor_telemetry(analysis_request.visitorId))

    # Check rate limit
    if request_count > 3000:

        raise HTTPException(
            status_code=429,
            detail="RATE_LIMIT_EXCEEDED"
        )

    start_time = time.time()


    # Log grid structure details
    grid_structure = analysis_request.gridStructure
    total_grids = grid_structure.get('totalGrids', 0)
    total_children = sum(grid.get('totalChildren', 0) for grid in grid_structure.get('grids', []))

    try:
        prompt_start = time.time()
        system_instruction = get_prompt_for_url(analysis_request.currentUrl, analysis_request.whitelist, analysis_request.blacklist)
        logger.info(f"📋 System instruction loaded for URL pattern ({time.time() - prompt_start:.3f}s)")

        # Check if Groq API is configured
        if not GROQ_HEADERS:
            raise HTTPException(
                status_code=503,
                detail="AI_SERVICE_UNAVAILABLE: Groq API not configured"
            )

        # Process entire grid structure in one API call
        api_start = time.time()

        # Clean grid data before sending to LLM
        cleaned_grid = clean_grid_structure_for_llm(grid_structure)
        content = json.dumps(cleaned_grid, indent=2)


        payload = {
            "model": "llama3-70b-8192",
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
            "temperature": 0.1,
            "max_tokens": 4096,
            "top_p": 1,
            "stream": False,
            "stop": None
        }

        response = requests.post(GROQ_URL, headers=GROQ_HEADERS, json=payload)

        if response.status_code != 200:

            raise HTTPException(status_code=500, detail=f"Groq API error: {response.status_code} - {response.text}")

        api_result = response.json()
        response_content = api_result['choices'][0]['message']['content'].strip()

        api_duration = time.time() - api_start
        logger.info(f"✅ Groq API call completed ({api_duration:.3f}s)")

        # Parse the result
        parse_start = time.time()

        # Convert newline format to JSON format
        if response_content and response_content.strip():
            result = convert_newline_format_to_json(response_content)
            total_children_to_remove = len([child for child in response_content.split('\n') if child.strip()])
        else:
            result = []
            total_children_to_remove = 0

        parse_duration = time.time() - parse_start
        logger.info(f"🎯 Found {total_children_to_remove} children to remove ({parse_duration:.3f}s)")

        total_duration = time.time() - start_time
        logger.info(f"✅ Request completed successfully - Total time: {total_duration:.3f}s")
        logger.info(f"⏱️  Breakdown: API={api_duration:.3f}s, Other={total_duration-api_duration:.3f}s")

        # Update blocked items counter
        increment_blocked_counter(total_children_to_remove)

        return result

    except Exception as e:
        error_duration = time.time() - start_time
        logger.error("Request failed after %.3fs: %s" % (error_duration, str(e)))

        raise HTTPException(status_code=500, detail=str(e))


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
    Remove image keys from grid structure before sending to LLM (preserves gridTag)
    """
    cleaned_structure = json.loads(json.dumps(grid_structure))  # Deep copy

    if 'grids' in cleaned_structure:
        for grid in cleaned_structure['grids']:
            # gridTag is now preserved and sent to LLM

            # Remove image keys from children
            if 'children' in grid:
                for child in grid['children']:
                    if 'image' in child:
                        del child['image']

    return cleaned_structure

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
