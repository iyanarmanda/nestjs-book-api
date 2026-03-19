# Dockerfile for NestJS application with Prisma and PostgreSQL is errors.
# Soon will be updated to fix the errors and optimize the build process.

# BUILD STAGE
FROM node:20 AS builder

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install

COPY . .

ENV NODE_ENV=production

ARG DATABASE_URL=postgresql://placeholder:placeholder@db:5432/placeholder
ENV DATABASE_URL=$DATABASE_URL

RUN pnpm prisma:init:prod
# RUN npx dotenv -e .env.production -- npx prisma generate
# RUN pnpm prisma:init:prod
# RUN pnpm prisma generate

RUN pnpm run build

RUN find dist -type f \( -name "*.spec.js" -o -name "*.spec.js.map" \) -delete \
  && rm -rf dist/testing

# PRODUCTION STAGE
FROM node:20-slim

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl

RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --ignore-scripts
RUN pnpm add --save-dev prisma@^7.4.0 --ignore-scripts

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma/schema.prisma ./prisma/schema.prisma
COPY --from=builder /app/prisma/migrations ./prisma/migrations

ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "dist/main.js"]
