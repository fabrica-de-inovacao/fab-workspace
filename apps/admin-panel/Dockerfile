# Multi-stage Dockerfile for @fabrica/admin-panel
FROM node:22-alpine AS builder

WORKDIR /app

ENV NODE_ENV=development

# Copy root manifests
COPY package.json yarn.lock turbo.json tsconfig.base.json ./

# Copy all workspace package manifests
COPY packages/types/package.json packages/types/
COPY packages/db/package.json packages/db/
COPY apps/admin-panel/package.json apps/admin-panel/

# Copy all sources needed for build
COPY packages/types packages/types
COPY packages/db packages/db
COPY apps/admin-panel apps/admin-panel

# Install dependencies (including devDependencies for build)
RUN yarn install --frozen-lockfile

# Build Admin Panel
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN yarn build --filter=@fabrica/admin-panel...

# Nginx Runner stage
FROM nginx:alpine AS runner

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/admin-panel/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
