#!/bin/bash

set -e

# Colors for output
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
NC="\033[0m"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  SabPaisa UI - Auto Deployment${NC}"
echo -e "${GREEN}========================================${NC}"

# Check if .env.production file exists
if [ ! -f ".env.production" ]; then
    echo -e "${RED}[ERROR] .env.production file not found!${NC}"
    exit 1
fi

# Load environment variables
export $(grep -v '^#' .env.production | xargs)

# Pull latest changes
echo -e "${GREEN}[INFO] Pulling latest changes...${NC}"
git pull origin development

# Stop existing container
echo -e "${GREEN}[INFO] Stopping existing UI container...${NC}"
docker-compose down

# Build new image
echo -e "${GREEN}[INFO] Building Docker image...${NC}"
docker-compose build --no-cache --build-arg REACT_APP_API_URL=$REACT_APP_API_URL

# Start container
echo -e "${GREEN}[INFO] Starting UI container...${NC}"
docker-compose up -d

# Wait for container to start
echo -e "${GREEN}[INFO] Waiting for container to start (10 seconds)...${NC}"
sleep 10

# Check container status
echo -e "${GREEN}[INFO] Checking container status...${NC}"
docker-compose ps

# Test health endpoint
echo -e "${GREEN}[INFO] Testing health endpoint...${NC}"
curl -f http://localhost:3000/health || echo -e "${YELLOW}[WARN] Health check failed${NC}"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  UI Deployment Completed Successfully!${NC}"
echo -e "${GREEN}========================================${NC}"

# Show container logs
echo -e "${YELLOW}[INFO] Recent logs:${NC}"
docker-compose logs --tail=20 ui

echo -e "${GREEN}[INFO] UI is accessible at: http://$(hostname -I | awk '{print $1}'):3000${NC}"
