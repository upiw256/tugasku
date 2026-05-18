'use client';

import { useEffect, useRef } from 'react';
import { animate } from 'animejs';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  className?: string;
  decimals?: number;
}

export default function AnimatedNumber({ 
  value, 
  duration = 1000, 
  className = "",
  decimals = 0
}: AnimatedNumberProps) {
  const spanRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (spanRef.current) {
      // Pastikan value adalah angka
      const targetValue = Number(value) || 0;
      const obj = { val: 0 };
      
      animate(obj, {
        val: targetValue,
        duration: duration,
        easing: 'easeOutExpo',
        onUpdate: () => {
          if (spanRef.current) {
            spanRef.current.innerText = obj.val.toFixed(decimals);
          }
        },
        onComplete: () => {
          if (spanRef.current) {
            spanRef.current.innerText = targetValue.toFixed(decimals);
          }
        }
      });
    }
  }, [value, duration, decimals]);

  return (
    <span ref={spanRef} className={className}>{Number(value).toFixed(decimals)}</span>
  );
}
