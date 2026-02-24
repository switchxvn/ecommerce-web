#!/bin/bash

# Exit on any error
set -e

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Parse command line arguments
BUILD_FRONTEND=false
BUILD_BACKEND=false
BUILD_ADMIN=false
BUILD_API=false
BUILD_NGINX=false
BUILD_ALL=true

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --frontend    Build frontend service only"
    echo "  --backend     Build backend service only"
    echo "  --admin       Build admin service only"
    echo "  --api         Build api service only"
    echo "  --nginx       Build nginx service only"
    echo "  --all         Build all services (default)"
    echo "  -h, --help    Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                    # Build all services"
    echo "  $0 --backend          # Build backend only"
    echo "  $0 --frontend --admin # Build frontend and admin"
    echo "  $0 --all              # Build all services"
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --frontend)
            BUILD_FRONTEND=true
            BUILD_ALL=false
            shift
            ;;
        --backend)
            BUILD_BACKEND=true
            BUILD_ALL=false
            shift
            ;;
        --admin)
            BUILD_ADMIN=true
            BUILD_ALL=false
            shift
            ;;
        --api)
            BUILD_API=true
            BUILD_ALL=false
            shift
            ;;
        --nginx)
            BUILD_NGINX=true
            BUILD_ALL=false
            shift
            ;;
        --all)
            BUILD_ALL=true
            BUILD_FRONTEND=false
            BUILD_BACKEND=false
            BUILD_ADMIN=false
            BUILD_API=false
            BUILD_NGINX=false
            shift
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# If BUILD_ALL is true, set all services to true
if [ "$BUILD_ALL" = true ]; then
    BUILD_FRONTEND=true
    BUILD_BACKEND=true
    BUILD_ADMIN=true
    BUILD_API=true
    BUILD_NGINX=true
fi

# Load environment variables if not already loaded
if [ -z "$GITHUB_USERNAME" ] || [ -z "$REGISTRY" ] || [ -z "$GITHUB_TOKEN" ]; then
    if [ -f "$PROJECT_ROOT/.env" ]; then
        export $(cat "$PROJECT_ROOT/.env" | grep -v '^#' | xargs)
    else
        echo "Error: .env file not found and environment variables not set"
        exit 1
    fi
fi

# Validate required environment variables
if [ -z "$GITHUB_USERNAME" ] || [ -z "$REGISTRY" ] || [ -z "$GITHUB_TOKEN" ]; then
    echo "Error: GITHUB_USERNAME, REGISTRY, and GITHUB_TOKEN must be set in .env file"
    exit 1
fi

# Set default app name if not defined
APP_NAME="${APP_NAME:-cable-car}"

# Set version from git if not specified
VERSION=${VERSION:-$(git describe --tags --always)}
TIMESTAMP=$(date +%Y%m%d%H%M%S)

# Check if logged in to GitHub Container Registry and login if needed
echo "Checking GitHub Container Registry authentication..."
if ! docker info | grep -q "ghcr.io"; then
    echo "Logging in to GitHub Container Registry..."
    echo "$GITHUB_TOKEN" | docker login ghcr.io -u "$GITHUB_USERNAME" --password-stdin
    
    if [ $? -ne 0 ]; then
        echo "Error: Failed to login to GitHub Container Registry"
        exit 1
    fi
fi

# Function to build and push service
build_and_push_service() {
    local service=$1
    local dockerfile_path=$2
    
    echo "Building $service image..."
    docker build --platform linux/amd64 \
        -t $REGISTRY/$GITHUB_USERNAME/${APP_NAME}-$service:$VERSION \
        -t $REGISTRY/$GITHUB_USERNAME/${APP_NAME}-$service:latest \
        -f $dockerfile_path .

    echo "Pushing $service image..."
    docker push $REGISTRY/$GITHUB_USERNAME/${APP_NAME}-$service:$VERSION
    docker push $REGISTRY/$GITHUB_USERNAME/${APP_NAME}-$service:latest
    
    echo "$service build and push completed!"
}

# Function to build and push nginx (no env file needed)
build_and_push_nginx() {
    echo "Building nginx image..."
    docker build --platform linux/amd64 \
        -t $REGISTRY/$GITHUB_USERNAME/${APP_NAME}-nginx:$VERSION \
        -t $REGISTRY/$GITHUB_USERNAME/${APP_NAME}-nginx:latest \
        -f nginx/Dockerfile .

    echo "Pushing nginx image..."
    docker push $REGISTRY/$GITHUB_USERNAME/${APP_NAME}-nginx:$VERSION
    docker push $REGISTRY/$GITHUB_USERNAME/${APP_NAME}-nginx:latest
    
    echo "nginx build and push completed!"
}

# Build services based on flags
echo "Starting build process..."
echo "Version: $VERSION"
echo "Timestamp: $TIMESTAMP"
echo ""

if [ "$BUILD_FRONTEND" = true ]; then
    echo "=== Building Frontend ==="
    build_and_push_service "frontend" "apps/frontend/Dockerfile"
    echo ""
fi

if [ "$BUILD_BACKEND" = true ]; then
    echo "=== Building Backend ==="
    build_and_push_service "backend" "apps/backend/Dockerfile"
    echo ""
fi

if [ "$BUILD_API" = true ]; then
    echo "=== Building API ==="
    build_and_push_service "api" "apps/api/Dockerfile"
    echo ""
fi

if [ "$BUILD_ADMIN" = true ]; then
    echo "=== Building Admin ==="
    build_and_push_service "admin" "apps/admin/Dockerfile"
    echo ""
fi

if [ "$BUILD_NGINX" = true ]; then
    echo "=== Building Nginx ==="
    build_and_push_nginx
    echo ""
fi

echo "All requested builds completed successfully!"
echo "Version: $VERSION"
echo "Timestamp: $TIMESTAMP" 
