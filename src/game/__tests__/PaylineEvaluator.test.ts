import { describe, expect, it } from 'vitest';
import { PAY_LINES, PAYTABLE } from '../config';
import { PaylineEvaluator } from '../PaylineEvaluator';
import type { Grid, SymbolId } from '../types';

function grid(symbols: SymbolId[]): Grid {
  return [0, 1, 2, 3, 4].map((reel) => [
    symbols[reel],
    symbols[reel],
    symbols[reel],
  ]);
}

describe('PaylineEvaluator', () => {
  const evaluator = new PaylineEvaluator(PAY_LINES, PAYTABLE);

  it('requires a match beginning on the leftmost reel', () => {
    const matches = evaluator.findMatches(
      grid(['GROK', 'GROK', 'GROK', 'BLANK', 'GROK']),
    );
    const lineOne = matches.find((match) => match.lineIndex === 0);

    expect(lineOne).toMatchObject({
      symbol: 'GROK',
      count: 3,
      multiplier: 12,
    });
  });

  it('awards the highest consecutive count', () => {
    const matches = evaluator.findMatches(
      grid(['GROK', 'GROK', 'GROK', 'GROK', 'BLANK']),
    );
    const lineOne = matches.find((match) => match.lineIndex === 0);

    expect(lineOne?.count).toBe(4);
    expect(lineOne?.multiplier).toBe(85);
  });

  it('evaluates each line independently', () => {
    const matches = evaluator.findMatches(
      grid(['CHATGPT', 'CHATGPT', 'CHATGPT', 'CHATGPT', 'CHATGPT']),
    );

    expect(matches).toHaveLength(20);
    expect(matches.every((match) => match.count === 5)).toBe(true);
  });

  it('does not pay blank symbols', () => {
    const matches = evaluator.findMatches(
      grid(['BLANK', 'BLANK', 'BLANK', 'BLANK', 'BLANK']),
    );
    expect(matches).toHaveLength(0);
  });
});
