'use client';

import { useEffect, useRef } from 'react';

export default function ClientLoggerInit() {
  const isSetup = useRef(false);

  useEffect(() => {
    if (isSetup.current) return;
    isSetup.current = true;

    try {
      // Simple rate limiter per tipe to avoid flooding API
      const lastSent: Record<string, number> = {};
      const MIN_INTERVAL = 1500; // 1.5 second between same-type logs

      // Dedup: track recent messages to avoid duplicates
      const recentMessages = new Set<string>();

      const sendToLogger = (msg: string, tipe: 'success' | 'warning' | 'error') => {
        if (!msg || msg.length < 3) return;

        // Filter non-actionable noise
        const noise = [
          'Hydration', 'Third-party cookie', 'ResizeObserver', 'Non-Error promise',
          'Download the React DevTools', 'webpack', 'Fast Refresh', 'hot reload',
          '/api/client-log', // prevent recursive logging of own fetch calls
          'preloaded using link preload', // browser resource preload warnings
          'was preloaded using link', // another form of preload warnings
          'ChunkLoadError', // next.js chunk loading is often transient
        ];
        if (noise.some((n) => msg.includes(n))) return;

        // Rate limit per tipe
        const now = Date.now();
        if (lastSent[tipe] && now - lastSent[tipe] < MIN_INTERVAL) return;

        // Dedup within 10 seconds window
        const dedupKey = `${tipe}:${msg.substring(0, 80)}`;
        if (recentMessages.has(dedupKey)) return;
        recentMessages.add(dedupKey);
        setTimeout(() => recentMessages.delete(dedupKey), 10000);

        lastSent[tipe] = now;

        // Fire and forget immediately - simpler and more reliable than batching
        fetch('/api/client-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: msg.substring(0, 400),
            tipe,
            currentUrl: window.location.pathname,
          }),
        }).catch(() => {}); // Swallow all errors silently
      };

      // --- Intercept console.log / console.warn / console.error ---
      const origLog = console.log;
      const origWarn = console.warn;
      const origError = console.error;

      const argsToString = (args: any[]): string => {
        return args
          .map((a) => {
            if (a instanceof Error) return `[${a.name}] ${a.message}`;
            if (typeof a === 'object' && a !== null) {
              try {
                const json = JSON.stringify(a);
                // Skip huge objects (Next.js internals)
                return json.length > 500 ? '[Object]' : json;
              } catch {
                return '[Circular]';
              }
            }
            return String(a);
          })
          .join(' ');
      };

      console.log = function (...args: any[]) {
        origLog.apply(console, args);
        try {
          sendToLogger(argsToString(args), 'success');
        } catch {}
      };

      console.warn = function (...args: any[]) {
        origWarn.apply(console, args);
        try {
          sendToLogger(argsToString(args), 'warning');
        } catch {}
      };

      console.error = function (...args: any[]) {
        origError.apply(console, args);
        try {
          sendToLogger(argsToString(args), 'error');
        } catch {}
      };

      // --- Also capture uncaught errors & unhandled rejections ---
      window.addEventListener('error', (event) => {
        try {
          sendToLogger(event.message || 'Unknown error', 'error');
        } catch {}
      });

      window.addEventListener('unhandledrejection', (event) => {
        try {
          const msg = event.reason?.message || String(event.reason);
          sendToLogger(msg, 'error');
        } catch {}
      });

      // --- Listen for Service Worker errors via MessageChannel ---
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', (event) => {
          try {
            if (event.data && event.data.type === 'SW_ERROR') {
              sendToLogger(`[ServiceWorker] ${event.data.message}`, 'error');
            }
          } catch {}
        });

        // Also capture SW controller errors
        navigator.serviceWorker.ready.then((registration) => {
          if (registration.active) {
            registration.active.onerror = (e: Event) => {
              try {
                const errEvent = e as ErrorEvent;
                sendToLogger(`[ServiceWorker] ${errEvent.message || 'SW Error'}`, 'error');
              } catch {}
            };
          }
        }).catch(() => {});
      }

    } catch (e) {
      // Fail silently - logger must never crash the app
    }
  }, []);

  return null;
}
