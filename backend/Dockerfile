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

# --- Production Stage ---
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy everything needed to run via tsx
COPY --from=builder /app/package.json ./
COPY --from=builder /app/yarn.lock ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/tsconfig.json ./
COPY --from=builder /app/models_cache ./models_cache

# Expose port
EXPOSE 3000

# Start the application using tsx to handle ESM extensions and aliases automatically
CMD ["npx", "tsx", "src/index.ts"]
