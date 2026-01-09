# Build frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps
COPY frontend/ .
RUN npm run build

# Build backend
FROM node:20-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps
COPY backend/ .
RUN npm run build

# Production image
FROM node:20-alpine
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Install production dependencies
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm ci --production --legacy-peer-deps || npm install --production --legacy-peer-deps

# Copy built files
COPY --from=backend-builder /app/backend/dist ./dist
COPY --from=backend-builder /app/backend/src/db/schema.sql ./src/db/schema.sql
COPY --from=frontend-builder /app/frontend/dist ./public

# Create data directory for SQLite with proper permissions
RUN mkdir -p /app/data && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 5000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000
ENV DB_TYPE=sqlite
ENV DB_PATH=/app/data/slugbase.db

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start server
CMD ["node", "dist/index.js"]
