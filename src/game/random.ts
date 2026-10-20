export interface RandomSource {
  nextInt(maxExclusive: number): number;
}

export class SecureRandomSource implements RandomSource {
  private readonly buffer = new Uint32Array(1);

  nextInt(maxExclusive: number): number {
    if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
      throw new RangeError('maxExclusive must be a positive integer.');
    }

    if (maxExclusive > 0x100000000) {
      throw new RangeError('Secure random integer range exceeds uint32.');
    }

    const cryptoApi = globalThis.crypto;
    if (!cryptoApi?.getRandomValues) {
      throw new Error(
        'A cryptographically secure random source is unavailable in this environment.',
      );
    }

    const limit = Math.floor(0x100000000 / maxExclusive) * maxExclusive;
    let value = 0;

    do {
      cryptoApi.getRandomValues(this.buffer);
      value = this.buffer[0];
    } while (value >= limit);

    return value % maxExclusive;
  }
}

export class SeededRandomSource implements RandomSource {
  private state: number;

  constructor(seed: number) {
    this.state = (seed >>> 0) || 0x9e3779b9;
  }

  private nextUint32(): number {
    let value = this.state;
    value ^= value << 13;
    value ^= value >>> 17;
    value ^= value << 5;
    this.state = value >>> 0;
    return this.state;
  }

  nextInt(maxExclusive: number): number {
    if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
      throw new RangeError('maxExclusive must be a positive integer.');
    }

    const limit = Math.floor(0x100000000 / maxExclusive) * maxExclusive;
    let value = this.nextUint32();

    while (value >= limit) {
      value = this.nextUint32();
    }

    return value % maxExclusive;
  }
}

export const secureRandomSource = new SecureRandomSource();
