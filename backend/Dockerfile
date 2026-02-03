# Dockerfile pour le backend
FROM node:20-slim

# Installation des dépendances système pour native modules
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    libvips-dev \
    && rm -rf /var/lib/apt/lists/*

# Activation de pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copie des fichiers de dépendances
COPY package.json pnpm-lock.yaml ./

# Installation des dépendances (incluant dev pour tsx)
RUN pnpm install --frozen-lockfile

# Copie du reste du code
COPY . .

# Création du dossier de cache pour les modèles IA
RUN mkdir -p /app/models_cache && chown -R node:node /app

# Exposition du port
EXPOSE 4009

# On utilise tsx pour exécuter directement le TypeScript
# Cela évite les problèmes d'extensions .js manquantes en mode ESM pur
CMD ["pnpm", "dlx", "tsx", "src/index.ts"]
