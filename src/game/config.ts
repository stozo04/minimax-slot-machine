import type {
  GameConfig,
  Paytable,
  SymbolId,
} from './types';

export const REEL_SYMBOL_COUNTS: Record<SymbolId, number> = {
  BLANK: 40,
  GROK: 25,
  CHATGPT: 15,
  MUSE: 10,
  ANTHROPIC: 7,
  GEMINI: 3,
};

export const SYMBOL_WEIGHTS: Record<SymbolId, number> = {
  BLANK: 40,
  GROK: 25,
  CHATGPT: 15,
  MUSE: 10,
  ANTHROPIC: 7,
  GEMINI: 3,
};

const symbolOrder: SymbolId[] = [
  'BLANK',
  'GROK',
  'CHATGPT',
  'MUSE',
  'ANTHROPIC',
  'GEMINI',
];

function createShuffle(seed: number): (items: SymbolId[]) => SymbolId[] {
  let state = seed >>> 0;

  const random = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };

  return (items) => {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(random() * (index + 1));
      [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
    }
    return result;
  };
}

/**
 * The 100-position strips are balanced across stop-position residues while
 * retaining the exact total frequencies. Every visible row is a cyclic shift
 * of a strip, so every row has the documented marginal symbol frequencies.
 */
function createBalancedStrip(seed: number): SymbolId[] {
  const residueTargets: Record<SymbolId, [number, number, number]> = {
    BLANK: [14, 13, 13],
    GROK: [9, 8, 8],
    CHATGPT: [5, 5, 5],
    MUSE: [3, 4, 3],
    ANTHROPIC: [2, 2, 3],
    GEMINI: [1, 1, 1],
  };

  const buckets: SymbolId[][] = [[], [], []];

  symbolOrder.forEach((symbol, symbolIndex) => {
    residueTargets[symbol].forEach((count, residueIndex) => {
      const values = Array.from({ length: count }, () => symbol);
      const shuffle = createShuffle(
        seed + symbolIndex * 1009 + residueIndex * 7919,
      );
      buckets[residueIndex].push(...shuffle(values));
    });
  });

  const strip: SymbolId[] = [];
  for (let index = 0; index < 100; index += 1) {
    const residue = index % 3;
    strip.push(buckets[residue][Math.floor(index / 3)] ?? 'BLANK');
  }

  // A three-position Grok run exists on every reel. It makes the published
  // absolute maximum payout attainable while preserving all strip counts.
  const tripleStart = 30;
  for (let position = tripleStart; position < tripleStart + 3; position += 1) {
    if (strip[position] === 'GROK') continue;

    const displacedSymbol = strip[position];
    const donor = strip.findIndex(
      (symbol, index) =>
        symbol === 'GROK' &&
        index % 3 === position % 3 &&
        (index < tripleStart || index >= tripleStart + 3),
    );

    if (donor < 0) {
      throw new Error('Unable to construct balanced reel strip.');
    }

    strip[position] = 'GROK';
    strip[donor] = displacedSymbol;
  }

  return strip;
}

export const REEL_STRIPS: readonly (readonly SymbolId[])[] = Object.freeze(
  Array.from({ length: 5 }, (_, index) =>
    Object.freeze(createBalancedStrip(0x4e4a0000 + index * 104729)),
  ),
);

export const PAY_LINES: readonly (readonly number[])[] = Object.freeze([
  [0, 0, 0, 0, 0],
  [1, 1, 1, 1, 1],
  [2, 2, 2, 2, 2],
  [0, 0, 1, 2, 2],
  [2, 2, 1, 0, 0],
  [1, 1, 0, 0, 1],
  [1, 1, 2, 2, 2],
  [0, 1, 1, 1, 0],
  [2, 1, 1, 1, 2],
  [1, 0, 0, 0, 1],
  [0, 1, 2, 1, 0],
  [2, 1, 0, 1, 2],
  [1, 0, 1, 0, 1],
  [0, 1, 1, 2, 2],
  [2, 1, 1, 0, 0],
  [1, 2, 2, 2, 1],
  [0, 0, 0, 1, 2],
  [2, 2, 2, 1, 0],
  [0, 1, 2, 0, 0],
  [2, 1, 0, 0, 2],
]);

export const PAYTABLE: Paytable = {
  GROK: { 3: 12, 4: 85, 5: 500 },
  CHATGPT: { 3: 7, 4: 40, 5: 180 },
  MUSE: { 3: 6, 4: 25, 5: 120 },
  ANTHROPIC: { 3: 2, 4: 8, 5: 70 },
  GEMINI: { 3: 1, 4: 5, 5: 30 },
};

export const DENOMINATIONS_CENTS = [100, 500, 1000] as const;
export const BET_MULTIPLIERS = [1, 5, 10] as const;

const museOverride = import.meta.env?.VITE_MUSE_LOGO_URL;
const museGlowOverride = import.meta.env?.VITE_MUSE_GLOW_COLOR;

export const ASSET_URLS: Record<SymbolId, string> = {
  BLANK: '/assets/blank.svg',
  GROK: '/assets/grok.svg',
  CHATGPT: '/assets/chatgpt.svg',
  MUSE: museOverride || '/assets/muse-user.svg',
  ANTHROPIC: '/assets/anthropic.svg',
  GEMINI: '/assets/gemini.svg',
};

export const REACTION_COLORS: Record<SymbolId, string> = {
  BLANK: '#25324b',
  GROK: '#f5fbff',
  CHATGPT: '#62e7c6',
  MUSE: museGlowOverride || '#ffd2a6',
  ANTHROPIC: '#f2b477',
  GEMINI: '#8a79ff',
};

export const SYMBOL_DISPLAY_NAMES: Record<SymbolId, string> = {
  BLANK: 'Blank',
  GROK: 'Grok',
  CHATGPT: 'ChatGPT',
  MUSE: 'Muse',
  ANTHROPIC: 'Anthropic',
  GEMINI: 'Gemini',
};

export const gameConfig: GameConfig = {
  reelCount: 5,
  rows: 3,
  reelStrips: REEL_STRIPS,
  paylines: PAY_LINES,
  paytable: PAYTABLE,
  denominationsCents: DENOMINATIONS_CENTS,
  multipliers: BET_MULTIPLIERS,
};

export function calculateTotalWagerCents(
  denominationCents: number,
  multiplier: number,
): number {
  return denominationCents * multiplier * gameConfig.paylines.length;
}
