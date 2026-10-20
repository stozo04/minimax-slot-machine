import type {
  CompletedSession,
  PersistedSessionData,
  PersistedSettings,
  SpinHistoryEntry,
  SpinOutcome,
  WalletSnapshot,
} from './types';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const STORAGE_KEY = 'neural-jackpot-ai-wars-session-v1';

function defaultSessionData(): PersistedSessionData {
  return {
    version: 1,
    wallet: {
      availableCents: 0,
      totalWageredCents: 0,
      totalWinningsCents: 0,
      totalDepositedCents: 0,
      lastWinCents: 0,
    },
    history: [],
    completedSessions: [],
    settings: {
      denominationCents: 100,
      multiplier: 1,
      muted: false,
      volume: 0.65,
      reducedMotion:
        typeof window !== 'undefined' &&
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    },
    pendingOutcome: null,
  };
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export class SessionManager {
  private data: PersistedSessionData;

  constructor(
    private readonly storage: StorageLike | undefined =
      typeof window !== 'undefined' ? window.localStorage : undefined,
    private readonly key: string = STORAGE_KEY,
  ) {
    this.data = this.read();
  }

  private read(): PersistedSessionData {
    if (!this.storage) return defaultSessionData();

    try {
      const raw = this.storage.getItem(this.key);
      if (!raw) return defaultSessionData();

      const parsed = JSON.parse(raw) as Partial<PersistedSessionData>;
      if (parsed.version !== 1) return defaultSessionData();

      const fallback = defaultSessionData();
      return {
        version: 1,
        wallet: parsed.wallet ?? fallback.wallet,
        history: Array.isArray(parsed.history) ? parsed.history : [],
        completedSessions: Array.isArray(parsed.completedSessions)
          ? parsed.completedSessions
          : [],
        settings: {
          ...fallback.settings,
          ...(parsed.settings ?? {}),
        },
        pendingOutcome: parsed.pendingOutcome ?? null,
      };
    } catch {
      return defaultSessionData();
    }
  }

  private write(): void {
    if (!this.storage) return;

    try {
      this.storage.setItem(this.key, JSON.stringify(this.data));
    } catch {
      // The game remains playable when storage is unavailable or full.
    }
  }

  load(): PersistedSessionData {
    return clone(this.data);
  }

  persistEngineState(
    wallet: WalletSnapshot,
    history: SpinHistoryEntry[],
    completedSessions: CompletedSession[],
    pendingOutcome: SpinOutcome | null,
  ): void {
    this.data = {
      ...this.data,
      wallet: { ...wallet },
      history: clone(history.slice(0, 50)),
      completedSessions: clone(completedSessions.slice(0, 30)),
      pendingOutcome: pendingOutcome ? clone(pendingOutcome) : null,
    };
    this.write();
  }

  updateSettings(settings: PersistedSettings): void {
    this.data = {
      ...this.data,
      settings: { ...settings },
    };
    this.write();
  }

  clear(): void {
    this.data = defaultSessionData();
    try {
      this.storage?.removeItem(this.key);
    } catch {
      // Storage failures do not affect the active game.
    }
  }
}

export const defaultSessionManager = new SessionManager();
