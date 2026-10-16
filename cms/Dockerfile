FROM node:24-bookworm-slim
ENV NODE_ENV=production CMS_DATA_DIR=/data
WORKDIR /opt/ls-cms
COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund
COPY src ./src
COPY migrations ./migrations
COPY public ./public
RUN mkdir -p /data/media /data/backup-staging && chown -R node:node /opt/ls-cms /data
USER node
EXPOSE 8412
CMD ["node", "src/server.mjs"]
