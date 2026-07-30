# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

COPY . .

# Generate Prisma Client & Build NestJS app
RUN npx prisma generate
RUN npm run build

# Stage 2: Production
FROM node:20-alpine

WORKDIR /usr/src/app

# Only copy necessary files for production
COPY package*.json ./
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/prisma ./prisma
COPY ecosystem.config.js ./

# Install only production dependencies
RUN npm ci --only=production
RUN npx prisma generate

# Install PM2 globally
RUN npm install -g pm2

# Run migrations and start app via PM2 cluster mode
CMD ["sh", "-c", "npx prisma migrate deploy && pm2-runtime start ecosystem.config.js"]

EXPOSE 3000
