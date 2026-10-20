import type {
  Grid,
  LineMatch,
  PayingSymbolId,
  Paytable,
} from './types';

export class PaylineEvaluator {
  constructor(
    private readonly paylines: readonly (readonly number[])[],
    private readonly paytable: Paytable,
  ) {}

  findMatches(grid: Grid): LineMatch[] {
    const matches: LineMatch[] = [];

    this.paylines.forEach((line, lineIndex) => {
      if (line.length !== grid.length) {
        throw new Error('Every payline must contain one row per reel.');
      }

      const firstSymbol = grid[0][line[0]];
      if (firstSymbol === 'BLANK') return;

      let count = 1;
      for (let reel = 1; reel < grid.length; reel += 1) {
        if (grid[reel][line[reel]] !== firstSymbol) break;
        count += 1;
      }

      if (count < 3) return;

      const symbol = firstSymbol as PayingSymbolId;
      const matchCount = count as 3 | 4 | 5;

      matches.push({
        lineIndex,
        symbol,
        count: matchCount,
        multiplier: this.paytable[symbol][matchCount],
      });
    });

    return matches;
  }
}
