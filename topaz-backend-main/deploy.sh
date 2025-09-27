#!/bin/bash

# Google Cloud Run Deployment Script for Topaz Backend
# Usage: ./deploy.sh [PROJECT_ID] [REGION] [SERVICE_NAME]

set -e  # Exit on any error

# Default values
DEFAULT_PROJECT_ID="your-gcp-project-id"
DEFAULT_REGION="us-central1"
DEFAULT_SERVICE_NAME="topaz-backend"

# Parse arguments
PROJECT_ID=${1:-$DEFAULT_PROJECT_ID}
REGION=${2:-$DEFAULT_REGION}
SERVICE_NAME=${3:-$DEFAULT_SERVICE_NAME}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting deployment to Google Cloud Run${NC}"
echo -e "${BLUE}Project ID: ${PROJECT_ID}${NC}"
echo -e "${BLUE}Region: ${REGION}${NC}"
echo -e "${BLUE}Service Name: ${SERVICE_NAME}${NC}"
echo ""

# Check if required tools are installed
echo -e "${YELLOW}📋 Checking prerequisites...${NC}"

if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI is not installed. Please install it first.${NC}"
    echo "   Download from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install it first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"

# Set the project
echo -e "${YELLOW}🔧 Setting up Google Cloud project...${NC}"
gcloud config set project $PROJECT_ID

# Enable required APIs
echo -e "${YELLOW}🔧 Enabling required Google Cloud APIs...${NC}"
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Build and tag the Docker image
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"
echo -e "${YELLOW}🏗️  Building Docker image: ${IMAGE_NAME}${NC}"

docker build -t $IMAGE_NAME .

# Push the image to Google Container Registry
echo -e "${YELLOW}📤 Pushing image to Google Container Registry...${NC}"
docker push $IMAGE_NAME

# Deploy to Cloud Run
echo -e "${YELLOW}🚀 Deploying to Cloud Run...${NC}"

gcloud run deploy $SERVICE_NAME \
    --image $IMAGE_NAME \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --set-env-vars "ENV=production,LOG_LEVEL=INFO" \
    --memory 2Gi \
    --cpu 2 \
    --concurrency 80 \
    --max-instances 10 \
    --min-instances 0 \
    --timeout 300 \
    --port 8080

# Get the service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format 'value(status.url)')

echo ""
echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${GREEN}🌐 Service URL: ${SERVICE_URL}${NC}"
echo -e "${GREEN}🏥 Health Check: ${SERVICE_URL}/health${NC}"
echo ""
echo -e "${YELLOW}📝 Next steps:${NC}"
echo "   1. Test your service: curl ${SERVICE_URL}/health"
echo "   2. Update your extension's API endpoint to use: ${SERVICE_URL}"
echo "   3. Set up environment variables in Cloud Run console if needed"
echo "   4. Configure custom domain if required"
echo ""
echo -e "${BLUE}🎉 Your Topaz Backend is now live on Google Cloud Run!${NC}"