import { soundManager } from '../audio/SoundManager';
import {
  BET_MULTIPLIERS,
  DENOMINATIONS_CENTS,
  calculateTotalWagerCents,
} from '../game/config';
import { useGameStore } from '../store/useGameStore';
import { formatCurrency } from '../utils/format';

interface GameControlsProps {
  onDeposit: () => void;
  onCashOut: () => void;
  onSpin: () => void;
}

export function GameControls({
  onDeposit,
  onCashOut,
  onSpin,
}: GameControlsProps) {
  const wallet = useGameStore((state) => state.wallet);
  const settings = useGameStore((state) => state.settings);
  const phase = useGameStore((state) => state.phase);
  const cashOutOpen = useGameStore((state) => state.cashOutOpen);
  const setSettings = useGameStore((state) => state.setSettings);

  const totalWager = calculateTotalWagerCents(
    settings.denominationCents,
    settings.multiplier,
  );
  const controlsLocked = phase !== 'IDLE' || cashOutOpen;
  const canSpin =
    phase === 'IDLE' && !cashOutOpen && wallet.availableCents >= totalWager;

  const updateDenomination = (value: number) => {
    if (controlsLocked) return;
    soundManager.click();
    setSettings({ denominationCents: value });
  };

  const updateMultiplier = (value: number) => {
    if (controlsLocked) return;
    soundManager.click();
    setSettings({ multiplier: value });
  };

  return (
    <section className="control-console glass-panel" aria-label="Betting controls">
      <div className="console-section deposit-section">
        <button
          type="button"
          className="deposit-button"
          onClick={() => {
            void soundManager.unlock();
            onDeposit();
          }}
        >
          <span className="button-glow" aria-hidden="true" />
          DEPOSIT CREDITS
          <small>FICTIONAL BALANCE</small>
        </button>
        <button
          type="button"
          className="cashout-button"
          onClick={onCashOut}
          disabled={phase !== 'IDLE' || wallet.availableCents <= 0}
        >
          CASH OUT
        </button>
      </div>

      <div className="console-section selector-section">
        <div className="selector-group">
          <span className="console-label">DENOMINATION</span>
          <div className="segmented-control" role="group" aria-label="Denomination">
            {DENOMINATIONS_CENTS.map((denomination) => (
              <button
                key={denomination}
                type="button"
                className={
                  settings.denominationCents === denomination ? 'active' : ''
                }
                onClick={() => updateDenomination(denomination)}
                disabled={controlsLocked}
                aria-pressed={settings.denominationCents === denomination}
              >
                ${denomination / 100}
              </button>
            ))}
          </div>
        </div>

        <div className="selector-group">
          <span className="console-label">BET MULTIPLIER</span>
          <div className="segmented-control multiplier" role="group" aria-label="Bet multiplier">
            {BET_MULTIPLIERS.map((multiplier) => (
              <button
                key={multiplier}
                type="button"
                className={settings.multiplier === multiplier ? 'active' : ''}
                onClick={() => updateMultiplier(multiplier)}
                disabled={controlsLocked}
                aria-pressed={settings.multiplier === multiplier}
              >
                {multiplier === 10 ? 'MAX BET 10x' : `${multiplier}x`}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="console-section wager-section">
        <span className="console-label">TOTAL BET · 20 LINES</span>
        <strong className="wager-value">{formatCurrency(totalWager)}</strong>
        <span className="per-line-copy">
          {formatCurrency(totalWager / 20)} per line
        </span>
      </div>

      <div className="console-section spin-section">
        <button
          type="button"
          className="spin-button"
          onClick={onSpin}
          disabled={!canSpin}
          aria-label="Spin the reels"
        >
          <span className="spin-ring" aria-hidden="true" />
          <span className="spin-core">
            <small>SPACE</small>
            SPIN
          </span>
        </button>
        <div className="spin-status" aria-live="polite">
          {phase === 'SPINNING'
            ? 'Reels in motion'
            : phase === 'EVALUATING'
              ? 'Validating outcome'
              : phase === 'PAYOUT'
                ? 'Crediting payout'
                : !canSpin && wallet.availableCents < totalWager
                  ? 'Deposit more virtual credits'
                  : 'Ready'}
        </div>
      </div>
    </section>
  );
}
