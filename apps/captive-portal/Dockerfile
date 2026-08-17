# Multi-stage Dockerfile for @fabrica/captive-portal
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root manifests
COPY package.json yarn.lock turbo.json tsconfig.base.json ./

# Copy package manifests
COPY apps/captive-portal/package.json apps/captive-portal/

# Copy sources
COPY apps/captive-portal apps/captive-portal

# Install dependencies
RUN yarn install --frozen-lockfile

# Build Captive Portal
RUN yarn build --filter=@fabrica/captive-portal...

# Nginx Runner stage
FROM nginx:alpine AS runner

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/captive-portal/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
