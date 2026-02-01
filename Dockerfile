# --- TAHAP 1: Base ---
FROM node:20-alpine AS base

# --- TAHAP 2: Dependencies ---
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install Bun Global
RUN npm install -g bun

# Copy package.json dan semua jenis lock file
COPY package.json package-lock.json* bun.lockb* ./

# Install pakai Bun (Otomatis buat lockfile jika hilang)
RUN bun install --frozen-lockfile || bun install

# --- TAHAP 3: Builder ---
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Matikan telemetry
ENV NEXT_TELEMETRY_DISABLED 1

# Build Project (Cukup sekali saja)
RUN npm run build

# --- TAHAP 4: Runner (Production) ---
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Buat user keamanan
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy file public
COPY --from=builder /app/public ./public

# Copy folder static (PENTING untuk CSS/JS)
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy server standalone
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# Switch user
USER nextjs

# Expose Port 8020
EXPOSE 8020
ENV PORT 8020
ENV HOSTNAME "0.0.0.0"

# Jalankan
CMD ["node", "server.js"]