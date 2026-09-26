import { type HTMLMotionProps, motion } from 'framer-motion';
import { forwardRef } from 'react';

import { quickSpring } from '@/utils/motion';

// Cards lift slightly and their border brightens under the pointer, signaling
// that they are distinct, inspectable blocks. With reduced motion only the
// border changes (MotionConfig drops the transform).
export const HoverCard = forwardRef<HTMLElement, HTMLMotionProps<'section'>>(function HoverCard(
  { style, ...props },
  ref,
) {
  return (
    <motion.section
      ref={ref}
      style={{ borderColor: '#27272a', boxShadow: '0 0 0 0 rgba(0, 0, 0, 0)', ...style }}
      whileHover={{
        y: -2,
        borderColor: '#3f3f46',
        boxShadow: '0 12px 28px -18px rgba(0, 0, 0, 0.8)',
      }}
      transition={quickSpring}
      {...props}
    />
  );
});
