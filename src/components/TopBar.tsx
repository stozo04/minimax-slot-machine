import { useGameStore } from '../store/useGameStore';
import { formatCurrency, formatSignedCurrency } from '../utils/format';

interface TopBarProps {
  onToggleSound: () => void;
  onVolumeChange: (volume: number) => void;
  onOpenSettings: () => void;
}

export function TopBar({
  onToggleSound,
  onVolumeChange,
  onOpenSettings,
}: TopBarProps) {
  const wallet = useGameStore((state) => state.wallet);
  const settings = useGameStore((state) => state.settings);
  const profit = wallet.totalWinningsCents - wallet.totalWageredCents;

  return (
    <header className="top-bar">
      <div className="brand-lockup" aria-label="Neural Jackpot: The AI Wars">
        <div className="brand-mark" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div>
          <div className="brand-title">NEURAL JACKPOT</div>
          <div className="brand-subtitle">THE AI WARS</div>
        </div>
      </div>

      <div className="top-metrics">
        <div className="metric-chip">
          <span className="metric-label">VIRTUAL BALANCE</span>
          <strong>{formatCurrency(wallet.availableCents)}</strong>
        </div>
        <div className="metric-chip">
          <span className="metric-label">SESSION P/L</span>
          <strong className={profit >= 0 ? 'positive' : 'negative'}>
            {formatSignedCurrency(profit)}
          </strong>
        </div>
      </div>

      <div className="top-actions">
        <div className="sound-control">
          <button
            type="button"
            className="utility-button"
            onClick={onToggleSound}
            aria-pressed={!settings.muted}
          >
            <span className="sound-bars" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            {settings.muted ? 'MUTED' : 'SOUND'}
          </button>
          <input
            className="volume-slider"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={settings.volume}
            onChange={(event) => onVolumeChange(Number(event.target.value))}
            aria-label="Sound volume"
            disabled={settings.muted}
          />
        </div>
        <button
          type="button"
          className="utility-button"
          onClick={onOpenSettings}
        >
          SETTINGS
        </button>
      </div>
    </header>
  );
}
