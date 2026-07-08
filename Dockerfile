FROM node:20-bullseye-slim AS deps
WORKDIR /app
COPY package.json ./
RUN npm install

FROM node:20-bullseye-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN apt-get update -y && apt-get install -y openssl
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate
RUN npm run build

FROM node:20-bullseye-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN apt-get update -y && apt-get install -y openssl && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/.bin/prisma ./node_modules/.bin/prisma
COPY --from=builder /app/node_modules/.bin/prisma.cmd ./node_modules/.bin/prisma.cmd

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

COPY --chmod=755 docker-entrypoint.sh /docker-entrypoint.sh

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENTRYPOINT ["/docker-entrypoint.sh"]
