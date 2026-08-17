# Multi-stage Dockerfile for @fabrica/api
FROM node:22-alpine AS builder

WORKDIR /app

ENV NODE_ENV=development

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy root manifests
COPY package.json yarn.lock turbo.json tsconfig.base.json ./

# Copy packages
COPY packages/types/package.json packages/types/
COPY packages/db/package.json packages/db/
COPY apps/api/package.json apps/api/

# Copy all source files
COPY packages/types packages/types
COPY packages/db packages/db
COPY apps/api apps/api

# Install all dependencies (including devDependencies for build)
RUN yarn install --frozen-lockfile

# Build packages and API app
RUN yarn build --filter=@fabrica/api...

# Production Runner stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# Copy built code and dependencies from builder stage
COPY --from=builder /app/package.json ./
COPY --from=builder /app/yarn.lock ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api ./apps/api

EXPOSE 3001

CMD ["node", "apps/api/dist/index.js"]
