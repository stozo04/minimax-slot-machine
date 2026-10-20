import { describe, expect, it } from 'vitest';
import { gameConfig } from '../config';
import {
  ProbabilityEngine,
  THEORETICAL_RTP,
  calculateTheoreticalRtp,
} from '../ProbabilityEngine';
import { SeededRandomSource } from '../random';

describe('ProbabilityEngine', () => {
  it('calculates a theoretical RTP within the target band', () => {
    const rtp = calculateTheoreticalRtp(gameConfig);
    expect(rtp).toBeCloseTo(0.9387072984, 10);
    expect(rtp).toBeGreaterThanOrEqual(0.935);
    expect(rtp).toBeLessThanOrEqual(0.945);
    expect(THEORETICAL_RTP).toBeCloseTo(rtp, 12);
  });

  it('rejects a wager that is not divisible by twenty lines', () => {
    const engine = new ProbabilityEngine(
      gameConfig,
      new SeededRandomSource(12),
    );
    expect(() => engine.spin(1999)).toThrow(RangeError);
  });

  it('rejects a tampered outcome', () => {
    const engine = new ProbabilityEngine(
      gameConfig,
      new SeededRandomSource(12),
    );
    const outcome = engine.spin(2000);
    const tampered = {
      ...outcome,
      totalWinCents: outcome.totalWinCents + 1,
    };

    expect(() => engine.validateOutcome(tampered)).toThrow();
  });

  it('uses a fixed configured symbol frequency in every visible row', () => {
    gameConfig.reelStrips.forEach((strip) => {
      for (let offset = -1; offset <= 1; offset += 1) {
        const visible = Array.from({ length: strip.length }, (_, stop) =>
          strip[(stop + offset + strip.length) % strip.length],
        );

        const blankCount = visible.filter(
          (symbol) => symbol === 'BLANK',
        ).length;
        expect(blankCount).toBe(40);
      }
    });
  });
});
