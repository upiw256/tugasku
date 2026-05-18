'use client';

import { useEffect, useRef } from 'react';
import { animate, stagger } from 'animejs';

export default function StaggerList({ 
  children, 
  selector = '.stagger-item',
  delay = 100,
  as: Component = 'div',
  className = ""
}: { 
  children: React.ReactNode, 
  selector?: string,
  delay?: number,
  as?: any,
  className?: string
}) {
  const containerRef = useRef<any>(null);

  useEffect(() => {
    if (containerRef.current) {
      animate(selector, {
        opacity: [0, 1],
        translateY: [20, 0],
        delay: stagger(delay),
        duration: 800,
        easing: 'easeOutExpo',
      });
    }
  }, []);

  return (
    <Component ref={containerRef} className={className}>
      {children}
    </Component>
  );
}
