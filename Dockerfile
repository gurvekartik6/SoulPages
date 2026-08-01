# ============================================
# STAGE 1: Build Backend (no build needed)
# ============================================
FROM node:20-alpine AS backend

WORKDIR /app/backend

# Copy backend package files
COPY backend/package*.json ./
RUN npm ci --only=production

# Copy backend source code
COPY backend/ .

# ============================================
# STAGE 2: Build Frontend
# ============================================
FROM node:20-alpine AS frontend

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./
RUN npm ci

# Copy frontend source and build
COPY frontend/ .
RUN npm run build

# ============================================
# STAGE 3: Final Image
# ============================================
FROM node:20-alpine

WORKDIR /app

# Copy backend from backend stage
COPY --from=backend /app/backend ./backend

# Copy frontend build from frontend stage
COPY --from=frontend /app/frontend/dist ./frontend/dist

# Install any additional dependencies
RUN npm install -g serve

# Expose port (Railway will use PORT env)
EXPOSE 5000

# Start the backend (which serves frontend too)
CMD ["node", "backend/src/index.js"]