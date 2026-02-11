FROM oven/bun:1.3.5 AS base
WORKDIR /app

# --- deps ---
FROM base AS deps
COPY package.json bun.lock ./
RUN bun install

# --- build ---
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_DISABLE_TURBOPACK=1

RUN bun run build

# --- runner ---
FROM oven/bun:1.3.5 AS runner
WORKDIR /app

# ENV NODE_ENV=production
ENV PORT=8020
ENV HOSTNAME=0.0.0.0

RUN groupadd --gid 1001 nodejs \
 && useradd --uid 1001 --gid nodejs --shell /bin/sh --create-home nextjs
# PERBAIKAN: Buat folder uploads dan atur izin akses (sebelum pindah ke USER nextjs)
RUN mkdir -p public/uploads \
    && chown -R nextjs:nodejs public/uploads \
    && chmod -R 755 public/uploads \
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 8020

CMD ["bun", "server.js"]
