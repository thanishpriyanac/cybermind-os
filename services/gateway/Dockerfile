FROM docker.io/node:20-alpine AS builder
WORKDIR /app
# Install build tools for native dependencies like argon2 or bcrypt
RUN apk add --no-cache python3 make g++
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .
# Generate Prisma Client if schema exists
RUN [ -f "services/gateway/prisma/schema.prisma" ] && npx prisma generate --schema=services/gateway/prisma/schema.prisma || true
RUN npx nx build gateway-service || npx nx build gateway

FROM docker.io/node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
# We also might need build tools in runner if dependencies are installed there
RUN apk add --no-cache python3 make g++ openssl
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production --legacy-peer-deps
# Copy generated Prisma clients
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma || true
# Try both common output paths from Nx
COPY --from=builder /app/dist/services/gateway ./dist || true
COPY --from=builder /app/services/gateway/dist ./dist || true
# Execute the main entrypoint
CMD ["node", "dist/main.js"]
