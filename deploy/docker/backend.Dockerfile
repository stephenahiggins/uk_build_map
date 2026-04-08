# syntax=docker/dockerfile:1.6

FROM node:20-bookworm-slim AS builder
WORKDIR /app

COPY backend/package*.json ./
COPY backend/tsconfig*.json ./
RUN npm ci

COPY backend/prisma ./prisma
COPY backend/src ./src
COPY backend/scripts ./scripts
COPY backend/wait-for-it.sh ./wait-for-it.sh

RUN npx prisma generate
RUN npm run build

FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY backend/package*.json ./
COPY backend/prisma ./prisma
COPY --from=builder /app/dist ./dist
COPY backend/wait-for-it.sh /usr/local/bin/wait-for-it
COPY deploy/docker/backend-entrypoint.sh /entrypoint.sh

RUN chmod +x /usr/local/bin/wait-for-it /entrypoint.sh \
  && mkdir -p uploads \
  && apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*

EXPOSE 5002
ENTRYPOINT ["/entrypoint.sh"]
