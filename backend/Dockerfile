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

# Build the application
RUN yarn build

# --- Production Stage ---
FROM node:20-slim AS runner

# In node:slim images, a 'node' user with UID 1000 already exists.
# Hugging Face requires UID 1000.
USER node
ENV HOME=/home/node \
    PATH=/home/node/.local/bin:$PATH

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=7860

# Copy everything needed to run
COPY --from=builder --chown=node:node /app/package.json ./
COPY --from=builder --chown=node:node /app/yarn.lock ./
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/models_cache ./models_cache

# Expose port (HF default is 7860)
EXPOSE 7860

# Start the application using the compiled code
CMD ["node", "dist/index.js"]
