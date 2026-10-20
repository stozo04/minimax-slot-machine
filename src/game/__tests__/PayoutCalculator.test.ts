import { describe, expect, it } from 'vitest';
import { PayoutCalculator } from '../PayoutCalculator';

describe('PayoutCalculator', () => {
  const calculator = new PayoutCalculator();

  it('calculates integer-cent payouts from line-bet multipliers', () => {
    const wins = calculator.calculate(
      [
        {
          lineIndex: 0,
          symbol: 'GROK',
          count: 3,
          multiplier: 12,
        },
      ],
      500,
    );

    expect(wins[0].amountCents).toBe(6000);
    expect(calculator.total(wins)).toBe(6000);
  });

  it('sums multiple line payouts', () => {
    const wins = calculator.calculate(
      [
        {
          lineIndex: 0,
          symbol: 'GROK',
          count: 3,
          multiplier: 12,
        },
        {
          lineIndex: 1,
          symbol: 'MUSE',
          count: 4,
          multiplier: 25,
        },
      ],
      100,
    );

    expect(calculator.total(wins)).toBe(3700);
  });
});
