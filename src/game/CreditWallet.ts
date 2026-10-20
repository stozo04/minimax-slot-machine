import type { WalletSnapshot } from './types';

export class InsufficientCreditsError extends Error {
  constructor(
    readonly requiredCents: number,
    readonly availableCents: number,
  ) {
    super(
      `Insufficient virtual credits: ${requiredCents} required, ${availableCents} available.`,
    );
    this.name = 'InsufficientCreditsError';
  }
}

export class CreditWallet {
  private state: WalletSnapshot;

  constructor(initial: WalletSnapshot = {
    availableCents: 0,
    totalWageredCents: 0,
    totalWinningsCents: 0,
    totalDepositedCents: 0,
    lastWinCents: 0,
  }) {
    this.state = { ...initial };
  }

  deposit(amountCents: number): WalletSnapshot {
    if (!Number.isInteger(amountCents) || amountCents <= 0) {
      throw new RangeError('A deposit must be a positive integer.');
    }

    this.state.availableCents += amountCents;
    this.state.totalDepositedCents += amountCents;
    return this.snapshot();
  }

  debit(amountCents: number): WalletSnapshot {
    if (!Number.isInteger(amountCents) || amountCents <= 0) {
      throw new RangeError('A debit must be a positive integer.');
    }

    if (this.state.availableCents < amountCents) {
      throw new InsufficientCreditsError(
        amountCents,
        this.state.availableCents,
      );
    }

    this.state.availableCents -= amountCents;
    this.state.totalWageredCents += amountCents;
    return this.snapshot();
  }

  creditWin(amountCents: number): WalletSnapshot {
    if (!Number.isInteger(amountCents) || amountCents < 0) {
      throw new RangeError('A payout must be a non-negative integer.');
    }

    this.state.availableCents += amountCents;
    this.state.totalWinningsCents += amountCents;
    this.state.lastWinCents = amountCents;
    return this.snapshot();
  }

  resetAfterCashOut(): WalletSnapshot {
    this.state = {
      availableCents: 0,
      totalWageredCents: 0,
      totalWinningsCents: 0,
      totalDepositedCents: 0,
      lastWinCents: 0,
    };
    return this.snapshot();
  }

  snapshot(): WalletSnapshot {
    return { ...this.state };
  }
}
