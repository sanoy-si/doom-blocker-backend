# Topaz Backend

A FastAPI-based backend server that integrates the Topaz landing page with AI-powered grid analysis functionality.

## Overview

This project combines the Topaz landing page (previously served by a separate Node.js server) with the main backend API in a single FastAPI application. The server handles both static file serving for the landing page and API endpoints for authentication, game functionality, and AI-powered content analysis.

## Features

- **Landing Page**: Integrated static file serving for the Topaz landing page
- **Authentication**: Auth0 integration for user login/logout
- **Game API**: Leaderboard and score tracking functionality
- **AI Analysis**: Gemini-powered grid analysis for content filtering
- **Database**: Supabase integration for data storage

## Project Structure

```
topaz-backend/
├── main.py              # Main FastAPI application
├── static/              # Landing page files (moved from landing-page/)
│   ├── index.html       # Main landing page
│   ├── styles.css       # CSS styles
│   ├── script.js        # JavaScript functionality
│   ├── logo/            # Logo files
│   │   ├── logo.svg     # SVG logo
│   │   └── logo.ico     # Favicon
│   └── media/           # Media files for animations
├── prompts.json         # AI prompts configuration
├── gridstructure.json   # Sample grid structure for testing
└── .env.local          # Environment variables
```

## API Endpoints

### Public Endpoints
- `GET /` - Serves the landing page
- `GET /styles.css` - CSS file
- `GET /script.js` - JavaScript file
- `GET /static/*` - Static files (CSS, JS)
- `GET /logo/*` - Logo files (SVG, ICO)
- `GET /media/*` - Media files (images for animations)
- `GET /api/config` - Supabase configuration
- `GET /api/auth-status` - Authentication status
- `GET /api/leaderboard` - Game leaderboard
- `POST /api/check-username` - Check username availability
- `POST /api/save-score` - Save game score

### Authentication Endpoints
- `GET /login` - Initiate Auth0 login
- `GET /callback` - Auth0 callback handler
- `GET /logout` - Logout and redirect to Auth0 logout
- `POST /api/logout` - API logout endpoint

### Protected Endpoints (Require Authentication)
- `POST /fetch_distracting_chunks` - AI-powered grid analysis
- `GET /gemini_ping` - Test Gemini API connection
- `GET /profile` - User profile page
- `GET /api/profile-data` - User profile data
- `GET /api/user-info` - User information

## Environment Variables

Create a `.env.local` file with the following variables:

```env
# Auth0 Configuration
AUTH0_SECRET=your-auth0-secret-here
AUTH0_BASE_URL=http://localhost:8000
AUTH0_CLIENT_ID=your-auth0-client-id
AUTH0_ISSUER_BASE_URL=https://your-domain.auth0.com

# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key

# Gemini API
GEMINI_API_KEY=your-gemini-api-key
```

## Installation & Setup

1. Install dependencies:
   ```bash
   pip install fastapi uvicorn python-dotenv authlib supabase google-genai httpx
   ```

2. Set up environment variables in `.env.local`

3. Run the server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```

4. Access the application at `http://localhost:8000`

## Integration Notes

### Landing Page Integration
- The landing page files were moved from `landing-page/` to `static/`
- Static file serving is handled by FastAPI's `StaticFiles`
- The frontend JavaScript now uses relative URLs (empty `BACKEND_URL`)
- All API calls go through the same server

### Authentication Flow
- Auth0 is used for authentication
- Session management is handled by FastAPI's session middleware
- Protected endpoints require authentication via dependency injection

### Database Integration
- Supabase is used for storing game scores and user data
- The leaderboard API aggregates scores by username
- Score saving includes high score tracking

## Development

To test the integration:

```bash
python test_integration.py
```

This will run basic tests to verify that:
- Static files are served correctly
- API endpoints respond properly
- Authentication requirements are enforced
- Required files exist

## Migration from Separate Server

This setup replaces the previous Node.js server (`server.js`) that was handling the landing page. All functionality has been integrated into the main FastAPI application:

- Static file serving
- API endpoints
- Authentication handling
- Database operations
- Environment configuration

The frontend code was updated to use relative URLs since everything now runs on the same server.