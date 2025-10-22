#!/bin/bash

set -e

# Colors for output
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
NC="\033[0m"

# Get current branch dynamically
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
DEPLOY_ENV=${DEPLOY_ENV:-"dev"}

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  SabPaisa UI - Auto Deployment${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "${YELLOW}[INFO] Branch: ${CURRENT_BRANCH}${NC}"
echo -e "${YELLOW}[INFO] Environment: ${DEPLOY_ENV}${NC}"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}[WARN] .env file not found for active environment${NC}"
fi

# Pull latest changes from current branch
echo -e "${GREEN}[INFO] Pulling latest changes from ${CURRENT_BRANCH}...${NC}"
git pull origin ${CURRENT_BRANCH}

# Verify .env file exists
if [ ! -f ".env" ]; then
    echo -e "${RED}[ERROR] .env file not found!${NC}"
    echo -e "${YELLOW}[INFO] This should have been created by switch-env.sh${NC}"
    exit 1
fi

echo -e "${GREEN}[INFO] Using environment file: .env${NC}"
echo -e "${YELLOW}[INFO] API_URL: $(grep REACT_APP_API_URL .env)${NC}"

# Load environment variables from .env
export $(grep -v '^#' .env | xargs)

# Check if docker-compose file exists
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}[ERROR] docker-compose.yml not found!${NC}"
    exit 1
fi

# Stop existing container
echo -e "${GREEN}[INFO] Stopping existing UI container...${NC}"
docker-compose down

# Build new image with environment variables
echo -e "${GREEN}[INFO] Building Docker image...${NC}"
docker-compose build --no-cache \
    --build-arg REACT_APP_API_URL=$REACT_APP_API_URL \
    --build-arg REACT_APP_ENVIRONMENT=$REACT_APP_ENVIRONMENT \
    --build-arg REACT_APP_ENABLE_ANALYTICS=$REACT_APP_ENABLE_ANALYTICS \
    --build-arg REACT_APP_ENABLE_EXPORTS=$REACT_APP_ENABLE_EXPORTS

# Start container
echo -e "${GREEN}[INFO] Starting UI container...${NC}"
docker-compose up -d

# Wait for container to start
echo -e "${GREEN}[INFO] Waiting for container to start (15 seconds)...${NC}"
sleep 15

# Check container status
echo -e "${GREEN}[INFO] Checking container status...${NC}"
docker-compose ps

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  UI Deployment Completed Successfully!${NC}"
echo -e "${GREEN}========================================${NC}"

# Show container logs
echo -e "${YELLOW}[INFO] Recent logs:${NC}"
docker-compose logs --tail=20

echo -e "${GREEN}[INFO] UI is accessible at: http://$(hostname -I | awk '{print $1}'):3000${NC}"
