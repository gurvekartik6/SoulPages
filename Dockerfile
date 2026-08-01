FROM node:20-alpine AS backend-builder
WORKDIR /app
COPY backend/package*.json backend/
RUN cd backend && npm ci
COPY backend/ backend/

FROM node:20-alpine AS frontend-builder  
WORKDIR /app
COPY frontend/package*.json frontend/
RUN cd frontend && npm ci
COPY frontend/ frontend/
RUN cd frontend && npm run build  # This is fine if frontend has build script

FROM node:20-alpine
WORKDIR /app
# Copy backend (no build needed)
COPY --from=backend-builder /app/backend ./backend
# Copy frontend built files
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Install backend production dependencies
COPY backend/package*.json ./
RUN npm ci --only=production

EXPOSE 5000
CMD ["node", "backend/src/index.js"]