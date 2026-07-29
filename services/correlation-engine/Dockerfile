FROM docker.io/node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .
RUN npx nx build correlation-engine-service || npx nx build correlation-engine

FROM docker.io/node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production --legacy-peer-deps
# Try both common output paths from Nx
COPY --from=builder /app/dist/services/correlation-engine ./dist || true
COPY --from=builder /app/services/correlation-engine/dist ./dist || true
# Execute the main entrypoint
CMD ["node", "dist/main.js"]
