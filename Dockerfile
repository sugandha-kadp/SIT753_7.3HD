# syntax=docker/dockerfile:1

ARG NODE_VERSION=18
FROM node:-alpine AS base
WORKDIR /app
COPY package*.json ./

FROM base AS deps
RUN npm ci --omit=dev

FROM base AS builder
ENV CI=1
RUN npm ci
COPY . .
RUN npm run test:api

FROM node:-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 5000
CMD ["node", "src/app.js"]
