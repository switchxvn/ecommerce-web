#!/bin/bash

set -e

usage() {
    echo "Usage: ./scripts/deploy.sh [backend] [api] [frontend] [admin] [nginx]"
    echo "Run without arguments to deploy all services."
}

load_env() {
    if [ -f ".env" ]; then
        export $(grep -v '^#' .env | xargs)
    else
        echo "Error: .env file not found"
        exit 1
    fi
}

validate_env() {
    if [ -z "$GITHUB_USERNAME" ] || [ -z "$REGISTRY" ] || [ -z "$GITHUB_TOKEN" ]; then
        echo "Error: GITHUB_USERNAME, REGISTRY, and GITHUB_TOKEN must be set in .env file"
        exit 1
    fi
}

check_registry_login() {
    echo "Checking GitHub Container Registry authentication..."
    if ! docker info | grep -q "ghcr.io"; then
        echo "Logging in to GitHub Container Registry..."
        echo "$GITHUB_TOKEN" | docker login ghcr.io -u "$GITHUB_USERNAME" --password-stdin
    fi
}

stop_container() {
    local container_name=$1

    if [ "$(docker ps -aq -f "name=^/${container_name}$")" ]; then
        echo "Stopping existing $container_name container..."
        docker stop "$container_name" 2>/dev/null || true
        docker rm "$container_name" 2>/dev/null || true
    fi
}

wait_for_container() {
    local container_name=$1
    local max_attempts=30
    local attempt=1

    echo "Waiting for $container_name to be ready..."
    while [ $attempt -le $max_attempts ]; do
        if docker ps | grep "$container_name" | grep -q "Up"; then
            echo "$container_name is ready!"
            return 0
        fi
        echo "Attempt $attempt/$max_attempts: $container_name is not ready yet..."
        sleep 2
        attempt=$((attempt + 1))
    done

    echo "Error: $container_name failed to start properly"
    docker logs "$container_name"
    return 1
}

ensure_network_exists() {
    echo "Ensuring docker network exists..."
    if ! docker network inspect "$NETWORK_NAME" >/dev/null 2>&1; then
        echo "Creating network $NETWORK_NAME..."
        docker network create "$NETWORK_NAME"
    fi
}

pull_image() {
    local service=$1
    echo "Pulling ${service} image..."
    docker pull --platform linux/amd64 "$REGISTRY/$GITHUB_USERNAME/${APP_NAME}-${service}:latest"
}

deploy_backend() {
    pull_image "backend"
    stop_container "$BACKEND_CONTAINER"

    echo "Starting backend..."
    docker run -d \
        --platform linux/amd64 \
        --name "$BACKEND_CONTAINER" \
        --network "$NETWORK_NAME" \
        --network-alias backend \
        -p "$BACKEND_PORT:3333" \
        --env-file apps/backend/.env.production \
        -e NODE_ENV=production \
        --restart unless-stopped \
        "$REGISTRY/$GITHUB_USERNAME/${APP_NAME}-backend:latest"

    wait_for_container "$BACKEND_CONTAINER"
}

deploy_api() {
    pull_image "api"
    stop_container "$API_CONTAINER"

    echo "Starting api..."
    docker run -d \
        --platform linux/amd64 \
        --name "$API_CONTAINER" \
        --network "$NETWORK_NAME" \
        --network-alias api \
        -p "$API_PORT:4000" \
        --env-file apps/api/.env.production \
        -e NODE_ENV=production \
        --restart unless-stopped \
        "$REGISTRY/$GITHUB_USERNAME/${APP_NAME}-api:latest"

    wait_for_container "$API_CONTAINER"
}

deploy_frontend() {
    pull_image "frontend"
    stop_container "$FRONTEND_CONTAINER"

    echo "Starting frontend..."
    docker run -d \
        --platform linux/amd64 \
        --name "$FRONTEND_CONTAINER" \
        --network "$NETWORK_NAME" \
        --network-alias frontend \
        -p "$FRONTEND_PORT:4201" \
        --env-file apps/frontend/.env.production \
        -e NODE_ENV=production \
        -e HOST=0.0.0.0 \
        --restart unless-stopped \
        "$REGISTRY/$GITHUB_USERNAME/${APP_NAME}-frontend:latest"

    wait_for_container "$FRONTEND_CONTAINER"
}

deploy_admin() {
    pull_image "admin"
    stop_container "$ADMIN_CONTAINER"

    echo "Starting admin..."
    docker run -d \
        --platform linux/amd64 \
        --name "$ADMIN_CONTAINER" \
        --network "$NETWORK_NAME" \
        --network-alias admin \
        -p "$ADMIN_PORT:3001" \
        --env-file apps/admin/.env.production \
        -e NODE_ENV=production \
        -e HOST=0.0.0.0 \
        --restart unless-stopped \
        "$REGISTRY/$GITHUB_USERNAME/${APP_NAME}-admin:latest"

    wait_for_container "$ADMIN_CONTAINER"
}

deploy_nginx() {
    pull_image "nginx"
    stop_container "$NGINX_CONTAINER"

    echo "Starting nginx..."
    docker run -d \
        --platform linux/amd64 \
        --name "$NGINX_CONTAINER" \
        --network "$NETWORK_NAME" \
        -p "$NGINX_HTTP_PORT:80" \
        -p "$NGINX_HTTPS_PORT:443" \
        -v /etc/nginx/ssl:/etc/nginx/ssl:ro \
        --restart unless-stopped \
        "$REGISTRY/$GITHUB_USERNAME/${APP_NAME}-nginx:latest"

    wait_for_container "$NGINX_CONTAINER"
}

is_valid_service() {
    case "$1" in
        backend|api|frontend|admin|nginx)
            return 0
            ;;
        *)
            return 1
            ;;
    esac
}

should_deploy() {
    local target=$1

    for service in "${SELECTED_SERVICES[@]}"; do
        if [ "$service" = "$target" ]; then
            return 0
        fi
    done

    return 1
}

deploy_selected_services() {
    if should_deploy "backend"; then
        deploy_backend
    fi

    if should_deploy "api"; then
        deploy_api
    fi

    if should_deploy "frontend"; then
        deploy_frontend
    fi

    if should_deploy "admin"; then
        deploy_admin
    fi

    if should_deploy "nginx"; then
        deploy_nginx
    fi
}

print_summary() {
    echo "Deployment completed successfully!"
    echo "Services:"
    echo "- Frontend: http://localhost:$FRONTEND_PORT"
    echo "- Admin: http://localhost:$ADMIN_PORT"
    echo "- Backend: http://localhost:$BACKEND_PORT"
    echo "- API: http://localhost:$API_PORT"
    echo "- Nginx: http://localhost:$NGINX_HTTP_PORT and https://localhost:$NGINX_HTTPS_PORT"

    echo -e "\nRunning containers:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

    echo -e "\nNetwork information:"
    docker network inspect "$NETWORK_NAME"
}

load_env
validate_env

APP_NAME="${APP_NAME:-cable-car}"
NGINX_HTTP_PORT="${NGINX_HTTP_PORT:-80}"
NGINX_HTTPS_PORT="${NGINX_HTTPS_PORT:-443}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"
ADMIN_PORT="${ADMIN_PORT:-3001}"
BACKEND_PORT="${BACKEND_PORT:-3333}"
API_PORT="${API_PORT:-4000}"
NETWORK_NAME="${NETWORK_NAME:-app-network}"

FRONTEND_CONTAINER="${APP_NAME}-frontend"
ADMIN_CONTAINER="${APP_NAME}-admin"
BACKEND_CONTAINER="${APP_NAME}-backend"
API_CONTAINER="${APP_NAME}-api"
NGINX_CONTAINER="${APP_NAME}-nginx"

if [ $# -eq 0 ]; then
    SELECTED_SERVICES=("backend" "api" "frontend" "admin" "nginx")
else
    SELECTED_SERVICES=()
    for service in "$@"; do
        if ! is_valid_service "$service"; then
            echo "Error: Unknown service '$service'"
            usage
            exit 1
        fi
        SELECTED_SERVICES+=("$service")
    done
fi

check_registry_login
ensure_network_exists
deploy_selected_services
print_summary
