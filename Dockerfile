# ---- Builder Stage ----
FROM node:20-alpine AS builder

WORKDIR /app

ENV HUSKY=0

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

RUN npm run build

# ---- Production Stage ----
FROM node:20-alpine AS production

WORKDIR /app

ENV HUSKY=0

# Create non-root user
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

COPY package.json package-lock.json* ./
RUN npm install --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist

# Switch to non-root user
USER appuser

EXPOSE 8888

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:8888/api/v1/health || exit 1

CMD ["node", "dist/server.js"]
