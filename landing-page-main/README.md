# Topaz Landing Page

A dynamic landing page with interactive falling images and particle explosion effects.

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Server
```bash
npm start
```

### 3. Open in Browser
Navigate to: `http://localhost:3000`

## Available Commands

- `npm start` - Start the static server on port 3000
- `npm run dev` - Same as start (development mode)
- `npm run serve` - Alternative command to start server

## Why Use a Server?

This project requires a local server instead of opening `index.html` directly because:

- **CORS Security**: The explode animation uses canvas operations (`getImageData()`) which are blocked by browsers when running from `file://` protocol
- **Cross-Origin Restrictions**: Local files are treated as different origins, causing security exceptions
- **Canvas Taint Protection**: Browsers prevent pixel data access on "tainted" canvases for security

## Features

- Interactive falling images with categories (brainrot, politics, sports)
- Particle explosion effects when images are filtered
- Email waitlist with Supabase integration
- Responsive design with smooth animations

## Troubleshooting

**Error: "The operation is insecure"**
- Make sure you're accessing the site via `http://localhost:3000` and not opening the HTML file directly
- Ensure the server is running with `npm start`

**Port 3000 already in use**
- Kill existing processes on port 3000: `lsof -ti:3000 | xargs kill -9`
- Or modify the port in `package.json`

## Project Structure

```
landing-page/
├── index.html          # Main HTML file
├── script.js           # Interactive animations and logic
├── styles.css          # Styling and responsive design
├── media/              # Image assets
├── logo/               # Logo assets
└── package.json        # Node.js dependencies
```
