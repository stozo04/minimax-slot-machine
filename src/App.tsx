import { CashOutModal } from './components/CashOutModal';
import { DepositModal } from './components/DepositModal';
import { GameControls } from './components/GameControls';
import { GameRulesPanel } from './components/GameRulesPanel';
import { HistoryPanel } from './components/HistoryPanel';
import { PanelShell } from './components/PanelShell';
import { PaytablePanel } from './components/PaytablePanel';
import { SettingsPanel } from './components/SettingsPanel';
import { StatisticsPanel } from './components/StatisticsPanel';
import { Toast } from './components/Toast';
import { TopBar } from './components/TopBar';
import { WinDisplay } from './components/WinDisplay';
import SlotMachine3D from './components/three/SlotMachine3D';
import { useGameController } from './hooks/useGameController';
import { useGameStore } from './store/useGameStore';

export default function App() {
  const controller = useGameController();
  const phase = useGameStore((state) => state.phase);
  const outcome = useGameStore((state) => state.lastOutcome);
  const activePanel = useGameStore((state) => state.activePanel);
  const depositOpen = useGameStore((state) => state.depositOpen);
  const cashOutOpen = useGameStore((state) => state.cashOutOpen);
  const cashOutReceipt = useGameStore((state) => state.cashOutReceipt);
  const settings = useGameStore((state) => state.settings);
  const skipToken = useGameStore((state) => state.skipToken);
  const setActivePanel = useGameStore((state) => state.setActivePanel);
  const setDepositOpen = useGameStore((state) => state.setDepositOpen);

  const showWin =
    (phase === 'EVALUATING' || phase === 'PAYOUT') &&
    outcome !== null &&
    outcome.totalWinCents > 0;

  return (
    <div className="app-shell">
      <div className="ambient-background" aria-hidden="true">
        <span className="ambient-orb orb-one" />
        <span className="ambient-orb orb-two" />
        <span className="ambient-grid" />
      </div>

      <TopBar
        onToggleSound={controller.toggleSound}
        onVolumeChange={controller.changeVolume}
        onOpenSettings={() => setActivePanel('settings')}
      />

      <main className="main-layout">
        <section className="stage-shell glass-panel" aria-label="Slot machine stage">
          <div className="stage-hud">
            <div className="stage-title-block">
              <span className="eyebrow">AI-POWERED REEL SYSTEM</span>
              <h1>
                NEURAL JACKPOT
                <small>THE AI WARS</small>
              </h1>
            </div>

            <div className="stage-specs" aria-label="Machine specifications">
              <span>5 REELS</span>
              <i />
              <span>3 ROWS</span>
              <i />
              <span>20 LINES</span>
            </div>

            {phase === 'SPINNING' && (
              <button
                type="button"
                className="skip-button"
                onClick={controller.requestSkip}
              >
                SKIP REEL MOTION
              </button>
            )}
          </div>

          <div className="canvas-wrap">
            <SlotMachine3D
              outcome={outcome}
              phase={phase}
              reducedMotion={settings.reducedMotion}
              skipToken={skipToken}
              onComplete={(completedOutcome) =>
                void controller.completeSpin(completedOutcome)
              }
              onSpinRequest={() => void controller.spin()}
            />

            {showWin && outcome && (
              <div className="win-overlay">
                <WinDisplay
                  amountCents={outcome.totalWinCents}
                  lineCount={outcome.wins.length}
                />
              </div>
            )}
          </div>

          <div className="stage-footer">
            <span>RTP {(0.9387072984 * 100).toFixed(4)}%</span>
            <span>SIMULATED MONEY ONLY</span>
            <span>ODDS FIXED</span>
          </div>
        </section>

        <GameControls
          onDeposit={() => setDepositOpen(true)}
          onCashOut={() => void controller.prepareCashOut()}
          onSpin={() => void controller.spin()}
        />

        <nav className="secondary-nav" aria-label="Game information">
          <button
            type="button"
            onClick={() =>
              setActivePanel(activePanel === 'paytable' ? null : 'paytable')
            }
          >
            PAYTABLE
          </button>
          <button
            type="button"
            onClick={() =>
              setActivePanel(activePanel === 'rules' ? null : 'rules')
            }
          >
            GAME RULES
          </button>
          <button
            type="button"
            onClick={() =>
              setActivePanel(activePanel === 'history' ? null : 'history')
            }
          >
            HISTORY
          </button>
          <button
            type="button"
            onClick={() =>
              setActivePanel(activePanel === 'statistics' ? null : 'statistics')
            }
          >
            STATISTICS
          </button>
        </nav>
      </main>

      {activePanel === 'paytable' && (
        <PanelShell
          title="PAYTABLE"
          eyebrow="REWARD MATRIX"
          onClose={() => setActivePanel(null)}
        >
          <PaytablePanel onClose={() => setActivePanel(null)} />
        </PanelShell>
      )}

      {activePanel === 'rules' && (
        <PanelShell
          title="GAME RULES"
          eyebrow="SYSTEM BRIEF"
          onClose={() => setActivePanel(null)}
        >
          <GameRulesPanel onClose={() => setActivePanel(null)} />
        </PanelShell>
      )}

      {activePanel === 'history' && (
        <PanelShell
          title="HISTORY"
          eyebrow="SESSION MEMORY"
          onClose={() => setActivePanel(null)}
        >
          <HistoryPanel onClose={() => setActivePanel(null)} />
        </PanelShell>
      )}

      {activePanel === 'statistics' && (
        <PanelShell
          title="STATISTICS"
          eyebrow="DEVELOPER DIAGNOSTICS"
          onClose={() => setActivePanel(null)}
        >
          <StatisticsPanel onClose={() => setActivePanel(null)} />
        </PanelShell>
      )}

      {activePanel === 'settings' && (
        <PanelShell
          title="SETTINGS"
          eyebrow="NEURAL INTERFACE"
          onClose={() => setActivePanel(null)}
        >
          <SettingsPanel
            onClose={() => setActivePanel(null)}
            onToggleSound={controller.toggleSound}
            onVolumeChange={controller.changeVolume}
          />
        </PanelShell>
      )}

      <DepositModal
        open={depositOpen}
        onClose={() => setDepositOpen(false)}
        onDeposit={(amount) => void controller.depositCredits(amount)}
      />

      <CashOutModal
        open={cashOutOpen}
        receipt={cashOutReceipt}
        onCancel={controller.cancelCashOut}
        onConfirm={controller.confirmCashOut}
      />

      <Toast />
    </div>
  );
}
