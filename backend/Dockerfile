# Jaipurio API (Express). Built and run by docker-compose.yml at the repo root.
FROM node:22-alpine

# tini forwards SIGTERM to node so redeploys stop the container cleanly
RUN apk add --no-cache tini

WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force

COPY --chown=node:node . .

USER node
EXPOSE 5000

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "index.js"]
