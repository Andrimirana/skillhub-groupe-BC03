# ============================================================
# SkillHub – Dockerfile Back-End API (Node.js / Express)
# Multi-stage : deps → builder → runtime
# ============================================================

# ── Stage 1 : Dépendances de production ─────────────────────
FROM node:20-alpine AS deps

LABEL stage="deps"

WORKDIR /app

# Copie uniquement les manifestes pour exploiter le cache de couches
COPY package.json package-lock.json ./

# Installation des dépendances de PRODUCTION uniquement
RUN npm ci --frozen-lockfile --omit=dev


# ── Stage 2 : Builder (compilation TypeScript si applicable) ─
FROM node:20-alpine AS builder

LABEL stage="builder"

WORKDIR /app

# Copie de tous les manifestes + code source
COPY package.json package-lock.json ./
RUN npm ci --frozen-lockfile

COPY . .

# Si le projet est en TypeScript, compiler ici.
# Décommenter la ligne suivante si un script "build" est défini dans package.json :
# RUN npm run build


# ── Stage 3 : Runtime ────────────────────────────────────────
FROM node:20-alpine AS runtime

LABEL maintainer="SkillHub Team"
LABEL stage="runtime"

# Bonne pratique sécurité : ne pas tourner en root
RUN addgroup -S skillhub && adduser -S skillhub -G skillhub

WORKDIR /app

# Copie uniquement les dépendances de production depuis le stage deps
COPY --from=deps /app/node_modules ./node_modules

# Copie du code source compilé (ou source JS brut si pas de TS)
# Si TypeScript : COPY --from=builder /app/dist ./dist
# Si JS natif  :
COPY --from=builder /app/src ./src
COPY package.json ./

# Variables d'environnement — AUCUNE valeur sensible ici
# Toutes les valeurs réelles sont injectées via le fichier .env ou les secrets du pipeline
ENV NODE_ENV=production
ENV PORT=3000

# Changement d'utilisateur (non-root)
USER skillhub

# Exposition du port de l'API
EXPOSE 3000

# Healthcheck — vérifie l'endpoint /health de l'API
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Démarrage de l'API
# Si TypeScript compilé : CMD ["node", "dist/index.js"]
CMD ["node", "src/index.js"]
