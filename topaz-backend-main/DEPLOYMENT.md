# Topaz Backend Deployment Guide

This guide covers deploying the integrated Topaz backend application that includes both the landing page and API functionality.

## Table of Contents

1. [Local Development](#local-development)
2. [Production Deployment](#production-deployment)
3. [Environment Configuration](#environment-configuration)
4. [Docker Deployment](#docker-deployment)
5. [Cloud Deployment](#cloud-deployment)
6. [Database Setup](#database-setup)
7. [Auth0 Configuration](#auth0-configuration)
8. [Troubleshooting](#troubleshooting)

## Local Development

### Prerequisites

- Python 3.8+
- pip
- Git

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd topaz-backend
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Run the server**
   ```bash
   python run_server.py
   ```
   
   Or using uvicorn directly:
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

5. **Access the application**
   - Landing page: `http://localhost:8000`
   - API docs: `http://localhost:8000/docs`

## Production Deployment

### Option 1: Direct Python Deployment

1. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

2. **Set up environment variables**
   ```bash
   export AUTH0_SECRET="your-auth0-secret"
   export AUTH0_CLIENT_ID="your-auth0-client-id"
   export AUTH0_ISSUER_BASE_URL="https://your-domain.auth0.com"
   export AUTH0_BASE_URL="https://your-domain.com"
   export SUPABASE_URL="https://your-project.supabase.co"
   export SUPABASE_ANON_KEY="your-supabase-key"
   export GEMINI_API_KEY="your-gemini-key"
   ```

3. **Run with Gunicorn**
   ```bash
   gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app --bind 0.0.0.0:8000
   ```

### Option 2: Process Manager (PM2)

1. **Install PM2**
   ```bash
   npm install -g pm2
   ```

2. **Create ecosystem file**
   ```javascript
   // ecosystem.config.js
   module.exports = {
     apps: [{
       name: 'topaz-backend',
       script: 'uvicorn',
       args: 'main:app --host 0.0.0.0 --port 8000',
       instances: 'max',
       exec_mode: 'cluster',
       env: {
         NODE_ENV: 'production',
         AUTH0_SECRET: 'your-auth0-secret',
         // ... other env vars
       }
     }]
   };
   ```

3. **Start with PM2**
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

## Environment Configuration

### Required Environment Variables

```env
# Auth0 Configuration
AUTH0_SECRET=your-32-character-secret-key
AUTH0_BASE_URL=https://your-domain.com
AUTH0_CLIENT_ID=your-auth0-client-id
AUTH0_ISSUER_BASE_URL=https://your-domain.auth0.com

# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-supabase-anonymous-key

# Gemini API
GEMINI_API_KEY=your-gemini-api-key
```

### Optional Environment Variables

```env
# Server Configuration
PORT=8000
HOST=0.0.0.0
LOG_LEVEL=info

# CORS Configuration
CORS_ORIGINS=["https://your-domain.com"]
```

## Docker Deployment

### Dockerfile

```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Docker Compose

```yaml
version: '3.8'
services:
  topaz-backend:
    build: .
    ports:
      - "8000:8000"
    environment:
      - AUTH0_SECRET=${AUTH0_SECRET}
      - AUTH0_CLIENT_ID=${AUTH0_CLIENT_ID}
      - AUTH0_ISSUER_BASE_URL=${AUTH0_ISSUER_BASE_URL}
      - AUTH0_BASE_URL=${AUTH0_BASE_URL}
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
      - GEMINI_API_KEY=${GEMINI_API_KEY}
    volumes:
      - ./static:/app/static
      - ./prompts.json:/app/prompts.json
    restart: unless-stopped
```

### Build and Run

```bash
docker build -t topaz-backend .
docker run -p 8000:8000 --env-file .env.local topaz-backend
```

Or with docker-compose:

```bash
docker-compose up -d
```

## Cloud Deployment

### Google Cloud Run

1. **Build and push image**
   ```bash
   gcloud builds submit --tag gcr.io/PROJECT-ID/topaz-backend
   ```

2. **Deploy to Cloud Run**
   ```bash
   gcloud run deploy topaz-backend \
     --image gcr.io/PROJECT-ID/topaz-backend \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars AUTH0_SECRET=your-secret,AUTH0_CLIENT_ID=your-client-id
   ```

### AWS ECS/Fargate

1. **Create task definition**
   ```json
   {
     "family": "topaz-backend",
     "networkMode": "awsvpc",
     "requiresCompatibilities": ["FARGATE"],
     "cpu": "256",
     "memory": "512",
     "executionRoleArn": "arn:aws:iam::ACCOUNT:role/ecsTaskExecutionRole",
     "containerDefinitions": [
       {
         "name": "topaz-backend",
         "image": "your-account.dkr.ecr.region.amazonaws.com/topaz-backend:latest",
         "portMappings": [
           {
             "containerPort": 8000,
             "protocol": "tcp"
           }
         ],
         "environment": [
           {
             "name": "AUTH0_SECRET",
             "value": "your-secret"
           }
         ]
       }
     ]
   }
   ```

2. **Create service**
   ```bash
   aws ecs create-service \
     --cluster your-cluster \
     --service-name topaz-backend \
     --task-definition topaz-backend \
     --desired-count 1 \
     --launch-type FARGATE \
     --network-configuration "awsvpcConfiguration={subnets=[subnet-12345],securityGroups=[sg-12345],assignPublicIp=ENABLED}"
   ```

### Heroku

1. **Create Procfile**
   ```
   web: uvicorn main:app --host 0.0.0.0 --port $PORT
   ```

2. **Deploy**
   ```bash
   heroku create topaz-backend
   heroku config:set AUTH0_SECRET=your-secret
   heroku config:set AUTH0_CLIENT_ID=your-client-id
   # ... set other env vars
   git push heroku main
   ```

## Database Setup

### Supabase Configuration

1. **Create a new Supabase project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note the project URL and anon key

2. **Create required tables**
   ```sql
   -- Game scores table
   CREATE TABLE game_scores (
     id SERIAL PRIMARY KEY,
     username VARCHAR(255) NOT NULL,
     score INTEGER NOT NULL,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );

   -- Waitlist table
   CREATE TABLE waitlist (
     id SERIAL PRIMARY KEY,
     email VARCHAR(255) UNIQUE NOT NULL,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
   ```

3. **Set up Row Level Security (RLS)**
   ```sql
   -- Enable RLS
   ALTER TABLE game_scores ENABLE ROW LEVEL SECURITY;
   ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

   -- Create policies
   CREATE POLICY "Allow public read access" ON game_scores
     FOR SELECT USING (true);

   CREATE POLICY "Allow public insert" ON game_scores
     FOR INSERT WITH CHECK (true);

   CREATE POLICY "Allow public insert" ON waitlist
     FOR INSERT WITH CHECK (true);
   ```

## Auth0 Configuration

### Application Settings

1. **Create a new Auth0 application**
   - Type: Regular Web Application
   - Technology: Python

2. **Configure URLs**
   - Allowed Callback URLs: `https://your-domain.com/callback`
   - Allowed Logout URLs: `https://your-domain.com/`
   - Allowed Web Origins: `https://your-domain.com`

3. **Advanced Settings**
   - JWT Expiration: 36000 seconds (10 hours)
   - Enable OIDC Conformant

### Domain Configuration

1. **Custom Domain (Optional)**
   - Set up a custom domain in Auth0
   - Update `AUTH0_ISSUER_BASE_URL` to use custom domain

2. **Social Connections**
   - Configure Google, GitHub, etc. if needed
   - Test social login flows

## Troubleshooting

### Common Issues

1. **Static files not loading**
   - Check file permissions
   - Verify static file paths
   - Ensure FastAPI static file mounting is correct

2. **Auth0 callback errors**
   - Verify callback URLs in Auth0 dashboard
   - Check `AUTH0_BASE_URL` matches your domain
   - Ensure HTTPS in production

3. **Database connection issues**
   - Verify Supabase credentials
   - Check network connectivity
   - Ensure RLS policies are set correctly

4. **Gemini API errors**
   - Verify API key is correct
   - Check API quotas and limits
   - Ensure proper error handling

### Debug Mode

Enable debug logging:

```python
# In main.py
import logging
logging.basicConfig(level=logging.DEBUG)
```

### Health Checks

The application includes several health check endpoints:

- `GET /` - Landing page (should return 200)
- `GET /api/config` - API configuration
- `GET /api/auth-status` - Authentication status
- `GET /docs` - API documentation

### Performance Monitoring

Consider adding monitoring tools:

- **Sentry** for error tracking
- **New Relic** for performance monitoring
- **Datadog** for infrastructure monitoring

### Backup and Recovery

1. **Database backups**
   - Supabase provides automatic backups
   - Consider additional backup strategies for critical data

2. **Code backups**
   - Use Git for version control
   - Consider multiple remote repositories

3. **Environment variables**
   - Store securely in password manager
   - Use environment-specific configurations

### Security Considerations

1. **Environment variables**
   - Never commit secrets to version control
   - Use secure secret management services

2. **HTTPS**
   - Always use HTTPS in production
   - Configure proper SSL certificates

3. **CORS**
   - Configure appropriate CORS policies
   - Avoid using wildcard origins in production

4. **Rate limiting**
   - Consider implementing rate limiting
   - Use reverse proxy for additional security

## Support

For deployment issues:

1. Check the application logs
2. Verify environment configuration
3. Test individual components
4. Check network connectivity
5. Review security settings

For additional help, consult the main README.md or create an issue in the repository.