import { describe, expect, it } from 'vitest';
import {
  CreditWallet,
  InsufficientCreditsError,
} from '../CreditWallet';

describe('CreditWallet', () => {
  it('starts with no credits', () => {
    const wallet = new CreditWallet();
    expect(wallet.snapshot().availableCents).toBe(0);
  });

  it('debits and credits integer cents', () => {
    const wallet = new CreditWallet();
    wallet.deposit(10000);
    wallet.debit(2000);
    wallet.creditWin(500);

    expect(wallet.snapshot()).toMatchObject({
      availableCents: 8500,
      totalWageredCents: 2000,
      totalWinningsCents: 500,
      totalDepositedCents: 10000,
      lastWinCents: 500,
    });
  });

  it('does not permit a negative balance', () => {
    const wallet = new CreditWallet();
    expect(() => wallet.debit(100)).toThrow(InsufficientCreditsError);
  });

  it('rejects fractional credits', () => {
    const wallet = new CreditWallet();
    expect(() => wallet.deposit(10.5)).toThrow(RangeError);
  });
});
