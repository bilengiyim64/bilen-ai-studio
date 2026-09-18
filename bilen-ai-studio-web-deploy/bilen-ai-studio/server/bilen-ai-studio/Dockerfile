# --- 1) İstemciyi (React) derle ---
FROM node:20-slim AS client-build
WORKDIR /app/client
COPY client/package.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# --- 2) Çalışma zamanı: Node + FFmpeg ---
FROM node:20-slim
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Sunucu bağımlılıkları
COPY server/package.json ./server/
RUN cd server && npm install --omit=dev

# Sunucu kodu + derlenmiş istemci
COPY server/ ./server/
COPY --from=client-build /app/client/dist ./client/dist

ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "server/index.js"]
