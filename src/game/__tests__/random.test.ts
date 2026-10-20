import { describe, expect, it } from 'vitest';
import { SeededRandomSource } from '../random';

describe('SeededRandomSource', () => {
  it('is reproducible for the same seed', () => {
    const left = new SeededRandomSource(123456);
    const right = new SeededRandomSource(123456);

    const leftValues = Array.from({ length: 100 }, () => left.nextInt(100));
    const rightValues = Array.from({ length: 100 }, () => right.nextInt(100));

    expect(leftValues).toEqual(rightValues);
  });

  it('returns values within the requested range', () => {
    const random = new SeededRandomSource(42);
    for (let index = 0; index < 1000; index += 1) {
      const value = random.nextInt(37);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(37);
    }
  });
});
