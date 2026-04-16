# ============================================================
# SkillHub – Dockerfile Front-End React
# Multi-stage : builder (Node) → runtime (nginx:alpine)
# ============================================================

# ── Stage 1 : Builder ────────────────────────────────────────
FROM node:20-alpine AS builder

# Métadonnées
LABEL maintainer="SkillHub Team"
LABEL stage="builder"

WORKDIR /app

# Copie des fichiers de dépendances en premier (cache Docker)
COPY package.json package-lock.json ./

# Installation des dépendances (sans les devDependencies en prod)
RUN npm ci --frozen-lockfile

# Copie du code source
COPY . .

# Variables de build (passées au moment du docker build --build-arg)
# Aucune valeur sensible ici — utiliser des ARG pour les URLs publiques
ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=${VITE_API_URL}

# Build de production
RUN npm run build


# ── Stage 2 : Runtime ────────────────────────────────────────
FROM nginx:1.27-alpine AS runtime

LABEL maintainer="SkillHub Team"
LABEL stage="runtime"

# Suppression de la configuration nginx par défaut
RUN rm /etc/nginx/conf.d/default.conf

# Configuration nginx personnalisée pour React Router (SPA)
COPY nginx.conf /etc/nginx/conf.d/skillhub.conf

# Copie des fichiers buildés depuis le stage builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Exposition du port HTTP
EXPOSE 80

# Healthcheck intégré
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Démarrage de nginx en premier plan (non-daemon)
CMD ["nginx", "-g", "daemon off;"]
