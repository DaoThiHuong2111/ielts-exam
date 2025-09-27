# Multi-stage build for NestJS application
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps && npm cache clean --force

# Generate Prisma client
COPY prisma ./prisma/
RUN npx prisma generate

# Rebuild the source code only when needed
FROM base AS builder
RUN apk add --no-cache openssl
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate RSA keys for JWT (dummy keys for Docker)
RUN mkdir -p keys && \
    openssl genpkey -algorithm RSA -out keys/key.pem -pkcs8 -aes256 -pass pass:dummy || \
    openssl genpkey -algorithm RSA -out keys/key.pem -pkcs8 && \
    openssl rsa -pubout -in keys/key.pem -out keys/public_key.pem -passin pass:dummy || \
    openssl rsa -pubout -in keys/key.pem -out keys/public_key.pem

# Build the application
RUN npm run build

# Production image, copy all the files and run nest
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# Copy necessary files from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/keys ./keys

RUN chown -R nestjs:nodejs /app

USER nestjs

EXPOSE 8228

ENV PORT 8228

# Start the application with db push
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && node dist/src/main"]