import { describe, expect, it } from 'vitest';
import { THEORETICAL_RTP } from '../ProbabilityEngine';
import { runSimulation } from '../simulation';

describe('simulation harness', () => {
  it('produces a reproducible seeded result', () => {
    const first = runSimulation(20_000, 2049);
    const second = runSimulation(20_000, 2049);

    expect(first.totalReturnedCents).toBe(second.totalReturnedCents);
    expect(first.symbolCounts).toEqual(second.symbolCounts);
  });

  it('stays within a broad sampling tolerance of theoretical RTP', () => {
    const result = runSimulation(50_000, 2049);
    expect(Math.abs(result.empiricalRtp - THEORETICAL_RTP)).toBeLessThan(0.18);
    expect(result.hitFrequency).toBeGreaterThan(0);
    expect(result.hitFrequency).toBeLessThan(1);
  });

  it('accounts for every simulated wager', () => {
    const result = runSimulation(10_000, 55);
    expect(result.totalWageredCents).toBe(10_000 * result.wagerCents);
    expect(result.empiricalRtp).toBeCloseTo(
      result.totalReturnedCents / result.totalWageredCents,
      12,
    );
  });
});
