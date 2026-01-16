# --- TAHAP 1: Base ---
FROM node:18-alpine AS base

# --- TAHAP 2: Dependencies ---
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package json
COPY package.json package-lock.json* ./
# Install dependencies
RUN npm ci

# --- TAHAP 3: Builder ---
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Matikan telemetry nextjs saat build
ENV NEXT_TELEMETRY_DISABLED 1

# Build project
RUN npm run build

# --- TAHAP 4: Runner (Production) ---
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Buat user baru agar aman (bukan root)
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy file public (gambar, icon, dll)
COPY --from=builder /app/public ./public

# Copy folder .next/static agar CSS/JS client terload
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# Switch ke user nextjs
USER nextjs

# 👇 UBAH DI SINI
EXPOSE 7020

ENV PORT 7020
ENV HOSTNAME "0.0.0.0"

# Jalankan server
CMD ["node", "server.js"]