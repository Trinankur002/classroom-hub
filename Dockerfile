# ==============================================================================
# Multi-stage Dockerfile for Classroom Hub (Single-Container Fullstack Deployment)
# Suitable for Render Web Services (https://render.com)
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build Frontend (React + Vite)
# ------------------------------------------------------------------------------
FROM node:22-alpine AS web-builder
WORKDIR /app/web

# Install frontend dependencies
COPY web/package*.json ./
RUN npm ci

# Copy frontend source code
COPY web/ ./

# In single-container deployment, API requests use same-origin /api
ENV VITE_BACKEND_API_URL=/api
ARG VITE_LIVEKIT_WS_URL=wss://classroom-hub-livekit.onrender.com
ENV VITE_LIVEKIT_WS_URL=$VITE_LIVEKIT_WS_URL

# Build production bundle -> /app/web/dist
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Build Backend (NestJS + TypeScript)
# ------------------------------------------------------------------------------
FROM node:22-alpine AS server-builder
WORKDIR /app/server

# Install backend dependencies
COPY server/package*.json ./
RUN npm ci

# Copy backend source code
COPY server/ ./

# Build production NestJS app -> /app/server/dist
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 3: Unified Production Runner
# ------------------------------------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
# Render automatically sets PORT (defaults to 10000 on Render)
ENV PORT=10000

# Install production-only dependencies
COPY server/package*.json ./
RUN npm ci --omit=dev

# Copy compiled backend
COPY --from=server-builder /app/server/dist ./dist

# Copy compiled frontend SPA into /app/client (served automatically by NestJS)
COPY --from=web-builder /app/web/dist ./client

# Copy GCP key if present locally
COPY server/example.gcp-key.json ./gcp-key.json.example
COPY server/*gcp-key.json* ./

EXPOSE 10000

CMD ["node", "dist/main.js"]
