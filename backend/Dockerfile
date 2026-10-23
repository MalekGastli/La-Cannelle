FROM node:22-slim

RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN npm run build

ENV NODE_ENV=production
# Mount a persistent volume here (Railway: Volumes -> mount path /data) so uploaded images survive redeploys.
ENV UPLOAD_DIR=/data/uploads

EXPOSE 3001
CMD ["npm", "run", "start:prod"]
