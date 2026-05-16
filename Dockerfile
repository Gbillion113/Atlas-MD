FROM node:20-alpine AS deps
RUN apk upgrade --no-cache && \
    apk add --no-cache python3 make g++ gcc git
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm i --legacy-peer-deps

FROM node:20-alpine
RUN apk upgrade --no-cache && \
    apk add --no-cache ffmpeg imagemagick python3 curl unzip bash && \
    npm install -g pm2 && \
    curl -fsSL https://bun.sh/install | bash && \
    ln -s /root/.bun/bin/bun /usr/local/bin/bun && \
    apk del curl unzip bash && \
    rm -rf /root/.bun/install/cache /root/.npm/_cacache
ENV PATH="/root/.bun/bin:$PATH"
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 10000
CMD ["npm", "start"]