# 🚀 Google Cloud Run Deployment Guide

This guide will help you deploy your Topaz Backend to Google Cloud Run.

## 📋 Prerequisites

Before you begin, make sure you have:

1. **Google Cloud Account** with billing enabled
2. **Google Cloud SDK (gcloud)** installed
3. **Docker** installed and running
4. **Project created** in Google Cloud Console

## 🛠️ Setup Instructions

### Step 1: Install Google Cloud SDK

#### Windows:
1. Download from: https://cloud.google.com/sdk/docs/install
2. Run the installer and follow the setup wizard
3. Restart your terminal/command prompt

#### macOS/Linux:
```bash
# macOS with Homebrew
brew install --cask google-cloud-sdk

# Linux
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
```

### Step 2: Install Docker

Download and install Docker Desktop from: https://www.docker.com/products/docker-desktop

### Step 3: Authenticate with Google Cloud

```bash
# Login to your Google account
gcloud auth login

# Set your project (replace with your actual project ID)
gcloud config set project YOUR_PROJECT_ID

# Enable Docker authentication
gcloud auth configure-docker
```

### Step 4: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name (e.g., "topaz-backend")
4. Note the Project ID (it will be used in deployment)

## 🚀 Deployment Options

### Option 1: Automated Deployment (Recommended)

#### Windows:
```cmd
cd topaz-backend-main
deploy.bat YOUR_PROJECT_ID us-central1 topaz-backend
```

#### macOS/Linux:
```bash
cd topaz-backend-main
./deploy.sh YOUR_PROJECT_ID us-central1 topaz-backend
```

### Option 2: Manual Deployment

#### Step 1: Enable Required APIs
```bash
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

#### Step 2: Build Docker Image
```bash
cd topaz-backend-main
docker build -t gcr.io/YOUR_PROJECT_ID/topaz-backend .
```

#### Step 3: Push to Container Registry
```bash
docker push gcr.io/YOUR_PROJECT_ID/topaz-backend
```

#### Step 4: Deploy to Cloud Run
```bash
gcloud run deploy topaz-backend \
    --image gcr.io/YOUR_PROJECT_ID/topaz-backend \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --memory 2Gi \
    --cpu 2 \
    --port 8080
```

## 🔐 Environment Variables Setup

### Method 1: Using gcloud CLI
```bash
gcloud run services update topaz-backend \
    --region us-central1 \
    --set-env-vars "OPENAI_API_KEY=your_api_key,API_AUTH_KEY=your_auth_key"
```

### Method 2: Using Google Cloud Console
1. Go to [Cloud Run Console](https://console.cloud.google.com/run)
2. Click on your service
3. Click "EDIT & DEPLOY NEW REVISION"
4. Go to "Variables & Secrets" tab
5. Add environment variables:
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `API_AUTH_KEY`: Your secure API authentication key
   - `ENV`: production
   - `LOG_LEVEL`: INFO

### Method 3: Using Secrets (Recommended for sensitive data)
```bash
# Create secrets
gcloud secrets create openai-api-key --data-file=<(echo -n "your_openai_api_key")

# Update service to use secrets
gcloud run services update topaz-backend \
    --region us-central1 \
    --set-secrets="OPENAI_API_KEY=openai-api-key:latest"
```

## 🌐 Custom Domain Setup (Optional)

### Step 1: Map Custom Domain
```bash
gcloud run domain-mappings create \
    --service topaz-backend \
    --domain api.yourdomain.com \
    --region us-central1
```

### Step 2: Update DNS Records
Add the DNS records shown in the Cloud Run console to your domain provider.

## 🔒 Security Configuration

### 1. Enable IAM Authentication (Optional)
```bash
gcloud run services update topaz-backend \
    --region us-central1 \
    --no-allow-unauthenticated
```

### 2. Configure CORS for Your Extension
Update your extension's API endpoint to use the new Cloud Run URL.

## 📊 Monitoring & Logging

### View Logs
```bash
gcloud run services logs read topaz-backend --region us-central1
```

### Set up Monitoring
1. Go to [Cloud Monitoring](https://console.cloud.google.com/monitoring)
2. Create alerts for:
   - High error rates
   - High latency
   - Memory usage

## 🧪 Testing Your Deployment

### Health Check
```bash
curl https://YOUR_SERVICE_URL/health
```

### API Test
```bash
curl -X POST https://YOUR_SERVICE_URL/fetch_distracting_chunks \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"gridStructure": {"grids": []}, "currentUrl": "https://example.com", "whitelist": [], "blacklist": [], "visitorId": "test"}'
```

## 💰 Cost Optimization

### 1. Set CPU Allocation
- **CPU always allocated**: Higher cost, better performance
- **CPU allocated during request processing only**: Lower cost (recommended)

### 2. Configure Autoscaling
```bash
gcloud run services update topaz-backend \
    --region us-central1 \
    --min-instances 0 \
    --max-instances 10
```

### 3. Monitor Usage
- Use Cloud Monitoring to track requests and costs
- Set up billing alerts

## 🔧 Troubleshooting

### Common Issues

#### 1. Image Build Fails
```bash
# Check Docker daemon is running
docker info

# Rebuild with verbose output
docker build -t gcr.io/YOUR_PROJECT_ID/topaz-backend . --progress=plain
```

#### 2. Push Fails
```bash
# Re-authenticate Docker
gcloud auth configure-docker
```

#### 3. Service Fails to Start
```bash
# Check logs
gcloud run services logs read topaz-backend --region us-central1

# Check service description
gcloud run services describe topaz-backend --region us-central1
```

#### 4. Environment Variables Not Working
```bash
# Verify environment variables
gcloud run services describe topaz-backend \
    --region us-central1 \
    --format="export" | grep env
```

## 📝 Update Your Extension

After deployment, update your extension's API endpoint:

In `topaz-extension-main/shared/constants.js`:
```javascript
export const CONFIG = {
  STAGING_WEBSITE: 'https://YOUR_SERVICE_URL',
  // ... other config
};
```

## 🎉 Success!

Your Topaz Backend is now running on Google Cloud Run! The service will:

- ✅ Auto-scale based on demand (0 to 10 instances)
- ✅ Handle HTTPS automatically
- ✅ Provide 99.95% availability SLA
- ✅ Scale to zero when not in use (cost-effective)

## 📞 Support

If you encounter issues:
1. Check the [troubleshooting section](#-troubleshooting)
2. Review Cloud Run logs
3. Verify environment variables
4. Test locally with Docker first