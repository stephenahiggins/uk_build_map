# Dockerfile for UK Gov Project Agents
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm install -g pnpm && pnpm install && pnpm build
CMD ["node", "dist/cli.js"]
