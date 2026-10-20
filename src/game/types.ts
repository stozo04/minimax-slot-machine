export const SYMBOL_IDS = [
  'BLANK',
  'GROK',
  'CHATGPT',
  'MUSE',
  'ANTHROPIC',
  'GEMINI',
] as const;

export type SymbolId = (typeof SYMBOL_IDS)[number];
export type PayingSymbolId = Exclude<SymbolId, 'BLANK'>;

export type GamePhase =
  | 'IDLE'
  | 'BET_PLACED'
  | 'SPINNING'
  | 'EVALUATING'
  | 'PAYOUT'
  | 'IDLE';

export type PayoutMultipliers = {
  3: number;
  4: number;
  5: number;
};

export type Paytable = Record<PayingSymbolId, PayoutMultipliers>;

export type Grid = SymbolId[][];

export interface GameConfig {
  reelCount: number;
  rows: number;
  reelStrips: readonly (readonly SymbolId[])[];
  paylines: readonly (readonly number[])[];
  paytable: Paytable;
  denominationsCents: readonly number[];
  multipliers: readonly number[];
}

export interface LineMatch {
  lineIndex: number;
  symbol: PayingSymbolId;
  count: 3 | 4 | 5;
  multiplier: number;
}

export interface LineWin extends LineMatch {
  amountCents: number;
}

export interface SpinOutcome {
  spinId: string;
  wagerCents: number;
  betPerLineCents: number;
  reelStops: number[];
  grid: Grid;
  wins: LineWin[];
  totalWinCents: number;
}

export interface WalletSnapshot {
  availableCents: number;
  totalWageredCents: number;
  totalWinningsCents: number;
  totalDepositedCents: number;
  lastWinCents: number;
}

export interface SpinHistoryEntry extends SpinOutcome {
  timestamp: string;
}

export interface PersistedSettings {
  denominationCents: number;
  multiplier: number;
  muted: boolean;
  volume: number;
  reducedMotion: boolean;
}

export interface PersistedSessionData {
  version: 1;
  wallet: WalletSnapshot;
  history: SpinHistoryEntry[];
  completedSessions: CompletedSession[];
  settings: PersistedSettings;
  pendingOutcome: SpinOutcome | null;
}

export interface CashOutReceipt {
  receiptId: string;
  finalBalanceCents: number;
  sessionProfitCents: number;
  totalWageredCents: number;
  totalWinningsCents: number;
  spinCount: number;
  issuedAt: string;
}

export interface CompletedSession {
  id: string;
  finalBalanceCents: number;
  sessionProfitCents: number;
  totalWageredCents: number;
  totalWinningsCents: number;
  spinCount: number;
  cashedOutAt: string;
}
