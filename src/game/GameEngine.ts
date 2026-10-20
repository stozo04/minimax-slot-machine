import { gameConfig } from './config';
import { CreditWallet, InsufficientCreditsError } from './CreditWallet';
import { ProbabilityEngine } from './ProbabilityEngine';
import {
  defaultSessionManager,
  type SessionManager,
} from './SessionManager';
import type {
  CashOutReceipt,
  CompletedSession,
  SpinHistoryEntry,
  SpinOutcome,
  WalletSnapshot,
} from './types';

export class GameEngine {
  private readonly wallet: CreditWallet;
  private readonly probability: ProbabilityEngine;
  private readonly session: SessionManager;
  private history: SpinHistoryEntry[];
  private completedSessions: CompletedSession[];
  private activeOutcome: SpinOutcome | null = null;
  private readonly settledOutcomeIds = new Set<string>();

  constructor(
    probability: ProbabilityEngine = new ProbabilityEngine(gameConfig),
    session: SessionManager = defaultSessionManager,
  ) {
    this.probability = probability;
    this.session = session;

    const persisted = session.load();
    this.wallet = new CreditWallet(persisted.wallet);
    this.history = persisted.history;
    this.completedSessions = persisted.completedSessions;

    if (persisted.pendingOutcome) {
      try {
        this.settleOutcome(persisted.pendingOutcome, true);
      } catch {
        this.activeOutcome = null;
        this.persist();
      }
    }
  }

  deposit(amountCents: number): WalletSnapshot {
    const wallet = this.wallet.deposit(amountCents);
    this.persist();
    return wallet;
  }

  beginSpin(totalWagerCents: number): SpinOutcome {
    if (this.activeOutcome) {
      throw new Error('A spin is already active.');
    }

    if (
      this.wallet.snapshot().availableCents < totalWagerCents
    ) {
      throw new InsufficientCreditsError(
        totalWagerCents,
        this.wallet.snapshot().availableCents,
      );
    }

    const outcome = this.probability.spin(totalWagerCents);
    this.wallet.debit(totalWagerCents);
    this.activeOutcome = outcome;
    this.persist();
    return outcome;
  }

  settleOutcome(outcome: SpinOutcome, recovered = false): WalletSnapshot {
    if (this.settledOutcomeIds.has(outcome.spinId)) {
      return this.wallet.snapshot();
    }

    if (
      !recovered &&
      (!this.activeOutcome || this.activeOutcome.spinId !== outcome.spinId)
    ) {
      throw new Error('The outcome is not the active spin.');
    }

    this.probability.validateOutcome(outcome);
    this.wallet.creditWin(outcome.totalWinCents);
    this.settledOutcomeIds.add(outcome.spinId);

    this.history.unshift({
      ...outcome,
      timestamp: new Date().toISOString(),
    });
    this.history = this.history.slice(0, 50);
    this.activeOutcome = null;
    this.persist();
    return this.wallet.snapshot();
  }

  prepareCashOut(): CashOutReceipt {
    if (this.activeOutcome) {
      throw new Error('The active spin must settle before cashing out.');
    }

    const wallet = this.wallet.snapshot();
    if (wallet.availableCents <= 0) {
      throw new Error('There are no virtual credits to cash out.');
    }

    return {
      receiptId: `receipt-${Date.now().toString(36)}-${this.history.length}`,
      finalBalanceCents: wallet.availableCents,
      sessionProfitCents:
        wallet.totalWinningsCents - wallet.totalWageredCents,
      totalWageredCents: wallet.totalWageredCents,
      totalWinningsCents: wallet.totalWinningsCents,
      spinCount: this.history.length,
      issuedAt: new Date().toISOString(),
    };
  }

  commitCashOut(receipt: CashOutReceipt): CompletedSession {
    if (this.activeOutcome) {
      throw new Error('The active spin must settle before cashing out.');
    }

    const wallet = this.wallet.snapshot();
    if (wallet.availableCents !== receipt.finalBalanceCents) {
      throw new Error('The virtual balance changed after the receipt was issued.');
    }

    const completed: CompletedSession = {
      id: receipt.receiptId,
      finalBalanceCents: receipt.finalBalanceCents,
      sessionProfitCents: receipt.sessionProfitCents,
      totalWageredCents: receipt.totalWageredCents,
      totalWinningsCents: receipt.totalWinningsCents,
      spinCount: receipt.spinCount,
      cashedOutAt: new Date().toISOString(),
    };

    this.completedSessions.unshift(completed);
    this.completedSessions = this.completedSessions.slice(0, 30);
    this.wallet.resetAfterCashOut();
    this.persist();
    return completed;
  }

  getWalletSnapshot(): WalletSnapshot {
    return this.wallet.snapshot();
  }

  getHistory(): SpinHistoryEntry[] {
    return this.history.map((entry) => ({ ...entry }));
  }

  getCompletedSessions(): CompletedSession[] {
    return this.completedSessions.map((session) => ({ ...session }));
  }

  hasActiveSpin(): boolean {
    return this.activeOutcome !== null;
  }

  private persist(): void {
    this.session.persistEngineState(
      this.wallet.snapshot(),
      this.history,
      this.completedSessions,
      this.activeOutcome,
    );
  }
}

export const gameEngine = new GameEngine();
