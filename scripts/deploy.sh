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
IMAGE_TAG="${IMAGE_TAG:-latest}"

# Optional first argument to override image tag/version (e.g. a5e9ba0)
if [ -n "$1" ]; then
    IMAGE_TAG="$1"
fi

# Optional second argument to select services (comma-separated)
# Examples: all | frontend | backend,api | frontend,admin,nginx
SERVICES="${SERVICES:-all}"
if [ -n "$2" ]; then
    SERVICES="$2"
fi
SERVICES=$(echo "$SERVICES" | tr -d '[:space:]')

# Per-service tags (fallback to IMAGE_TAG)
FRONTEND_TAG="${FRONTEND_TAG:-$IMAGE_TAG}"
ADMIN_TAG="${ADMIN_TAG:-$IMAGE_TAG}"
BACKEND_TAG="${BACKEND_TAG:-$IMAGE_TAG}"
API_TAG="${API_TAG:-$IMAGE_TAG}"
NGINX_TAG="${NGINX_TAG:-$IMAGE_TAG}"

# Set default ports if not defined in .env
NGINX_HTTP_PORT="${NGINX_HTTP_PORT:-80}"
NGINX_HTTPS_PORT="${NGINX_HTTPS_PORT:-443}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"
ADMIN_PORT="${ADMIN_PORT:-3001}"
ADMIN_BASE_PATH="${ADMIN_BASE_PATH:-/admin/}"
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

# Function to check whether a service is selected
service_enabled() {
    local service="$1"
    if [ "$SERVICES" = "all" ]; then
        return 0
    fi
    case ",$SERVICES," in
        *",$service,"*) return 0 ;;
        *) return 1 ;;
    esac
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
if service_enabled "frontend"; then stop_container "$FRONTEND_CONTAINER"; fi
if service_enabled "admin"; then stop_container "$ADMIN_CONTAINER"; fi
if service_enabled "backend"; then stop_container "$BACKEND_CONTAINER"; fi
if service_enabled "api"; then stop_container "$API_CONTAINER"; fi
if service_enabled "nginx"; then stop_container "$NGINX_CONTAINER"; fi

# Ensure network exists
echo "Setting up docker network..."
if docker network inspect "$NETWORK_NAME" >/dev/null 2>&1; then
    echo "Using existing network $NETWORK_NAME"
else
    echo "Creating network $NETWORK_NAME..."
    docker network create "$NETWORK_NAME"
fi

# Pull selected images
echo "Pulling images with tags:"
if service_enabled "frontend"; then
    echo "- frontend: $FRONTEND_TAG"
    docker pull --platform linux/amd64 $REGISTRY/$GITHUB_USERNAME/${APP_NAME}-frontend:$FRONTEND_TAG
fi
if service_enabled "admin"; then
    echo "- admin: $ADMIN_TAG"
    docker pull --platform linux/amd64 $REGISTRY/$GITHUB_USERNAME/${APP_NAME}-admin:$ADMIN_TAG
fi
if service_enabled "backend"; then
    echo "- backend: $BACKEND_TAG"
    docker pull --platform linux/amd64 $REGISTRY/$GITHUB_USERNAME/${APP_NAME}-backend:$BACKEND_TAG
fi
if service_enabled "api"; then
    echo "- api: $API_TAG"
    docker pull --platform linux/amd64 $REGISTRY/$GITHUB_USERNAME/${APP_NAME}-api:$API_TAG
fi
if service_enabled "nginx"; then
    echo "- nginx: $NGINX_TAG"
    docker pull --platform linux/amd64 $REGISTRY/$GITHUB_USERNAME/${APP_NAME}-nginx:$NGINX_TAG
fi

# Start backend
if service_enabled "backend"; then
    echo "Starting backend..."
    docker run -d \
        --platform linux/amd64 \
        --name $BACKEND_CONTAINER \
        --network $NETWORK_NAME \
        --network-alias backend \
        -p $BACKEND_PORT:3333 \
        --env-file .env \
        -e NODE_ENV=production \
        --restart unless-stopped \
        $REGISTRY/$GITHUB_USERNAME/${APP_NAME}-backend:$BACKEND_TAG

    # Wait for backend to be ready
    wait_for_container "$BACKEND_CONTAINER"
fi

# Start api
if service_enabled "api"; then
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
        $REGISTRY/$GITHUB_USERNAME/${APP_NAME}-api:$API_TAG

    # Wait for api to be ready
    wait_for_container "$API_CONTAINER"
fi

# Start frontend
if service_enabled "frontend"; then
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
        -e FRONTEND_API_BASE=${FRONTEND_API_BASE:-http://backend:3333} \
        -e NUXT_PUBLIC_API_BASE=${NUXT_PUBLIC_API_BASE:-${FRONTEND_API_BASE:-http://backend:3333}} \
        --restart unless-stopped \
        $REGISTRY/$GITHUB_USERNAME/${APP_NAME}-frontend:$FRONTEND_TAG

    # Wait for frontend to be ready
    wait_for_container "$FRONTEND_CONTAINER"
fi

# Start admin
if service_enabled "admin"; then
    echo "Starting admin..."
    docker run -d \
        --platform linux/amd64 \
        --name $ADMIN_CONTAINER \
        --network $NETWORK_NAME \
        --network-alias admin \
        -p $ADMIN_PORT:3001 \
        --env-file apps/admin/.env.production \
        -e NODE_ENV=production \
        -e NUXT_APP_BASE_URL=$ADMIN_BASE_PATH \
        -e HOST=0.0.0.0 \
        -e ADMIN_API_BASE=${ADMIN_API_BASE:-http://backend:3333} \
        -e NUXT_PUBLIC_API_BASE=${NUXT_PUBLIC_API_BASE:-${ADMIN_API_BASE:-http://backend:3333}} \
        --restart unless-stopped \
        $REGISTRY/$GITHUB_USERNAME/${APP_NAME}-admin:$ADMIN_TAG

    # Wait for admin to be ready
    wait_for_container "$ADMIN_CONTAINER"
fi

# Start nginx
if service_enabled "nginx"; then
    echo "Starting nginx..."
    docker run -d \
        --platform linux/amd64 \
        --name $NGINX_CONTAINER \
        --network $NETWORK_NAME \
        -p $NGINX_HTTP_PORT:80 \
        -p $NGINX_HTTPS_PORT:443 \
        -v /etc/nginx/ssl:/etc/nginx/ssl:ro \
        --restart unless-stopped \
        $REGISTRY/$GITHUB_USERNAME/${APP_NAME}-nginx:$NGINX_TAG

    # Wait for nginx to be ready
    wait_for_container "$NGINX_CONTAINER"
fi

echo "Deployment completed successfully!"
echo "Selected services: $SERVICES"
echo "Image tags:"
echo "- frontend: $FRONTEND_TAG"
echo "- admin: $ADMIN_TAG"
echo "- backend: $BACKEND_TAG"
echo "- api: $API_TAG"
echo "- nginx: $NGINX_TAG"
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
