FROM node:25-alpine AS builder
WORKDIR /usr/app

COPY --chown=node:node package*.json ./

RUN npm ci

COPY --chown=node:node ./ ./

RUN npm run build

USER node

FROM node:25-alpine AS production
WORKDIR /usr/app

RUN mkdir -p /usr/app/uploads/temp \
    && chown -R node:node /usr/app/uploads
COPY --chown=node:node package*.json ./
RUN npm ci

COPY --chown=node:node --from=builder /usr/app/dist ./dist

EXPOSE 3000

USER node

CMD ["node", "dist/src/main.js"]