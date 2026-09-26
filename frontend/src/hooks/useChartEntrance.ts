import { useInView, useReducedMotion } from 'framer-motion';
import { useRef } from 'react';

// Charts animate once, when they first enter the viewport. Until then the
// chart is not mounted (Recharts plays its animation on mount).
export function useChartEntrance<T extends Element>() {
  const ref = useRef<T>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const reduceMotion = useReducedMotion();

  return { ref, visible: inView, animate: !reduceMotion };
}
