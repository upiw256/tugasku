'use client';

import { useEffect, useRef } from 'react';

export default function ClientLoggerInit() {
  const isSetup = useRef(false);

  useEffect(() => {
    if (isSetup.current) return;
    isSetup.current = true;

    try {
      // Queue + debounce to batch logs and avoid flooding API
      let queue: { action: string; tipe: string; currentUrl: string }[] = [];
      let flushTimer: ReturnType<typeof setTimeout> | null = null;

      const flushQueue = () => {
        if (queue.length === 0) return;
        const batch = queue.splice(0, 10); // max 10 per flush
        batch.forEach((entry) => {
          fetch('/api/client-log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(entry),
          }).catch(() => {}); // Swallow all errors silently
        });
      };

      const scheduleFlush = () => {
        if (flushTimer) return;
        flushTimer = setTimeout(() => {
          flushTimer = null;
          flushQueue();
        }, 2000); // flush every 2 seconds max
      };

      // Dedup: track recent messages to avoid duplicates
      const recentMessages = new Set<string>();

      const sendToLogger = (msg: string, tipe: 'success' | 'warning' | 'error') => {
        if (!msg || msg.length < 3) return;

        // Filter non-actionable noise
        const noise = [
          'Hydration', 'Third-party cookie', 'ResizeObserver', 'Non-Error promise',
          'Download the React DevTools', 'webpack', 'Fast Refresh', 'hot reload',
          '/api/client-log', // prevent recursive logging of own fetch calls
        ];
        if (noise.some((n) => msg.includes(n))) return;

        // Dedup within 10 seconds window
        const dedupKey = `${tipe}:${msg.substring(0, 100)}`;
        if (recentMessages.has(dedupKey)) return;
        recentMessages.add(dedupKey);
        setTimeout(() => recentMessages.delete(dedupKey), 10000);

        queue.push({
          action: msg.substring(0, 400),
          tipe,
          currentUrl: window.location.pathname,
        });

        // Keep queue bounded
        if (queue.length > 50) queue = queue.slice(-50);

        scheduleFlush();
      };

      // --- Intercept console.log / console.warn / console.error ---
      const origLog = console.log;
      const origWarn = console.warn;
      const origError = console.error;

      const argsToString = (args: any[]): string => {
        return args
          .map((a) => {
            if (a instanceof Error) return `[${a.name}] ${a.message}`;
            if (typeof a === 'object') {
              try {
                return JSON.stringify(a);
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
          sendToLogger(event.message, 'error');
        } catch {}
      });

      window.addEventListener('unhandledrejection', (event) => {
        try {
          const msg = event.reason?.message || String(event.reason);
          sendToLogger(msg, 'error');
        } catch {}
      });
    } catch (e) {
      // Fail silently - logger must never crash the app
    }
  }, []);

  return null;
}
