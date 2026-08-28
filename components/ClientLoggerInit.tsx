'use client';

import { useEffect, useRef } from 'react';

export default function ClientLoggerInit() {
  const isSetup = useRef(false);

  useEffect(() => {
    if (isSetup.current) return;
    isSetup.current = true;

    try {
      // Rate limiter
      let lastSentAt = 0;
      
      const sendToLogger = (msg: string) => {
        if (!msg || msg.length < 3) return;
        // Rate limit: max 1 log per 3 seconds
        const now = Date.now();
        if (now - lastSentAt < 3000) return;
        lastSentAt = now;

        // Filter non-actionable noise
        const noise = ['Hydration', 'Third-party cookie', 'ResizeObserver', 'Non-Error promise'];
        if (noise.some(n => msg.includes(n))) return;

        // Fire and forget - do NOT await, do NOT throw
        fetch('/api/client-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            action: msg.substring(0, 400),
            currentUrl: window.location.pathname
          })
        }).catch(() => {}); // Swallow all errors silently
      };

      // Only intercept uncaught runtime errors (safe - doesn't override console)
      window.addEventListener('error', (event) => {
        try { sendToLogger(event.message); } catch (e) {}
      });
      
      window.addEventListener('unhandledrejection', (event) => {
        try {
          const msg = event.reason?.message || String(event.reason);
          sendToLogger(msg);
        } catch (e) {}
      });
    } catch (e) {
      // Fail silently - logger must never crash the app
    }
  }, []);

  return null;
}
