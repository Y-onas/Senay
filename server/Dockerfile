# syntax=docker/dockerfile:1
# Build from repo root: docker build -f server/Dockerfile .
# Railway: dockerfilePath = server/Dockerfile (service root = repository root)

FROM node:22-bookworm-slim AS deps
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY app/package.json app/package-lock.json ./app/
COPY server/package.json server/package-lock.json ./server/
RUN npm ci --prefix app && npm ci --prefix server

FROM node:22-bookworm-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/app/node_modules ./app/node_modules
COPY --from=deps /app/server/node_modules ./server/node_modules
COPY app ./app
COPY server ./server
COPY package.json ./
ARG VITE_API_BASE_URL=/api
ARG VITE_CMS_PATH=st-hq
ARG VITE_USE_MOCK=false
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_CMS_PATH=$VITE_CMS_PATH \
    VITE_USE_MOCK=$VITE_USE_MOCK
RUN npm run build --prefix app \
 && npm run db:generate --prefix server \
 && npm run build --prefix server \
 && node server/scripts/prepare-railway-site.mjs

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    SERVE_WEB=1 \
    PORT=4000
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/server/package.json /app/server/package-lock.json ./server/
COPY --from=build /app/server/node_modules ./server/node_modules
COPY --from=build /app/server/dist ./server/dist
COPY --from=build /app/server/prisma ./server/prisma
COPY --from=build /app/server/public ./server/public
WORKDIR /app/server
EXPOSE 4000
CMD ["node", "dist/index.js"]
