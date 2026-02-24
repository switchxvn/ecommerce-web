# Stage 1: Dependencies
FROM node:20 AS deps

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl python3 make g++ git \
    && rm -rf /var/lib/apt/lists/*

# Set environment variables
ENV NX_SKIP_NX_CACHE_CREATION=true
ENV NX_DAEMON=false
ENV CYPRESS_INSTALL_BINARY=0

# Copy package.json and yarn.lock
COPY package.json yarn.lock ./
COPY nx.json ./

# Install dependencies in smaller chunks to avoid memory issues
RUN yarn config set ignore-engines true && \
    yarn config set network-timeout 300000 && \
    yarn install --frozen-lockfile --production=false

# Stage 2: Builder
FROM node:20 AS builder

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl python3 make g++ git \
    && rm -rf /var/lib/apt/lists/*

# Set environment variables
ENV NX_SKIP_NX_CACHE_CREATION=true
ENV NX_DAEMON=false
ENV CYPRESS_INSTALL_BINARY=0
ENV NODE_OPTIONS="--max_old_space_size=4096"

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy project files
COPY package.json yarn.lock ./
COPY nx.json tsconfig.base.json ./
COPY tsconfig.json ./
COPY eslint.config.mjs ./
COPY .prettierrc .prettierignore ./
COPY libs/database/tsconfig.migration.json ./libs/database/tsconfig.migration.json

# Copy source code
COPY libs ./libs
COPY apps/backend ./apps/backend

# Build arguments for environment file handling
ARG ENV_FILE=.env.production
ARG BACKEND_FALLBACK_ENV=.env
ARG BACKEND_NODE_ENV=production
ARG BACKEND_PORT=3333
ARG BACKEND_API_PREFIX=api
ARG BACKEND_FRONTEND_URL=http://localhost:4201

# Ensure backend always has an .env file inside the image
RUN set -e; \
    PRIMARY_FILE="apps/backend/${ENV_FILE}"; \
    FALLBACK_FILE="apps/backend/${BACKEND_FALLBACK_ENV}"; \
    if [ -f "$PRIMARY_FILE" ]; then \
        cp "$PRIMARY_FILE" "apps/backend/.env"; \
    elif [ -f "$FALLBACK_FILE" ]; then \
        cp "$FALLBACK_FILE" "apps/backend/.env"; \
    else \
        printf "NODE_ENV=%s\nPORT=%s\nAPI_PREFIX=%s\nFRONTEND_URL=%s\n" \
            "$BACKEND_NODE_ENV" \
            "$BACKEND_PORT" \
            "$BACKEND_API_PREFIX" \
            "$BACKEND_FRONTEND_URL" \
            > "apps/backend/.env"; \
    fi

# Build the application
RUN yarn nx build backend --prod

# Stage 3: Runner
FROM node:20 AS runner

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set environment variables
ENV NODE_ENV=production

# Copy package files for production dependencies
COPY package.json yarn.lock ./

# Copy node_modules from deps stage and filter out dev dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy built application
COPY --from=builder /app/dist/apps/backend ./dist

# Copy necessary files for migrations
COPY --from=builder /app/libs/database/tsconfig.migration.json ./libs/database/tsconfig.migration.json
COPY --from=builder /app/tsconfig.base.json ./tsconfig.base.json
COPY --from=builder /app/tsconfig.json ./tsconfig.json

# Copy the migrations and config directories
COPY --from=builder /app/libs/database/src/migrations ./libs/database/src/migrations
COPY --from=builder /app/libs/database/src/config ./libs/database/src/config
COPY --from=builder /app/libs/shared ./libs/shared

# Copy environment file
COPY --from=builder /app/apps/backend/.env .env

# Create and setup entrypoint script
COPY scripts/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Expose the port the app runs on
EXPOSE 3333

# Use the entrypoint script
ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["node", "dist/main.js"] 
