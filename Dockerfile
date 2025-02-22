# Build stage
FROM node:18-alpine as build

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app
COPY pnpm-lock.yaml ./
COPY package.json ./
COPY frontend/package.json frontend/
COPY backend/package.json backend/

# Install dependencies
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

# Production stage
FROM node:18-alpine

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app
COPY --from=build /app/backend ./backend
COPY --from=build /app/frontend/dist ./frontend/dist
COPY package.json ./
COPY pnpm-lock.yaml ./

RUN pnpm install --prod --frozen-lockfile

EXPOSE 5000

CMD ["pnpm", "start"]