# Imagen de Quadrant para el servidor de casa (TrueNAS): un proceso que sirve la API y la web.
# Datos (SQLite) en /data, único montaje escribible.
FROM node:24-bookworm-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ENV NX_DAEMON=false NX_ISOLATE_PLUGINS=false NX_NO_CLOUD=true
RUN npx nx build web --configuration=production && npx nx build api

FROM node:24-bookworm-slim AS deps
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/dist/apps/api/package.json /app/dist/apps/api/package-lock.json ./
RUN npm ci --omit=dev

FROM node:24-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production PORT=3360 TZ=Europe/Madrid QUADRANT_DB=/data/quadrant.sqlite QUADRANT_WEB_DIR=/app/web
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist/apps/api ./
COPY --from=build /app/dist/apps/web/browser ./web
USER node
EXPOSE 3360
CMD ["node", "main.js"]
