import { type HTMLMotionProps, motion } from 'framer-motion';
import { forwardRef } from 'react';

import { quickSpring } from '@/utils/motion';

// Surface: a 1px inner highlight on the top edge and a faint top-down sheen
// give the card depth on the dark page without extra borders.
const REST_SHADOW = 'inset 0 1px 0 0 rgba(255, 255, 255, 0.04), 0 0 0 0 rgba(0, 0, 0, 0)';
const HOVER_SHADOW =
  'inset 0 1px 0 0 rgba(255, 255, 255, 0.07), 0 14px 30px -18px rgba(0, 0, 0, 0.85)';

// Cards lift slightly and their border brightens under the pointer, signaling
// that they are distinct, inspectable blocks. With reduced motion only the
// border and shadow change (MotionConfig drops the transform).
export const HoverCard = forwardRef<HTMLElement, HTMLMotionProps<'section'>>(function HoverCard(
  { style, ...props },
  ref,
) {
  return (
    <motion.section
      ref={ref}
      style={{
        borderColor: '#27272a',
        boxShadow: REST_SHADOW,
        backgroundImage: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.02), transparent 40%)',
        ...style,
      }}
      whileHover={{ y: -2, borderColor: '#3f3f46', boxShadow: HOVER_SHADOW }}
      transition={quickSpring}
      {...props}
    />
  );
});
