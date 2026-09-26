import { useAnimationControls, useReducedMotion } from 'framer-motion';
import { useEffect, useRef } from 'react';

import { spring } from '@/utils/motion';

// When the month changes, the content arrives from the side of the navigation
// (next month = from the right, previous = from the left). The content is not
// remounted, so numbers can count up and charts keep their state.
export function useDirectionalNudge(month: string) {
  const controls = useAnimationControls();
  const reduceMotion = useReducedMotion();
  const previous = useRef(month);

  useEffect(() => {
    const from = previous.current;
    previous.current = month;
    if (from === month || reduceMotion) return;

    const direction = month > from ? 1 : -1;
    void controls.start({ x: [direction * 24, 0], opacity: [0.5, 1], transition: spring });
  }, [month, controls, reduceMotion]);

  return controls;
}
