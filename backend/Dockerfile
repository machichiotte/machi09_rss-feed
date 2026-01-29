# --- Build Stage ---
FROM node:20-slim AS builder

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Copy only the pre-download script for better caching
COPY src/scripts/download_models.ts ./src/scripts/download_models.ts
COPY tsconfig.json ./

# Pre-download AI models (this layer will be cached unless download_models.ts changes)
RUN pnpm dlx tsx src/scripts/download_models.ts

# Now copy the rest of the source code
COPY src ./src

# Build the application (we still build to ensure types are correct)
RUN pnpm build

# --- Production Stage ---
FROM node:20-slim AS runner

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

USER node
ENV HOME=/home/node \
    PATH=/home/node/.local/bin:$PATH

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=7860

# Copy everything needed to run via tsx
COPY --from=builder --chown=node:node /app/package.json ./
COPY --from=builder --chown=node:node /app/pnpm-lock.yaml ./
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/src ./src
COPY --from=builder --chown=node:node /app/tsconfig.json ./
COPY --from=builder --chown=node:node /app/models_cache ./models_cache

# Expose port
EXPOSE 7860

# Start using tsx to avoid ESM extension issues
CMD ["pnpm", "dlx", "tsx", "src/index.ts"]
