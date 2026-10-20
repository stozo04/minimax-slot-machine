import { useEffect, useRef, useState } from 'react';
import {
  SYMBOL_DISPLAY_NAMES,
  SYMBOL_WEIGHTS,
} from '../game/config';
import { THEORETICAL_RTP } from '../game/ProbabilityEngine';
import type { SimulationResult } from '../game/simulation';
import { useGameStore } from '../store/useGameStore';
import { formatCurrency, formatSignedCurrency } from '../utils/format';

interface StatisticsPanelProps {
  onClose: () => void;
}

export function StatisticsPanel({ onClose }: StatisticsPanelProps) {
  const wallet = useGameStore((state) => state.wallet);
  const history = useGameStore((state) => state.history);
  const [simulation, setSimulation] = useState<SimulationResult | null>(null);
  const [running, setRunning] = useState(false);
  const [simulationError, setSimulationError] = useState<string | null>(null);
  const workerRef = useRef<Worker | null>(null);

  useEffect(
    () => () => {
      workerRef.current?.terminate();
    },
    [],
  );

  const runSimulation = () => {
    workerRef.current?.terminate();
    setRunning(true);
    setSimulationError(null);

    const worker = new Worker(
      new URL('../workers/simulation.worker.ts', import.meta.url),
      { type: 'module' },
    );
    workerRef.current = worker;

    worker.onmessage = (
      event: MessageEvent<
        SimulationResult | { error: string }
      >,
    ) => {
      if ('error' in event.data) {
        setSimulationError(event.data.error);
      } else {
        setSimulation(event.data);
      }
      setRunning(false);
      worker.terminate();
      workerRef.current = null;
    };

    worker.onerror = () => {
      setSimulationError('The diagnostics worker could not be started.');
      setRunning(false);
      worker.terminate();
      workerRef.current = null;
    };

    worker.postMessage({ spins: 1_000_000, seed: 2049 });
  };

  const hits = history.filter((entry) => entry.totalWinCents > 0).length;
  const hitRate = history.length > 0 ? hits / history.length : 0;
  const profit = wallet.totalWinningsCents - wallet.totalWageredCents;

  return (
    <div className="panel-stack">
      <div className="panel-intro">
        <span className="eyebrow">DEVELOPER DIAGNOSTICS</span>
        <h2>STATISTICS</h2>
        <p>
          Session accounting and independently derived probability diagnostics.
        </p>
      </div>

      <div className="stats-grid">
        <div>
          <span>SPINS</span>
          <strong>{history.length}</strong>
        </div>
        <div>
          <span>HIT RATE</span>
          <strong>{(hitRate * 100).toFixed(2)}%</strong>
        </div>
        <div>
          <span>TOTAL WAGERED</span>
          <strong>{formatCurrency(wallet.totalWageredCents)}</strong>
        </div>
        <div>
          <span>TOTAL WON</span>
          <strong>{formatCurrency(wallet.totalWinningsCents)}</strong>
        </div>
        <div>
          <span>SESSION P/L</span>
          <strong className={profit >= 0 ? 'positive' : 'negative'}>
            {formatSignedCurrency(profit)}
          </strong>
        </div>
        <div>
          <span>LAST WIN</span>
          <strong>{formatCurrency(wallet.lastWinCents)}</strong>
        </div>
      </div>

      <div className="diagnostic-card">
        <span className="console-label">CONFIGURED SYMBOL FREQUENCY</span>
        <div className="frequency-list">
          {Object.entries(SYMBOL_WEIGHTS).map(([symbol, weight]) => (
            <div key={symbol}>
              <span>{SYMBOL_DISPLAY_NAMES[symbol as keyof typeof SYMBOL_DISPLAY_NAMES]}</span>
              <div className="frequency-track">
                <i style={{ width: `${weight * 2.5}%` }} />
              </div>
              <strong>{weight}%</strong>
            </div>
          ))}
        </div>
      </div>

      <div className="diagnostic-card">
        <span className="console-label">PROBABILITY VALIDATION</span>
        <div className="diagnostic-primary">
          <span>THEORETICAL RTP</span>
          <strong>{(THEORETICAL_RTP * 100).toFixed(6)}%</strong>
        </div>
        <p>
          This value is calculated from exact strip frequencies and all 20
          paylines, not inferred from the initial weights.
        </p>
        <button
          type="button"
          className="secondary-button diagnostic-button"
          onClick={runSimulation}
          disabled={running}
        >
          {running ? 'SIMULATING 1,000,000 SPINS…' : 'RUN 1,000,000-SPIN TEST'}
        </button>

        {simulationError && (
          <div className="diagnostic-error">{simulationError}</div>
        )}

        {simulation && (
          <div className="simulation-results">
            <div>
              <span>EMPIRICAL RTP</span>
              <strong>{(simulation.empiricalRtp * 100).toFixed(4)}%</strong>
            </div>
            <div>
              <span>95% CI</span>
              <strong>
                {(simulation.confidenceInterval95[0] * 100).toFixed(3)}–
                {(simulation.confidenceInterval95[1] * 100).toFixed(3)}%
              </strong>
            </div>
            <div>
              <span>HIT FREQUENCY</span>
              <strong>{(simulation.hitFrequency * 100).toFixed(3)}%</strong>
            </div>
            <div>
              <span>MAX PAYOUT</span>
              <strong>
                {simulation.maximumPayoutMultiplier.toFixed(2)}x wager
              </strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
