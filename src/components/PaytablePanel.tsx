import { ASSET_URLS, PAYTABLE, SYMBOL_DISPLAY_NAMES } from '../game/config';
import { THEORETICAL_RTP } from '../game/ProbabilityEngine';
import type { PayingSymbolId } from '../game/types';

interface PaytablePanelProps {
  onClose: () => void;
}

export function PaytablePanel({ onClose }: PaytablePanelProps) {
  return (
    <div className="panel-stack">
      <div className="panel-intro">
        <span className="eyebrow">20 FIXED PAYLINES</span>
        <h2>PAYTABLE</h2>
        <p>
          Values are multipliers of the wager on each active line. A line pays
          once, at the highest matching count from three to five.
        </p>
      </div>

      <div className="paytable-grid paytable-header">
        <span>SYMBOL</span>
        <span>3</span>
        <span>4</span>
        <span>5</span>
      </div>

      {(Object.keys(PAYTABLE) as PayingSymbolId[]).map((symbol) => (
        <div className="paytable-grid paytable-row" key={symbol}>
          <div className="paytable-symbol">
            <img src={ASSET_URLS[symbol]} alt="" />
            <span>{SYMBOL_DISPLAY_NAMES[symbol]}</span>
          </div>
          <strong>{PAYTABLE[symbol][3]}x</strong>
          <strong>{PAYTABLE[symbol][4]}x</strong>
          <strong className="premium-pay">{PAYTABLE[symbol][5]}x</strong>
        </div>
      ))}

      <div className="rtp-card">
        <div>
          <span className="console-label">THEORETICAL RTP</span>
          <strong>{(THEORETICAL_RTP * 100).toFixed(4)}%</strong>
        </div>
        <p>
          Independently calculated from the configured reel strips and paytable.
          The displayed result is never adjusted for balance, losses, bet size,
          or prior spins.
        </p>
      </div>
    </div>
  );
}
