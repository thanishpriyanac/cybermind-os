#!/bin/bash
SERVICES=(
  "identity"
  "gateway"
  "normalization"
  "connector"
  "siem-ingestion"
  "search-api"
  "detection-engine"
  "correlation-engine"
  "alert-management"
  "investigation"
  "ai-gateway"
  "soar"
)

for service in "${SERVICES[@]}"; do
  mkdir -p "services/$service"
  cat << DOCKERFILE > "services/$service/Dockerfile"
FROM docker.io/node:20-alpine AS builder
WORKDIR /app
# Install build tools for native dependencies like argon2 or bcrypt
RUN apk add --no-cache python3 make g++
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .
RUN npx nx build ${service}-service || npx nx build ${service}

FROM docker.io/node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
# We also might need build tools in runner if dependencies are installed there
RUN apk add --no-cache python3 make g++
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production --legacy-peer-deps
# Try both common output paths from Nx
COPY --from=builder /app/dist/services/${service} ./dist || true
COPY --from=builder /app/services/${service}/dist ./dist || true
# Execute the main entrypoint
CMD ["node", "dist/main.js"]
DOCKERFILE
  echo "Generated Dockerfile for $service"
done
