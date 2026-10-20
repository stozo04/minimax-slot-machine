import { gameConfig } from './config';
import { secureRandomSource } from './random';
import type { RandomSource } from './random';
import { PaylineEvaluator } from './PaylineEvaluator';
import { PayoutCalculator } from './PayoutCalculator';
import { ReelEngine } from './ReelEngine';
import type {
  GameConfig,
  Grid,
  LineWin,
  PayingSymbolId,
  SpinOutcome,
} from './types';

export class ProbabilityEngine {
  private readonly reelEngine: ReelEngine;
  private readonly evaluator: PaylineEvaluator;
  private readonly calculator = new PayoutCalculator();
  private spinCounter = 0;

  constructor(
    private readonly config: GameConfig = gameConfig,
    private readonly random: RandomSource = secureRandomSource,
  ) {
    this.reelEngine = new ReelEngine(config.reelStrips, random);
    this.evaluator = new PaylineEvaluator(config.paylines, config.paytable);
  }

  spin(totalWagerCents: number): SpinOutcome {
    const lineCount = this.config.paylines.length;
    if (
      !Number.isInteger(totalWagerCents) ||
      totalWagerCents <= 0 ||
      totalWagerCents % lineCount !== 0
    ) {
      throw new RangeError(
        `The wager must be a positive integer divisible by ${lineCount}.`,
      );
    }

    const reelStops = this.reelEngine.sampleStops();
    const grid = this.reelEngine.gridFromStops(reelStops);
    const betPerLineCents = totalWagerCents / lineCount;
    const wins = this.calculator.calculate(
      this.evaluator.findMatches(grid),
      betPerLineCents,
    );

    this.spinCounter += 1;
    const randomSuffix = this.random.nextInt(0x100000000).toString(16);

    return {
      spinId: `spin-${Date.now().toString(36)}-${this.spinCounter}-${randomSuffix}`,
      wagerCents: totalWagerCents,
      betPerLineCents,
      reelStops,
      grid,
      wins,
      totalWinCents: this.calculator.total(wins),
    };
  }

  validateOutcome(outcome: SpinOutcome): void {
    const rebuiltGrid = this.reelEngine.gridFromStops(outcome.reelStops);
    if (!gridsEqual(rebuiltGrid, outcome.grid)) {
      throw new Error('Outcome validation failed: displayed grid mismatch.');
    }

    const lineCount = this.config.paylines.length;
    if (outcome.wagerCents % lineCount !== 0) {
      throw new Error('Outcome validation failed: invalid wager.');
    }

    const expectedWins = this.calculator.calculate(
      this.evaluator.findMatches(rebuiltGrid),
      outcome.wagerCents / lineCount,
    );

    if (!winsEqual(expectedWins, outcome.wins)) {
      throw new Error('Outcome validation failed: payout mismatch.');
    }

    const expectedTotal = this.calculator.total(expectedWins);
    if (expectedTotal !== outcome.totalWinCents) {
      throw new Error('Outcome validation failed: total payout mismatch.');
    }
  }
}

function gridsEqual(left: Grid, right: Grid): boolean {
  return left.every((reel, reelIndex) =>
    reel.every((symbol, row) => symbol === right[reelIndex]?.[row]),
  );
}

function winsEqual(left: readonly LineWin[], right: readonly LineWin[]): boolean {
  if (left.length !== right.length) return false;

  return left.every((win, index) => {
    const other = right[index];
    return (
      win.lineIndex === other.lineIndex &&
      win.symbol === other.symbol &&
      win.count === other.count &&
      win.multiplier === other.multiplier &&
      win.amountCents === other.amountCents
    );
  });
}

export function calculateTheoreticalRtp(
  config: GameConfig = gameConfig,
): number {
  const lineValues = config.paylines.map((line) => {
    let lineValue = 0;

    for (const symbol of Object.keys(config.paytable) as PayingSymbolId[]) {
      const probabilities = line.map((row, reelIndex) => {
        const strip = config.reelStrips[reelIndex];
        const occurrences = strip.reduce(
          (count, candidate) => count + (candidate === symbol ? 1 : 0),
          0,
        );
        return occurrences / strip.length;
      });

      const probability3 = probabilities[0] * probabilities[1] * probabilities[2];
      const probability4 = probability3 * probabilities[3];
      const probability5 = probability4 * probabilities[4];
      const exactly3 = probability3 - probability4;
      const exactly4 = probability4 - probability5;

      lineValue +=
        exactly3 * config.paytable[symbol][3] +
        exactly4 * config.paytable[symbol][4] +
        probability5 * config.paytable[symbol][5];
    }

    return lineValue;
  });

  return (
    lineValues.reduce((sum, value) => sum + value, 0) / lineValues.length
  );
}

export function calculateTheoreticalLineHitFrequency(
  config: GameConfig = gameConfig,
): number {
  const lineHitProbabilities = config.paylines.map((line) => {
    let hitProbability = 0;

    for (const symbol of Object.keys(config.paytable) as PayingSymbolId[]) {
      const probabilities = line.map((row, reelIndex) => {
        const strip = config.reelStrips[reelIndex];
        const occurrences = strip.reduce(
          (count, candidate) => count + (candidate === symbol ? 1 : 0),
          0,
        );
        return occurrences / strip.length;
      });

      hitProbability += probabilities[0] * probabilities[1] * probabilities[2];
    }

    return hitProbability;
  });

  return (
    lineHitProbabilities.reduce((sum, value) => sum + value, 0) /
    lineHitProbabilities.length
  );
}

export const THEORETICAL_RTP = calculateTheoreticalRtp();
export const THEORETICAL_LINE_HIT_FREQUENCY =
  calculateTheoreticalLineHitFrequency();
export const MAXIMUM_PAYOUT_MULTIPLIER = 500;
