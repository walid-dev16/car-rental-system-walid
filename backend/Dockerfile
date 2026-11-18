FROM node:20-alpine AS web
WORKDIR /web
COPY frontend/package*.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/src ./src
COPY frontend/public/AutoLuxe.html frontend/public/vite.svg frontend/public/luxury-showcase.png ./public/
COPY frontend/index.html frontend/vite.config.js frontend/tailwind.config.js frontend/postcss.config.js ./
RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY backend/package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund

COPY backend/*.js backend/schema.sql backend/seed.sql ./
COPY backend/middleware/ ./middleware/
COPY backend/routes/ ./routes/
COPY backend/migrations/ ./migrations/
COPY --from=web /web/dist ./web
ENV FRONTEND_DIST=/app/web

EXPOSE 5000

CMD ["sh", "-c", "node migrate.js && exec node index.js"]
