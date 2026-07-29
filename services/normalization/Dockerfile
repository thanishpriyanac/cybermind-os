FROM docker.io/node:20-alpine AS builder
WORKDIR /app
# Install build tools for native dependencies like argon2 or bcrypt
RUN apk add --no-cache python3 make g++
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .
RUN npx nx build normalization-service || npx nx build normalization

FROM docker.io/node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
# We also might need build tools in runner if dependencies are installed there
RUN apk add --no-cache python3 make g++
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production --legacy-peer-deps
# Try both common output paths from Nx
COPY --from=builder /app/dist/services/normalization ./dist || true
COPY --from=builder /app/services/normalization/dist ./dist || true
# Execute the main entrypoint
CMD ["node", "dist/main.js"]
