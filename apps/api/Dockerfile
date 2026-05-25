FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN cd apps/api && npx prisma generate && npx tsc

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/prisma ./prisma
COPY apps/api/package.json ./

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 fastify
USER fastify

EXPOSE 3001
CMD ["node", "dist/server.js"]
