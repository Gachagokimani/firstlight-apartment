# Use a lightweight Node.js image
FROM node:18-alpine AS builder

# Install pnpm globally
RUN npm install -g pnpm

# Set the working directory
WORKDIR /app

# Copy package.json and pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Build the app
RUN pnpm run build

# Use a lightweight image to serve the app
FROM node:18-alpine

# Install serve globally
RUN npm install -g serve

# Set the working directory
WORKDIR /app

# Copy the built app from the builder stage
COPY --from=builder /app/dist ./dist

# Expose the port the app runs on
EXPOSE 5173

# Start the production server
CMD ["serve", "-s", "dist", "-l", "5173"]
