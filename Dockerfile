# Build Stage
FROM node:22-alpine AS builder
WORKDIR /app

# Copy package files
COPY package.json ./
# Note: specific lock file usage is skipped to allow picking up manual package.json edits
RUN npm install --legacy-peer-deps

# Convert incoming files
COPY . .

# Generate Prisma Client
# We provide dummy URLs because prisma.config.ts validates their presence,
# even though 'prisma generate' doesn't need a live connection.
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
ENV DIRECT_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN npx prisma generate

# Build Frontend
RUN npm run build

# Production Stage
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy build artifacts and dependencies
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/server.js ./server.js
# We copy entire src to ensure worker and other libs are available
COPY --from=builder /app/src ./src

# Copy Backend Source (API + Libs)
COPY --from=builder /app/api ./api
COPY --from=builder /app/prisma ./prisma

# Expose port
EXPOSE 4173

# Start the Custom Production Server AND Worker
# We use 'tsx' to handle the mix of JS/TS and ESM imports seamlessly
CMD ["sh", "-c", "npm run worker & npx tsx server.js"]
