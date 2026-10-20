import { gameConfig } from './config';
import { PaylineEvaluator } from './PaylineEvaluator';
import { PayoutCalculator } from './PayoutCalculator';
import { ReelEngine } from './ReelEngine';
import { SeededRandomSource } from './random';
import {
  THEORETICAL_RTP,
  calculateTheoreticalLineHitFrequency,
} from './ProbabilityEngine';
import type { SymbolId } from './types';

export type WinBand =
  | 'no-win'
  | 'under-1x'
  | '1x-5x'
  | '5x-20x'
  | '20x-100x'
  | '100x-plus';

export interface SimulationResult {
  spins: number;
  seed: number;
  wagerCents: number;
  totalWageredCents: number;
  totalReturnedCents: number;
  empiricalRtp: number;
  theoreticalRtp: number;
  standardError: number;
  confidenceInterval95: [number, number];
  hitFrequency: number;
  meanPayoutCents: number;
  maximumPayoutCents: number;
  maximumPayoutMultiplier: number;
  theoreticalLineHitFrequency: number;
  symbolCounts: Record<SymbolId, number>;
  winDistribution: Record<WinBand, number>;
}

export function runSimulation(
  spins: number,
  seed = 2049,
  wagerCents = 2000,
): SimulationResult {
  if (!Number.isInteger(spins) || spins <= 0) {
    throw new RangeError('The simulation spin count must be positive.');
  }

  const random = new SeededRandomSource(seed);
  const reels = new ReelEngine(gameConfig.reelStrips, random);
  const evaluator = new PaylineEvaluator(
    gameConfig.paylines,
    gameConfig.paytable,
  );
  const calculator = new PayoutCalculator();
  const betPerLineCents = wagerCents / gameConfig.paylines.length;

  const symbolCounts: Record<SymbolId, number> = {
    BLANK: 0,
    GROK: 0,
    CHATGPT: 0,
    MUSE: 0,
    ANTHROPIC: 0,
    GEMINI: 0,
  };

  const winDistribution: Record<WinBand, number> = {
    'no-win': 0,
    'under-1x': 0,
    '1x-5x': 0,
    '5x-20x': 0,
    '20x-100x': 0,
    '100x-plus': 0,
  };

  let totalReturnedCents = 0;
  let hitCount = 0;
  let maximumPayoutCents = 0;
  let maximumPayoutMultiplier = 0;
  let mean = 0;
  let m2 = 0;

  for (let spin = 0; spin < spins; spin += 1) {
    const stops = reels.sampleStops();
    const grid = reels.gridFromStops(stops);
    const wins = calculator.calculate(
      evaluator.findMatches(grid),
      betPerLineCents,
    );
    const payout = calculator.total(wins);

    totalReturnedCents += payout;
    if (payout > 0) hitCount += 1;
    maximumPayoutCents = Math.max(maximumPayoutCents, payout);

    const payoutRatio = payout / wagerCents;
    maximumPayoutMultiplier = Math.max(
      maximumPayoutMultiplier,
      payoutRatio,
    );

    const delta = payoutRatio - mean;
    mean += delta / (spin + 1);
    const delta2 = payoutRatio - mean;
    m2 += delta * delta2;

    for (const reel of grid) {
      for (const symbol of reel) symbolCounts[symbol] += 1;
    }

    if (payout === 0) winDistribution['no-win'] += 1;
    else if (payoutRatio < 1) winDistribution['under-1x'] += 1;
    else if (payoutRatio < 5) winDistribution['1x-5x'] += 1;
    else if (payoutRatio < 20) winDistribution['5x-20x'] += 1;
    else if (payoutRatio < 100) winDistribution['20x-100x'] += 1;
    else winDistribution['100x-plus'] += 1;
  }

  const variance = spins > 1 ? m2 / (spins - 1) : 0;
  const standardError = Math.sqrt(variance / spins);
  const empiricalRtp = totalReturnedCents / (spins * wagerCents);

  return {
    spins,
    seed,
    wagerCents,
    totalWageredCents: spins * wagerCents,
    totalReturnedCents,
    empiricalRtp,
    theoreticalRtp: THEORETICAL_RTP,
    standardError,
    confidenceInterval95: [
      Math.max(0, empiricalRtp - 1.96 * standardError),
      empiricalRtp + 1.96 * standardError,
    ],
    hitFrequency: hitCount / spins,
    meanPayoutCents: totalReturnedCents / spins,
    maximumPayoutCents,
    maximumPayoutMultiplier,
    theoreticalLineHitFrequency: calculateTheoreticalLineHitFrequency(),
    symbolCounts,
    winDistribution,
  };
}
