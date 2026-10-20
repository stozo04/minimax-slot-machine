import { create } from 'zustand';
import { gameEngine } from '../game/GameEngine';
import { defaultSessionManager } from '../game/SessionManager';
import type {
  CashOutReceipt,
  CompletedSession,
  GamePhase,
  PersistedSettings,
  SpinHistoryEntry,
  SpinOutcome,
  WalletSnapshot,
} from '../game/types';

export type PanelId =
  | 'paytable'
  | 'rules'
  | 'history'
  | 'statistics'
  | 'settings'
  | null;

export interface ToastMessage {
  id: number;
  message: string;
  tone: 'info' | 'success' | 'warning';
}

interface GameStore {
  wallet: WalletSnapshot;
  settings: PersistedSettings;
  phase: GamePhase;
  lastOutcome: SpinOutcome | null;
  history: SpinHistoryEntry[];
  completedSessions: CompletedSession[];
  activePanel: PanelId;
  depositOpen: boolean;
  cashOutOpen: boolean;
  cashOutReceipt: CashOutReceipt | null;
  toast: ToastMessage | null;
  skipToken: number;
  setWallet: (wallet: WalletSnapshot) => void;
  setSettings: (patch: Partial<PersistedSettings>) => void;
  setPhase: (phase: GamePhase) => void;
  setLastOutcome: (outcome: SpinOutcome | null) => void;
  setHistory: (history: SpinHistoryEntry[]) => void;
  setCompletedSessions: (sessions: CompletedSession[]) => void;
  setActivePanel: (panel: PanelId) => void;
  setDepositOpen: (open: boolean) => void;
  setCashOutOpen: (open: boolean) => void;
  setCashOutReceipt: (receipt: CashOutReceipt | null) => void;
  setToast: (message: string, tone?: ToastMessage['tone']) => void;
  clearToast: (id: number) => void;
  incrementSkipToken: () => void;
}

let toastId = 0;
const persisted = defaultSessionManager.load();

export const useGameStore = create<GameStore>((set, get) => ({
  wallet: gameEngine.getWalletSnapshot(),
  settings: persisted.settings,
  phase: 'IDLE',
  lastOutcome: null,
  history: gameEngine.getHistory(),
  completedSessions: gameEngine.getCompletedSessions(),
  activePanel: null,
  depositOpen: false,
  cashOutOpen: false,
  cashOutReceipt: null,
  toast: null,
  skipToken: 0,

  setWallet: (wallet) => set({ wallet }),
  setSettings: (patch) => {
    const settings = { ...get().settings, ...patch };
    defaultSessionManager.updateSettings(settings);
    set({ settings });
  },
  setPhase: (phase) => set({ phase }),
  setLastOutcome: (lastOutcome) => set({ lastOutcome }),
  setHistory: (history) => set({ history }),
  setCompletedSessions: (completedSessions) => set({ completedSessions }),
  setActivePanel: (activePanel) => set({ activePanel }),
  setDepositOpen: (depositOpen) => set({ depositOpen }),
  setCashOutOpen: (cashOutOpen) => set({ cashOutOpen }),
  setCashOutReceipt: (cashOutReceipt) => set({ cashOutReceipt }),
  setToast: (message, tone = 'info') =>
    set({ toast: { id: ++toastId, message, tone } }),
  clearToast: (id) => {
    if (get().toast?.id === id) set({ toast: null });
  },
  incrementSkipToken: () =>
    set((state) => ({ skipToken: state.skipToken + 1 })),
}));
