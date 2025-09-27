@echo off
REM Google Cloud Run Deployment Script for Topaz Backend (Windows)
REM Usage: deploy.bat [PROJECT_ID] [REGION] [SERVICE_NAME]

setlocal enabledelayedexpansion

REM Default values
set DEFAULT_PROJECT_ID=your-gcp-project-id
set DEFAULT_REGION=us-central1
set DEFAULT_SERVICE_NAME=topaz-backend

REM Parse arguments
if "%1"=="" (
    set PROJECT_ID=%DEFAULT_PROJECT_ID%
) else (
    set PROJECT_ID=%1
)

if "%2"=="" (
    set REGION=%DEFAULT_REGION%
) else (
    set REGION=%2
)

if "%3"=="" (
    set SERVICE_NAME=%DEFAULT_SERVICE_NAME%
) else (
    set SERVICE_NAME=%3
)

echo 🚀 Starting deployment to Google Cloud Run
echo Project ID: %PROJECT_ID%
echo Region: %REGION%
echo Service Name: %SERVICE_NAME%
echo.

REM Check if required tools are installed
echo 📋 Checking prerequisites...

where gcloud >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ gcloud CLI is not installed. Please install it first.
    echo    Download from: https://cloud.google.com/sdk/docs/install
    exit /b 1
)

where docker >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed. Please install it first.
    exit /b 1
)

echo ✅ Prerequisites check passed

REM Set the project
echo 🔧 Setting up Google Cloud project...
gcloud config set project %PROJECT_ID%

REM Enable required APIs
echo 🔧 Enabling required Google Cloud APIs...
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

REM Build and tag the Docker image
set IMAGE_NAME=gcr.io/%PROJECT_ID%/%SERVICE_NAME%
echo 🏗️  Building Docker image: %IMAGE_NAME%

docker build -t %IMAGE_NAME% .

REM Push the image to Google Container Registry
echo 📤 Pushing image to Google Container Registry...
docker push %IMAGE_NAME%

REM Deploy to Cloud Run
echo 🚀 Deploying to Cloud Run...

gcloud run deploy %SERVICE_NAME% ^
    --image %IMAGE_NAME% ^
    --platform managed ^
    --region %REGION% ^
    --allow-unauthenticated ^
    --set-env-vars "ENV=production,LOG_LEVEL=INFO" ^
    --memory 2Gi ^
    --cpu 2 ^
    --concurrency 80 ^
    --max-instances 10 ^
    --min-instances 0 ^
    --timeout 300 ^
    --port 8080

REM Get the service URL
for /f "tokens=*" %%i in ('gcloud run services describe %SERVICE_NAME% --platform managed --region %REGION% --format "value(status.url)"') do set SERVICE_URL=%%i

echo.
echo ✅ Deployment completed successfully!
echo 🌐 Service URL: %SERVICE_URL%
echo 🏥 Health Check: %SERVICE_URL%/health
echo.
echo 📝 Next steps:
echo    1. Test your service: curl %SERVICE_URL%/health
echo    2. Update your extension's API endpoint to use: %SERVICE_URL%
echo    3. Set up environment variables in Cloud Run console if needed
echo    4. Configure custom domain if required
echo.
echo 🎉 Your Topaz Backend is now live on Google Cloud Run!