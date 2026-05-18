'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { animate } from 'animejs';

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (containerRef.current) {
      // Hilangkan opacity dulu sebelum animasi (agar tidak flicker)
      containerRef.current.style.opacity = '0';
      
      animate(containerRef.current, {
        opacity: [0, 1],
        translateY: [10, 0],
        duration: 500,
        easing: 'easeOutQuad',
      });
    }
  }, [pathname]);

  return (
    <div ref={containerRef} className="w-full">
      {children}
    </div>
  );
}
