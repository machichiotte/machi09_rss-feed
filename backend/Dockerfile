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

# Create a non-root user for Hugging Face
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=7860

# Copy everything needed to run via tsx
# Make sure files are owned by our user
COPY --from=builder --chown=user:user /app/package.json ./
COPY --from=builder --chown=user:user /app/yarn.lock ./
COPY --from=builder --chown=user:user /app/node_modules ./node_modules
COPY --from=builder --chown=user:user /app/src ./src
COPY --from=builder --chown=user:user /app/tsconfig.json ./
COPY --from=builder --chown=user:user /app/models_cache ./models_cache

# Expose port (HF default is 7860)
EXPOSE 7860

# Start the application
CMD ["npx", "tsx", "src/index.ts"]
