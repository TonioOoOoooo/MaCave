FROM node:22-bookworm-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json* ./
COPY backend/package.json backend/package.json
RUN npm install
COPY . .
RUN npm run build

FROM node:22-bookworm-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
COPY package.json package-lock.json* ./
COPY backend/package.json backend/package.json
RUN npm install --omit=dev
COPY --from=build /app/backend/dist ./backend/dist
COPY imports/.gitkeep ./imports/.gitkeep
COPY data/.gitkeep ./data/.gitkeep
COPY data/uploads/.gitkeep ./data/uploads/.gitkeep
COPY data/backups/.gitkeep ./data/backups/.gitkeep
EXPOSE 3015
CMD ["npm", "run", "start", "-w", "backend"]
