# Stage 1: Build
FROM node:22-alpine AS builder
WORKDIR /usr/src/app

# Install build tools for native dependencies (argon2) and openssl (Prisma)
RUN apk add --no-cache python3 py3-pip make g++ libc6-compat openssl

RUN npm install -g pnpm@9
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter ai-gateway exec prisma generate
RUN pnpm run build

# Stage 2: Production
FROM node:22-alpine
WORKDIR /usr/src/app

# Install build tools again for production `pnpm install` and openssl for Prisma
RUN apk add --no-cache python3 py3-pip make g++ libc6-compat openssl

RUN npm install -g pnpm@9 pm2

# Copy all source files (which includes all package.json files for workspace)
COPY . .

# Copy only the compiled output from the builder stage
COPY --from=builder /usr/src/app/apps/ai-gateway/dist ./apps/ai-gateway/dist
COPY --from=builder /usr/src/app/packages ./packages

# Install production dependencies
RUN pnpm install --prod --frozen-lockfile

# Generate Prisma Client
RUN pnpm --filter ai-gateway exec prisma generate

EXPOSE 3000
CMD ["sh", "-c", "pnpm --filter ai-gateway exec prisma migrate deploy && pm2-runtime start ecosystem.config.js"]
