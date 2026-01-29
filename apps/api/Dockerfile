# ===========================================
# SILENTBOX CLOUD API - Dockerfile
# ===========================================

FROM node:20-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# ===========================================
# Dependencies stage
# ===========================================
FROM base AS deps

# Copy workspace files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/

# Install dependencies
RUN pnpm install --frozen-lockfile

# ===========================================
# Builder stage
# ===========================================
FROM base AS builder

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules

# Copy source files
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api
COPY tsconfig.json ./

# Build shared package
WORKDIR /app/packages/shared
RUN pnpm build

# Build API
WORKDIR /app/apps/api
RUN pnpm build

# ===========================================
# Production stage
# ===========================================
FROM node:20-alpine AS runner

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 silentbox

# Copy built files
COPY --from=builder --chown=silentbox:nodejs /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder --chown=silentbox:nodejs /app/packages/shared/package.json ./packages/shared/
COPY --from=builder --chown=silentbox:nodejs /app/apps/api/dist ./apps/api/dist
COPY --from=builder --chown=silentbox:nodejs /app/apps/api/package.json ./apps/api/

# Copy workspace config
COPY --chown=silentbox:nodejs package.json pnpm-workspace.yaml ./

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

USER silentbox

EXPOSE 3001

ENV NODE_ENV=production
ENV API_HOST=0.0.0.0
ENV API_PORT=3001

WORKDIR /app/apps/api

CMD ["node", "dist/index.js"]
