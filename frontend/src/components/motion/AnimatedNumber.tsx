import { animate, useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

import { spring } from '@/utils/motion';

interface AnimatedNumberProps {
  value: number;
  format: (value: number) => string;
  className?: string;
}

// Counts from the previous value to the new one (e.g. when the month changes),
// so the reader sees the change instead of a sudden swap. The first render
// shows the value right away: nothing delays reading the data.
export function AnimatedNumber({ value, format, className }: AnimatedNumberProps) {
  const reduceMotion = useReducedMotion();
  const [displayed, setDisplayed] = useState(value);
  const previous = useRef(value);

  useEffect(() => {
    const from = previous.current;
    previous.current = value;
    if (from === value || reduceMotion) return;

    // Integer cents all the way: rounding keeps the formatter exact
    const controls = animate(from, value, {
      ...spring,
      onUpdate: (latest) => setDisplayed(Math.round(latest)),
    });
    return () => controls.stop();
  }, [value, reduceMotion]);

  // Reduced motion: the new value replaces the old one at once
  const shown = reduceMotion ? value : displayed;

  return (
    <span className={className}>
      {/* Screen readers get the final value once, not every frame */}
      <span aria-hidden>{format(shown)}</span>
      <span className="sr-only">{format(value)}</span>
    </span>
  );
}
