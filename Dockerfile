FROM oven/bun:latest AS base
WORKDIR /app

# --- deps ---
FROM base AS deps
COPY package.json bun.lock ./
RUN bun install

# --- build ---
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variabel yang dibutuhkan saat Build Time (Bake into static files)
ARG NEXT_PUBLIC_VERSION
ARG NEXT_PUBLIC_PUSHER_KEY
ARG NEXT_PUBLIC_PUSHER_CLUSTER
ARG NEXT_PUBLIC_CLOUDINARY_PRESET
ARG NEXT_PUBLIC_CLOUDINARY_API_KEY

ENV NEXT_PUBLIC_VERSION=$NEXT_PUBLIC_VERSION
ENV NEXT_PUBLIC_PUSHER_KEY=$NEXT_PUBLIC_PUSHER_KEY
ENV NEXT_PUBLIC_PUSHER_CLUSTER=$NEXT_PUBLIC_PUSHER_CLUSTER
ENV NEXT_PUBLIC_CLOUDINARY_PRESET=$NEXT_PUBLIC_CLOUDINARY_PRESET
ENV NEXT_PUBLIC_CLOUDINARY_API_KEY=$NEXT_PUBLIC_CLOUDINARY_API_KEY

ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_DISABLE_TURBOPACK=1

RUN bun run build

# --- runner ---
FROM oven/bun:latest AS runner
WORKDIR /app

# ENV NODE_ENV=production
ENV PORT=8020
ENV HOSTNAME=0.0.0.0

RUN groupadd --gid 1001 nodejs \
 && useradd --uid 1001 --gid nodejs --shell /bin/sh --create-home nextjs
# PERBAIKAN: Buat folder uploads dan atur izin akses (sebelum pindah ke USER nextjs)
RUN mkdir -p public/uploads \
    && chown -R nextjs:nodejs public/uploads \
    && chmod -R 755 public/uploads 
    
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 8020

CMD ["bun", "server.js"]
