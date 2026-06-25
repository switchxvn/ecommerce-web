#!/bin/bash

# Exit on any error
set -e

# Load environment variables
if [ -f ".env" ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "Error: .env file not found"
    exit 1
fi

# Validate required environment variables
if [ -z "$GITHUB_USERNAME" ] || [ -z "$REGISTRY" ] || [ -z "$GITHUB_TOKEN" ]; then
    echo "Error: GITHUB_USERNAME, REGISTRY, and GITHUB_TOKEN must be set in .env file"
    exit 1
fi

# Set default container name prefix if not defined in .env
APP_NAME="${APP_NAME:-cable-car}"

# Set default ports if not defined in .env
NGINX_HTTP_PORT="${NGINX_HTTP_PORT:-80}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"
ADMIN_PORT="${ADMIN_PORT:-3001}"
BACKEND_PORT="${BACKEND_PORT:-3333}"
API_PORT="${API_PORT:-4000}"

# Check and login to GitHub Container Registry
echo "Checking GitHub Container Registry authentication..."
if ! docker info | grep -q "ghcr.io"; then
    echo "Logging in to GitHub Container Registry..."
    echo "$GITHUB_TOKEN" | docker login ghcr.io -u "$GITHUB_USERNAME" --password-stdin
    
    if [ $? -ne 0 ]; then
        echo "Error: Failed to login to GitHub Container Registry"
        exit 1
    fi
fi

# Function to stop and remove container if exists
stop_container() {
    if [ "$(docker ps -q -f name=$1)" ]; then
        echo "Stopping existing $1 container..."
        docker stop $1
        docker rm $1
    fi
}

# Function to wait for container to be healthy
wait_for_container() {
    local container_name=$1
    local max_attempts=30
    local attempt=1

    echo "Waiting for $container_name to be ready..."
    while [ $attempt -le $max_attempts ]; do
        if docker ps | grep $container_name | grep -q "Up"; then
            echo "$container_name is ready!"
            return 0
        fi
        echo "Attempt $attempt/$max_attempts: $container_name is not ready yet..."
        sleep 2
        attempt=$((attempt + 1))
    done

    echo "Error: $container_name failed to start properly"
    docker logs $container_name
    return 1
}

# Setup variables
NETWORK_NAME="${NETWORK_NAME:-app-network}"
FRONTEND_CONTAINER="${APP_NAME}-frontend"
ADMIN_CONTAINER="${APP_NAME}-admin"
BACKEND_CONTAINER="${APP_NAME}-backend"
API_CONTAINER="${APP_NAME}-api"
NGINX_CONTAINER="${APP_NAME}-nginx"

# Stop and remove existing containers first
echo "Cleaning up existing containers..."
stop_container "$FRONTEND_CONTAINER"
stop_container "$ADMIN_CONTAINER"
stop_container "$BACKEND_CONTAINER"
stop_container "$API_CONTAINER"
stop_container "$NGINX_CONTAINER"

# Clean up network after containers are stopped
echo "Setting up docker network..."
if docker network ls | grep -q $NETWORK_NAME; then
    echo "Removing existing network $NETWORK_NAME..."
    docker network rm $NETWORK_NAME || {
        echo "Failed to remove network. Forcing cleanup..."
        # Force disconnect any remaining containers
        for container in $(docker network inspect $NETWORK_NAME -f '{{range .Containers}}{{.Name}} {{end}}'); do
            echo "Force disconnecting $container from network..."
            docker network disconnect -f $NETWORK_NAME $container || true
        done
        docker network rm $NETWORK_NAME
    }
fi

echo "Creating network $NETWORK_NAME..."
docker network create $NETWORK_NAME

# Pull latest images with platform specification
echo "Pulling latest images..."
docker pull --platform linux/amd64 $REGISTRY/$GITHUB_USERNAME/${APP_NAME}-frontend:latest
docker pull --platform linux/amd64 $REGISTRY/$GITHUB_USERNAME/${APP_NAME}-admin:latest
docker pull --platform linux/amd64 $REGISTRY/$GITHUB_USERNAME/${APP_NAME}-backend:latest
docker pull --platform linux/amd64 $REGISTRY/$GITHUB_USERNAME/${APP_NAME}-api:latest
docker pull --platform linux/amd64 $REGISTRY/$GITHUB_USERNAME/${APP_NAME}-nginx:latest

# Start backend
echo "Starting backend..."
docker run -d \
    --platform linux/amd64 \
    --name $BACKEND_CONTAINER \
    --network $NETWORK_NAME \
    --network-alias backend \
    -p $BACKEND_PORT:3333 \
    --env-file apps/backend/.env.production \
    -e NODE_ENV=production \
    --restart unless-stopped \
    $REGISTRY/$GITHUB_USERNAME/${APP_NAME}-backend:latest

# Wait for backend to be ready
wait_for_container "$BACKEND_CONTAINER"

# Start api
echo "Starting api..."
docker run -d \
    --platform linux/amd64 \
    --name $API_CONTAINER \
    --network $NETWORK_NAME \
    --network-alias api \
    -p $API_PORT:4000 \
    --env-file apps/api/.env.production \
    -e NODE_ENV=production \
    --restart unless-stopped \
    $REGISTRY/$GITHUB_USERNAME/${APP_NAME}-api:latest

# Wait for api to be ready
wait_for_container "$API_CONTAINER"

# Start frontend
echo "Starting frontend..."
docker run -d \
    --platform linux/amd64 \
    --name $FRONTEND_CONTAINER \
    --network $NETWORK_NAME \
    --network-alias frontend \
    -p $FRONTEND_PORT:4201 \
    --env-file apps/frontend/.env.production \
    -e NODE_ENV=production \
    -e HOST=0.0.0.0 \
    --restart unless-stopped \
    $REGISTRY/$GITHUB_USERNAME/${APP_NAME}-frontend:latest

# Wait for frontend to be ready
wait_for_container "$FRONTEND_CONTAINER"

# Start admin
echo "Starting admin..."
docker run -d \
    --platform linux/amd64 \
    --name $ADMIN_CONTAINER \
    --network $NETWORK_NAME \
    --network-alias admin \
    -p $ADMIN_PORT:3001 \
    --env-file apps/admin/.env.production \
    -e NODE_ENV=production \
    -e HOST=0.0.0.0 \
    --restart unless-stopped \
    $REGISTRY/$GITHUB_USERNAME/${APP_NAME}-admin:latest

# Wait for admin to be ready
wait_for_container "$ADMIN_CONTAINER"

# Start nginx
echo "Starting nginx..."
docker run -d \
    --platform linux/amd64 \
    --name $NGINX_CONTAINER \
    --network $NETWORK_NAME \
    -p $NGINX_HTTP_PORT:80 \
    -v /etc/nginx/ssl:/etc/nginx/ssl:ro \
    --restart unless-stopped \
    $REGISTRY/$GITHUB_USERNAME/${APP_NAME}-nginx:latest

# Wait for nginx to be ready
wait_for_container "$NGINX_CONTAINER"

echo "Deployment completed successfully!"
echo "Services:"
echo "- Frontend: http://localhost:$FRONTEND_PORT"
echo "- Admin: http://localhost:$ADMIN_PORT"
echo "- Backend: http://localhost:$BACKEND_PORT"
echo "- API: http://localhost:$API_PORT"
echo "- Nginx: http://localhost:$NGINX_HTTP_PORT and https://localhost:$NGINX_HTTPS_PORT"

# Show running containers and their networks
echo -e "\nRunning containers:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo -e "\nNetwork information:"
docker network inspect $NETWORK_NAME 
