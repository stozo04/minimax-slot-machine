import { useGameStore } from '../store/useGameStore';
import { formatCurrency, formatSignedCurrency } from '../utils/format';

interface HistoryPanelProps {
  onClose: () => void;
}

export function HistoryPanel({ onClose }: HistoryPanelProps) {
  const history = useGameStore((state) => state.history);
  const completedSessions = useGameStore((state) => state.completedSessions);

  return (
    <div className="panel-stack">
      <div className="panel-intro">
        <span className="eyebrow">LOCAL SESSION MEMORY</span>
        <h2>SPIN HISTORY</h2>
        <p>Recent outcomes are retained in this browser.</p>
      </div>

      {history.length === 0 ? (
        <div className="empty-state">No spins have been completed yet.</div>
      ) : (
        <div className="history-list">
          {history.slice(0, 20).map((entry) => {
            const result = entry.totalWinCents - entry.wagerCents;
            return (
              <article className="history-entry" key={entry.spinId}>
                <div className="history-meta">
                  <span>{new Date(entry.timestamp).toLocaleTimeString()}</span>
                  <strong className={result >= 0 ? 'positive' : 'negative'}>
                    {formatSignedCurrency(result)}
                  </strong>
                </div>
                <div className="mini-grid" aria-label="Displayed reel grid">
                  {entry.grid.map((reel, reelIndex) => (
                    <div className="mini-reel" key={reelIndex}>
                      {reel.map((symbol, row) => (
                        <span key={row}>{symbol.slice(0, 1)}</span>
                      ))}
                    </div>
                  ))}
                </div>
                <div className="history-footer">
                  <span>Wager {formatCurrency(entry.wagerCents)}</span>
                  <span>
                    {entry.wins.length} line win{entry.wins.length === 1 ? '' : 's'}
                  </span>
                  <strong>{formatCurrency(entry.totalWinCents)}</strong>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {completedSessions.length > 0 && (
        <>
          <div className="history-section-title">COMPLETED SESSIONS</div>
          {completedSessions.map((session) => (
            <div className="completed-session" key={session.id}>
              <span>{new Date(session.cashedOutAt).toLocaleDateString()}</span>
              <strong>{formatCurrency(session.finalBalanceCents)}</strong>
              <span className={session.sessionProfitCents >= 0 ? 'positive' : 'negative'}>
                {formatSignedCurrency(session.sessionProfitCents)}
              </span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
