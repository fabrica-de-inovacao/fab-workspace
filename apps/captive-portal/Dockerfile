# Multi-stage Dockerfile for @fabrica/captive-portal
FROM node:22-alpine AS builder

WORKDIR /app

ENV NODE_ENV=development

# Copy root manifests
COPY package.json yarn.lock turbo.json tsconfig.base.json ./

# Copy all workspace package manifests
COPY packages/types/package.json packages/types/
COPY packages/db/package.json packages/db/
COPY apps/captive-portal/package.json apps/captive-portal/

# Copy all sources needed for build
COPY packages/types packages/types
COPY packages/db packages/db
COPY apps/captive-portal apps/captive-portal

# Install dependencies (including devDependencies for build)
RUN yarn install --frozen-lockfile

# Build Captive Portal
RUN yarn build --filter=@fabrica/captive-portal...

# Nginx Runner stage
FROM nginx:alpine AS runner

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/captive-portal/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
