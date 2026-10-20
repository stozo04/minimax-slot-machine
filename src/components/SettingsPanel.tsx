import { useGameStore } from '../store/useGameStore';

interface SettingsPanelProps {
  onClose: () => void;
  onToggleSound: () => void;
  onVolumeChange: (volume: number) => void;
}

export function SettingsPanel({
  onClose,
  onToggleSound,
  onVolumeChange,
}: SettingsPanelProps) {
  const settings = useGameStore((state) => state.settings);
  const setSettings = useGameStore((state) => state.setSettings);

  return (
    <div className="panel-stack settings-panel">
      <div className="panel-intro">
        <span className="eyebrow">NEURAL INTERFACE</span>
        <h2>SETTINGS</h2>
        <p>Adjust presentation and accessibility. Gameplay odds never change.</p>
      </div>

      <div className="setting-row">
        <div>
          <strong>SOUND</strong>
          <span>Ambient machinery, reel motion, and payout tones.</span>
        </div>
        <button
          type="button"
          className={`toggle-switch ${!settings.muted ? 'active' : ''}`}
          onClick={onToggleSound}
          aria-pressed={!settings.muted}
        >
          <span />
          {settings.muted ? 'OFF' : 'ON'}
        </button>
      </div>

      <div className="setting-row stacked">
        <div>
          <strong>VOLUME</strong>
          <span>{Math.round(settings.volume * 100)}%</span>
        </div>
        <input
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

      <div className="setting-row">
        <div>
          <strong>REDUCED MOTION</strong>
          <span>Shortens reel movement and limits cinematic motion.</span>
        </div>
        <button
          type="button"
          className={`toggle-switch ${settings.reducedMotion ? 'active' : ''}`}
          onClick={() =>
            setSettings({ reducedMotion: !settings.reducedMotion })
          }
          aria-pressed={settings.reducedMotion}
        >
          <span />
          {settings.reducedMotion ? 'ON' : 'OFF'}
        </button>
      </div>

      <div className="settings-disclosure">
        <strong>SIMULATED MONEY</strong>
        <p>
          This game does not sell credits, accept deposits, process payments, or
          transfer real funds. All balances and receipts are fictional and
          stored locally in your browser.
        </p>
      </div>
    </div>
  );
}
