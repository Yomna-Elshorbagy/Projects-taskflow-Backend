# Stage 1: Build & install dependencies
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copy dependency manifests
COPY package*.json ./

# Install production dependencies only (clean install)
RUN npm ci --only=production

# Stage 2: Production runtime environment
FROM node:20-alpine AS runner

# Optimize Node.js for production
ENV NODE_ENV=production
ENV PORT=3000

WORKDIR /usr/src/app

# Copy manifests
COPY package.json ./

# Copy installed production dependencies from builder
COPY --from=builder /usr/src/app/node_modules ./node_modules

# Copy source code files
COPY . .

# Run under the built-in non-privileged node user for security
USER node

EXPOSE 3000

# Start command
CMD ["npm", "start"]
