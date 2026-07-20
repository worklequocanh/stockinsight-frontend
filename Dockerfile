# syntax=docker/dockerfile:1
# Multi-stage Dockerfile cho StockInsight Frontend (Vite + React 19 -> Nginx)

# Stage 1: Build React/Vite bundle
FROM node:22-alpine AS build
WORKDIR /app

# Nhận biến môi trường build-time cho API URL
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Serve với Nginx siêu nhẹ
FROM nginx:alpine AS runner
# Copy cấu hình Nginx tùy chỉnh
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Copy file tĩnh đã build từ stage 1
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
