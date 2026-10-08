# ---- build the frontend ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- run the server ----
# Full codebase ships so Aurex can read/edit the live site files in /app.
FROM node:20-alpine AS run
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache git
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY server ./server
COPY src ./src
COPY public ./public
COPY scripts ./scripts
COPY index.html vite.config.js ./
COPY .git ./.git
EXPOSE 3001
CMD ["node", "server/index.js"]
