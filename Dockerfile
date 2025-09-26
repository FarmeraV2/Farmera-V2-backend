FROM node:24-alpine AS builder
WORKDIR /usr/app

COPY --chown=node:node package*.json ./

RUN npm ci

COPY --chown=node:node ./ ./

RUN npm run build

RUN npm prune --production

USER node

FROM node:24-alpine AS production
WORKDIR /usr/app

COPY --chown=node:node package*.json ./
COPY --chown=node:node --from=builder /usr/app/dist ./dist
COPY --chown=node:node --from=builder /usr/app/node_modules ./node_modules

ENV NODE_ENV=production

EXPOSE 3000

USER node

CMD ["node", "dist/main.js"]