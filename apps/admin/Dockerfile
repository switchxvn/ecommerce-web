# ----------------------------
# Build stage
# ----------------------------
FROM node:20 AS builder

# Set working directory
WORKDIR /app

# Install system dependencies for native modules
RUN apt-get update && apt-get install -y \
curl python3 make g++ git \
&& rm -rf /var/lib/apt/lists/*

# Copy only essential files to install dependencies
COPY package.json yarn.lock ./
COPY nx.json tsconfig.base.json ./

# Set environment variables with optimized settings
ENV YARN_CACHE_FOLDER=/app/.yarn-cache \
    NX_SKIP_NX_CACHE_CREATION=true \
    NX_DAEMON=false \
    CYPRESS_INSTALL_BINARY=0 \
    NODE_OPTIONS="--max_old_space_size=4096 --no-experimental-fetch" \
    YARN_NETWORK_TIMEOUT=300000

# Install dependencies with optimized settings
RUN yarn config set ignore-engines true \
    && yarn config set network-timeout 300000 \
    && yarn install --frozen-lockfile --prefer-offline --network-concurrent 1

# Copy application code
COPY apps/admin ./apps/admin
COPY libs ./libs

# Build argument for environment file (optional)
ARG ENV_FILE=.env
ARG ADMIN_HOST=localhost
ARG ADMIN_PORT=4201
ARG ADMIN_API_BASE=http://localhost:3333

# Ensure the app always has an .env file available
RUN if [ -f "apps/admin/${ENV_FILE}" ]; then \
        cp "apps/admin/${ENV_FILE}" "apps/admin/.env"; \
    else \
        printf "NITRO_PORT=%s\nNUXT_PORT=%s\nNUXT_HOST=%s\nAPI_BASE=%s\n" \
            "$ADMIN_PORT" "$ADMIN_PORT" "$ADMIN_HOST" "$ADMIN_API_BASE" \
            > "apps/admin/.env"; \
    fi

# Build only admin app with Nuxt
RUN mkdir -p apps/admin/.output \
    && cd apps/admin \
    && NODE_OPTIONS="--max-old-space-size=4096" npx nuxt build \
    && ls -la .output/server || exit 1

# ----------------------------
# Production stage
# ----------------------------
FROM node:20 AS runner

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
curl \
&& rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package.json yarn.lock ./

# Set environment with optimized settings
ENV YARN_CACHE_FOLDER=/app/.yarn-cache \
    NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3001 \
    NX_SKIP_NX_CACHE_CREATION=true \
    NX_DAEMON=false \
    CYPRESS_INSTALL_BINARY=0 \
    NODE_OPTIONS="--max-old-space-size=4096 --no-experimental-fetch" \
    YARN_NETWORK_TIMEOUT=300000

# Install production dependencies with optimized settings
RUN yarn config set ignore-engines true \
    && yarn config set network-timeout 300000 \
    && yarn install --production --frozen-lockfile --prefer-offline --network-concurrent 1

# Copy built output from builder
COPY --from=builder /app/apps/admin/.output ./.output
COPY --from=builder /app/apps/admin/.env .env

EXPOSE 3001

# Start Nuxt app
CMD ["node", ".output/server/index.mjs"] 
