import { describe, expect, it } from 'vitest';
import { REEL_STRIPS, SYMBOL_WEIGHTS } from '../config';
import { SeededRandomSource } from '../random';
import { ReelEngine } from '../ReelEngine';

describe('ReelEngine', () => {
  it('builds 100-position strips with exact symbol counts', () => {
    expect(REEL_STRIPS).toHaveLength(5);

    REEL_STRIPS.forEach((strip) => {
      expect(strip).toHaveLength(100);
      Object.entries(SYMBOL_WEIGHTS).forEach(([symbol, expected]) => {
        const count = strip.filter((candidate) => candidate === symbol).length;
        expect(count).toBe(expected);
      });
    });
  });

  it('reproduces seeded reel stops', () => {
    const first = new ReelEngine(REEL_STRIPS, new SeededRandomSource(99));
    const second = new ReelEngine(REEL_STRIPS, new SeededRandomSource(99));

    expect(first.sampleStops()).toEqual(second.sampleStops());
  });

  it('builds three visible rows for every reel', () => {
    const reels = new ReelEngine(REEL_STRIPS, new SeededRandomSource(7));
    const stops = reels.sampleStops();
    const grid = reels.gridFromStops(stops);

    expect(grid).toHaveLength(5);
    grid.forEach((reel) => expect(reel).toHaveLength(3));
  });

  it('rejects an invalid stop position', () => {
    const reels = new ReelEngine(REEL_STRIPS, new SeededRandomSource(7));
    expect(() => reels.gridFromStops([-1, 0, 0, 0, 0])).toThrow(RangeError);
  });
});
