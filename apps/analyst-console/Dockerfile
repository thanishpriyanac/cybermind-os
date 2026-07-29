FROM docker.io/node:20-alpine AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

FROM docker.io/node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Run Nx build for the analyst-console app
RUN npx nx build analyst-console --prod

FROM docker.io/node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# The Next.js standalone output automatically creates a minimal server
# Note: Nx outputs standalone builds differently than raw Next.js, usually under dist/apps/<app-name>
COPY --from=builder /app/dist/apps/analyst-console/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/dist/apps/analyst-console/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/dist/apps/analyst-console/.next/static ./.next/static

USER nextjs

EXPOSE 4200
ENV PORT 4200
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
