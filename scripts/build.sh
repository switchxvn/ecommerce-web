#!/bin/bash

# Exit on any error
set -euo pipefail

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
PUSH_IMAGES=true
PARALLEL=false
PLATFORM="${PLATFORM:-}"
BUILD_RETRY_ATTEMPTS="${BUILD_RETRY_ATTEMPTS:-3}"
BUILD_RETRY_DELAY_SECONDS="${BUILD_RETRY_DELAY_SECONDS:-15}"

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
    echo "  --no-push     Build only, do not push image to registry"
    echo "  --sequential  Build services sequentially"
    echo "  --parallel    Build services in parallel"
    echo "  --platform    Set target platform (e.g. linux/amd64)"
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
        --no-push)
            PUSH_IMAGES=false
            shift
            ;;
        --sequential)
            PARALLEL=false
            shift
            ;;
        --parallel)
            PARALLEL=true
            shift
            ;;
        --platform)
            if [[ -z "${2:-}" ]]; then
                echo "Error: --platform requires a value (e.g. linux/amd64)"
                exit 1
            fi
            PLATFORM="$2"
            shift 2
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
if [ -z "${GITHUB_USERNAME:-}" ] || [ -z "${REGISTRY:-}" ] || [ -z "${GITHUB_TOKEN:-}" ]; then
    if [ -f "$PROJECT_ROOT/.env" ]; then
        export $(cat "$PROJECT_ROOT/.env" | grep -v '^#' | xargs)
    else
        echo "Error: .env file not found and environment variables not set"
        exit 1
    fi
fi

# Validate required environment variables
if [ -z "${GITHUB_USERNAME:-}" ] || [ -z "${REGISTRY:-}" ] || [ -z "${GITHUB_TOKEN:-}" ]; then
    echo "Error: GITHUB_USERNAME, REGISTRY, and GITHUB_TOKEN must be set in .env file"
    exit 1
fi

# Set default app name if not defined
APP_NAME="${APP_NAME:-cable-car}"
YARN_REGISTRY="${YARN_REGISTRY:-https://registry.npmjs.org}"

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

# Enable BuildKit for faster and cache-aware builds
export DOCKER_BUILDKIT=1

# Ensure buildx is available
if ! docker buildx version >/dev/null 2>&1; then
    echo "Error: docker buildx is required but not available"
    exit 1
fi

# Ensure a buildx builder exists and is selected
if ! docker buildx inspect >/dev/null 2>&1; then
    docker buildx create --name ecommerce-builder --use >/dev/null
fi
docker buildx inspect --bootstrap >/dev/null

run_buildx_with_retry() {
    local attempt=1
    while [ "$attempt" -le "$BUILD_RETRY_ATTEMPTS" ]; do
        if "$@"; then
            return 0
        fi

        if [ "$attempt" -lt "$BUILD_RETRY_ATTEMPTS" ]; then
            local sleep_seconds=$((BUILD_RETRY_DELAY_SECONDS * attempt))
            echo "Build/push failed (attempt $attempt/$BUILD_RETRY_ATTEMPTS). Retrying in ${sleep_seconds}s..."
            sleep "$sleep_seconds"
        fi

        attempt=$((attempt + 1))
    done

    return 1
}

# Function to build and optionally push service with shared registry cache
build_service() {
    local service=$1
    local dockerfile_path=$2
    local image_base="$REGISTRY/$GITHUB_USERNAME/${APP_NAME}-$service"
    local cache_ref="$image_base:buildcache"
    
    echo "Building $service image..."
    local platform_args=()
    if [ -n "$PLATFORM" ]; then
        platform_args=(--platform "$PLATFORM")
    fi

    run_buildx_with_retry docker buildx build \
        "${platform_args[@]}" \
        --build-arg "YARN_REGISTRY=$YARN_REGISTRY" \
        --cache-from "type=registry,ref=$cache_ref" \
        --cache-to "type=registry,ref=$cache_ref,mode=max" \
        -t "$image_base:$VERSION" \
        -t "$image_base:latest" \
        -f "$dockerfile_path" \
        $( [ "$PUSH_IMAGES" = true ] && echo "--push" || echo "--load" ) \
        .

    if [ "$PUSH_IMAGES" = true ]; then
        echo "$service build and push completed!"
    else
        echo "$service build completed (not pushed)."
    fi
}

# Function to build nginx with shared registry cache
build_nginx() {
    local image_base="$REGISTRY/$GITHUB_USERNAME/${APP_NAME}-nginx"
    local cache_ref="$image_base:buildcache"

    echo "Building nginx image..."
    local platform_args=()
    if [ -n "$PLATFORM" ]; then
        platform_args=(--platform "$PLATFORM")
    fi

    run_buildx_with_retry docker buildx build \
        "${platform_args[@]}" \
        --build-arg "YARN_REGISTRY=$YARN_REGISTRY" \
        --cache-from "type=registry,ref=$cache_ref" \
        --cache-to "type=registry,ref=$cache_ref,mode=max" \
        -t "$image_base:$VERSION" \
        -t "$image_base:latest" \
        -f nginx/Dockerfile \
        $( [ "$PUSH_IMAGES" = true ] && echo "--push" || echo "--load" ) \
        .

    if [ "$PUSH_IMAGES" = true ]; then
        echo "nginx build and push completed!"
    else
        echo "nginx build completed (not pushed)."
    fi
}

# Build services based on flags
echo "Starting build process..."
echo "Version: $VERSION"
echo "Timestamp: $TIMESTAMP"
echo "Yarn registry: $YARN_REGISTRY"
echo "Platform: ${PLATFORM:-native}"
echo "Push images: $PUSH_IMAGES"
echo "Build retry attempts: $BUILD_RETRY_ATTEMPTS"
echo "Parallel mode: $PARALLEL"
echo ""

run_build_task() {
    local name=$1
    shift
    echo "=== Building $name ==="
    "$@"
    echo ""
}

PIDS=()

start_task() {
    if [ "$PARALLEL" = true ]; then
        "$@" &
        PIDS+=($!)
    else
        "$@"
    fi
}

if [ "$BUILD_FRONTEND" = true ]; then
    start_task run_build_task "Frontend" build_service "frontend" "apps/frontend/Dockerfile"
fi

if [ "$BUILD_BACKEND" = true ]; then
    start_task run_build_task "Backend" build_service "backend" "apps/backend/Dockerfile"
fi

if [ "$BUILD_API" = true ]; then
    start_task run_build_task "API" build_service "api" "apps/api/Dockerfile"
fi

if [ "$BUILD_ADMIN" = true ]; then
    start_task run_build_task "Admin" build_service "admin" "apps/admin/Dockerfile"
fi

if [ "$BUILD_NGINX" = true ]; then
    start_task run_build_task "Nginx" build_nginx
fi

if [ "$PARALLEL" = true ]; then
    for pid in "${PIDS[@]}"; do
        wait "$pid"
    done
fi

echo "All requested builds completed successfully!"
echo "Version: $VERSION"
echo "Timestamp: $TIMESTAMP" 
