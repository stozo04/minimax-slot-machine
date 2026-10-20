import { describe, expect, it } from 'vitest';
import { gameConfig } from '../config';
import { GameEngine } from '../GameEngine';
import { ProbabilityEngine } from '../ProbabilityEngine';
import { SeededRandomSource } from '../random';
import { SessionManager, type StorageLike } from '../SessionManager';

class MemoryStorage implements StorageLike {
  private values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

function createEngine(seed = 42): GameEngine {
  const session = new SessionManager(new MemoryStorage(), 'test-session');
  const probability = new ProbabilityEngine(
    gameConfig,
    new SeededRandomSource(seed),
  );
  return new GameEngine(probability, session);
}

describe('GameEngine', () => {
  it('debits once and credits a validated payout', () => {
    const engine = createEngine();
    engine.deposit(10000);

    const outcome = engine.beginSpin(2000);
    expect(engine.getWalletSnapshot().availableCents).toBe(8000);
    expect(engine.getWalletSnapshot().totalWageredCents).toBe(2000);

    const settled = engine.settleOutcome(outcome);
    expect(settled.availableCents).toBe(8000 + outcome.totalWinCents);
    expect(settled.totalWinningsCents).toBe(outcome.totalWinCents);
  });

  it('does not credit the same outcome twice', () => {
    const engine = createEngine();
    engine.deposit(10000);
    const outcome = engine.beginSpin(2000);

    engine.settleOutcome(outcome);
    const balanceAfterFirstSettlement = engine.getWalletSnapshot().availableCents;
    engine.settleOutcome(outcome);

    expect(engine.getWalletSnapshot().availableCents).toBe(
      balanceAfterFirstSettlement,
    );
    expect(engine.getHistory()).toHaveLength(1);
  });

  it('rejects an insufficient wager', () => {
    const engine = createEngine();
    engine.deposit(1000);
    expect(() => engine.beginSpin(2000)).toThrow();
  });

  it('creates a completed session and resets the balance on cash out', () => {
    const engine = createEngine();
    engine.deposit(10000);
    const outcome = engine.beginSpin(2000);
    engine.settleOutcome(outcome);

    const receipt = engine.prepareCashOut();
    const completed = engine.commitCashOut(receipt);

    expect(completed.finalBalanceCents).toBe(receipt.finalBalanceCents);
    expect(engine.getWalletSnapshot().availableCents).toBe(0);
    expect(engine.getCompletedSessions()).toHaveLength(1);
  });
});
