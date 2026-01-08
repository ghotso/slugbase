# Build frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

# Build backend
FROM node:20-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/ .
RUN npm run build

# Production image
FROM node:20-alpine
WORKDIR /app

# Install production dependencies
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm ci --production

# Copy built files
COPY --from=backend-builder /app/backend/dist ./dist
COPY --from=backend-builder /app/backend/src/db/schema.sql ./src/db/schema.sql
COPY --from=frontend-builder /app/frontend/dist ./public

# Create data directory for SQLite
RUN mkdir -p /app/data

# Expose port
EXPOSE 5000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000
ENV DB_TYPE=sqlite
ENV DB_PATH=/app/data/slugbase.db

# Start server
CMD ["node", "dist/index.js"]
