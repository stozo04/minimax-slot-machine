import type { LineMatch, LineWin } from './types';

export class PayoutCalculator {
  calculate(matches: readonly LineMatch[], betPerLineCents: number): LineWin[] {
    if (!Number.isInteger(betPerLineCents) || betPerLineCents <= 0) {
      throw new RangeError('The per-line bet must be a positive integer.');
    }

    return matches.map((match) => ({
      ...match,
      amountCents: Math.round(match.multiplier * betPerLineCents),
    }));
  }

  total(wins: readonly LineWin[]): number {
    return wins.reduce((sum, win) => sum + win.amountCents, 0);
  }
}
