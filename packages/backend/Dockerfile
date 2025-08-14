FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && corepack prepare pnpm@9 --activate && pnpm i

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules node_modules
COPY . .
RUN corepack enable && corepack prepare pnpm@9 --activate && pnpm build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/dist dist
COPY package.json .
RUN corepack enable && corepack prepare pnpm@9 --activate && pnpm i --prod
EXPOSE 8787
CMD ["node","dist/index.js"]
