import type { Transition } from 'framer-motion';

// One motion vocabulary for the whole app. Every animation is a physical
// spring with a bounded total duration (never above 400ms) and no bounce:
// motion explains a change or an origin, it never decorates or delays data.

// Default: state changes, enter/exit, layout shifts
export const spring: Transition = { type: 'spring', duration: 0.32, bounce: 0 };

// Small feedback (hover, press)
export const quickSpring: Transition = { type: 'spring', duration: 0.22, bounce: 0 };

// Delay between items entering in sequence, capped so the last item of a
// long list still starts within the time budget
export function staggerDelay(index: number, step = 0.03, max = 0.24) {
  return Math.min(index * step, max);
}

// Recharts animates with its own engine; it accepts an easing function.
// This is the closed-form position of a critically damped spring
// (x(t) = 1 - (1 + ωt)·e^(-ωt)): physical, no overshoot. ω is chosen so the
// spring is within 0.2% of its target at the end of the animation, and the
// result is normalized to land exactly on 1.
const OMEGA = 8.6;
const END = 1 - (1 + OMEGA) * Math.exp(-OMEGA);

export function springEasing(t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return (1 - (1 + OMEGA * t) * Math.exp(-OMEGA * t)) / END;
}

export const CHART_ANIMATION_MS = 340;
// Gap between series entering (income bars, then expense bars)
export const CHART_SERIES_STAGGER_MS = 60;
