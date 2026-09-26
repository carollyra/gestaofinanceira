import { springEasing, staggerDelay } from './motion';

describe('springEasing (critically damped spring for Recharts)', () => {
  it('starts at 0 and lands exactly on 1', () => {
    expect(springEasing(0)).toBe(0);
    expect(springEasing(1)).toBe(1);
  });

  it('never overshoots and never goes backwards (no bounce)', () => {
    let previous = 0;
    for (let t = 0.01; t <= 1; t += 0.01) {
      const value = springEasing(t);
      expect(value).toBeGreaterThanOrEqual(previous);
      expect(value).toBeLessThanOrEqual(1);
      previous = value;
    }
  });

  it('front-loads the movement like a physical spring (fast start, soft landing)', () => {
    expect(springEasing(0.3)).toBeGreaterThan(0.7);
  });
});

describe('staggerDelay', () => {
  it('spaces items and caps the delay of long lists', () => {
    expect(staggerDelay(0)).toBe(0);
    expect(staggerDelay(2)).toBeCloseTo(0.06);
    expect(staggerDelay(100)).toBe(0.24);
    expect(staggerDelay(3, 0.04)).toBeCloseTo(0.12);
  });
});
