FROM node:20-slim AS base
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY packages/types/package.json packages/types/
RUN npm ci --workspace=apps/api --workspace=packages/types --include-workspace-root

# Copy source
COPY tsconfig.base.json ./
COPY packages/types/ packages/types/
COPY apps/api/ apps/api/

# Build
RUN npm run build -w apps/api

# Production
FROM node:20-slim
WORKDIR /app
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=base /app/apps/api/dist ./apps/api/dist
COPY --from=base /app/apps/api/package.json ./apps/api/
COPY --from=base /app/packages/types/ ./packages/types/
COPY --from=base /app/package.json ./

ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "apps/api/dist/index.js"]
