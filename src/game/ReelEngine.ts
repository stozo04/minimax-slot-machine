import type { Grid, SymbolId } from './types';
import type { RandomSource } from './random';

export class ReelEngine {
  constructor(
    private readonly strips: readonly (readonly SymbolId[])[],
    private readonly random: RandomSource,
  ) {
    if (strips.length === 0 || strips.some((strip) => strip.length === 0)) {
      throw new Error('At least one non-empty reel strip is required.');
    }
  }

  sampleStops(): number[] {
    return this.strips.map((strip) => this.random.nextInt(strip.length));
  }

  gridFromStops(stops: readonly number[]): Grid {
    if (stops.length !== this.strips.length) {
      throw new Error('The number of reel stops does not match the reel count.');
    }

    return this.strips.map((strip, reelIndex) => {
      const stop = stops[reelIndex];
      if (!Number.isInteger(stop) || stop < 0 || stop >= strip.length) {
        throw new RangeError(`Invalid stop position for reel ${reelIndex}.`);
      }

      return [0, 1, 2].map(
        (row) => strip[(stop + row - 1 + strip.length) % strip.length],
      );
    });
  }

  symbolAt(reelIndex: number, stop: number, row: number): SymbolId {
    const strip = this.strips[reelIndex];
    return strip[(stop + row - 1 + strip.length) % strip.length];
  }
}
