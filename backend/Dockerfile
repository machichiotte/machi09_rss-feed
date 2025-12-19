# --- Build Stage ---
FROM node:20-slim AS builder

WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./

# Install all dependencies
RUN yarn install --frozen-lockfile

# Copy the pre-download script and source
COPY src ./src
COPY tsconfig.json ./

# Pre-download AI models
RUN npx tsx src/scripts/download_models.ts

# Build the application (we still build to ensure types are correct)
RUN yarn build

# --- Production Stage ---
FROM node:20-slim AS runner

USER node
ENV HOME=/home/node \
    PATH=/home/node/.local/bin:$PATH

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=7860

# Copy everything needed to run via tsx
COPY --from=builder --chown=node:node /app/package.json ./
COPY --from=builder --chown=node:node /app/yarn.lock ./
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/src ./src
COPY --from=builder --chown=node:node /app/tsconfig.json ./
COPY --from=builder --chown=node:node /app/models_cache ./models_cache

# Expose port
EXPOSE 7860

# Start using tsx to avoid ESM extension issues
CMD ["npx", "tsx", "src/index.ts"]
