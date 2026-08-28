'use client';

import { useEffect, useRef } from 'react';

export default function ClientLoggerInit() {
  const isSetup = useRef(false);

  useEffect(() => {
    if (isSetup.current) return;
    isSetup.current = true;

    if (typeof window !== 'undefined') {
      const originalError = console.error;

      // Anti-spam mechanism
      let isLogging = false;

      const sendToLogger = async (msg: string) => {
        if (isLogging) return;
        isLogging = true;
        try {
          if (msg.includes('Hydration') || msg.includes('Third-party cookie')) {
             return;
          }
          await fetch('/api/client-log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              action: msg,
              currentUrl: window.location.pathname
            })
          });
        } catch (err) {
          // Ignore fetch errors to prevent loops
        } finally {
          setTimeout(() => { isLogging = false; }, 2000); // Rate limit to 1 cliet log per 2 seconds
        }
      };

      console.error = function (...args) {
        originalError.apply(console, args);
        
        try {
          const message = args.map(a => {
            if (a instanceof Error) return a.message;
            return typeof a === 'object' ? JSON.stringify(a) : String(a);
          }).join(' ');
          
          sendToLogger(message);
        } catch (e) {}
      };

      window.addEventListener('error', (event) => {
        sendToLogger(event.message);
      });
      
      window.addEventListener('unhandledrejection', (event) => {
        sendToLogger(event.reason?.message || String(event.reason));
      });
    }
  }, []);

  return null;
}
