# Example root Dockerfile
FROM node:20-alpine AS backend-builder
WORKDIR /app
COPY backend/package*.json backend/
RUN cd backend && npm ci
COPY backend/ backend/
RUN cd backend && npm run build

FROM node:20-alpine AS frontend-builder  
WORKDIR /app
COPY frontend/package*.json frontend/
RUN cd frontend && npm ci
COPY frontend/ frontend/
RUN cd frontend && npm run build

FROM node:20-alpine
WORKDIR /app
# Copy built files
COPY --from=backend-builder /app/backend/dist ./backend/dist
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Copy package.json and install production dependencies
COPY backend/package*.json ./
RUN npm ci --only=production

EXPOSE 5000
CMD ["node", "backend/dist/server.js"]