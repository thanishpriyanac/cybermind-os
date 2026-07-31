# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /usr/src/app
RUN npm install -g pnpm@9
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm exec prisma generate
RUN pnpm run build

# Stage 2: Production
FROM node:20-alpine
WORKDIR /usr/src/app
RUN npm install -g pnpm@9 pm2

# Copy all source files (which includes all package.json files for workspace)
COPY . .

# Copy only the compiled output from the builder stage
COPY --from=builder /usr/src/app/apps/ai-gateway/dist ./apps/ai-gateway/dist
COPY --from=builder /usr/src/app/packages ./packages

# Install production dependencies
RUN pnpm install --prod --frozen-lockfile

# Generate Prisma Client
RUN pnpm exec prisma generate

EXPOSE 3000
CMD ["sh", "-c", "pnpm exec prisma migrate deploy && pm2-runtime start ecosystem.config.js"]
