# Jaipurio storefront + admin (React/Vite), served by nginx.
# Built and run by docker-compose.yml at the repo root.

# ---- Build ----
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .

# Same-origin API: nginx (below) forwards /api and /uploads to the backend
# container, so the build never needs to know the domain.
ARG VITE_API_URL=/api
ARG VITE_API_BASE_URL=/api

# Optional public settings, passed in as build args by docker-compose.yml.
# Empty VITE_SITE_URL = use whatever domain the site is opened on.
ARG VITE_SITE_URL
ARG VITE_META_PIXEL_ID
ARG VITE_RAZORPAY_KEY_ID
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID
ARG VITE_FIREBASE_MEASUREMENT_ID
ARG VITE_FIREBASE_DATABASE_URL

RUN npm run build

# ---- Serve ----
FROM nginx:stable-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
