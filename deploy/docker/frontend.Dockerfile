# syntax=docker/dockerfile:1.6

FROM node:20-bookworm-slim AS build
WORKDIR /app

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./

ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=${REACT_APP_API_URL}
ENV CI=true

RUN npm run build

FROM caddy:2.8.4-alpine
WORKDIR /srv

COPY deploy/docker/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/build /srv

EXPOSE 80 443
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile"]
