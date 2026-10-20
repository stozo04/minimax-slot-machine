interface GameRulesPanelProps {
  onClose: () => void;
}

export function GameRulesPanel({ onClose }: GameRulesPanelProps) {
  return (
    <div className="panel-stack rules-copy">
      <div className="panel-intro">
        <span className="eyebrow">SYSTEM BRIEF</span>
        <h2>GAME RULES</h2>
        <p>
          Neural Jackpot is a five-reel, three-row, 20-line video slot with
          simulated money only.
        </p>
      </div>

      <ol className="rules-list">
        <li>
          Deposit fictional credits. The player begins with a zero balance.
        </li>
        <li>
          The total wager equals denomination × multiplier × 20 active lines.
        </li>
        <li>
          Winning symbols must begin on the leftmost reel and continue on
          consecutive reels. Blank symbols never pay.
        </li>
        <li>
          Each payline awards only its highest 3, 4, or 5-symbol result.
          Different paylines can win on the same spin, including overlapping
          combinations.
        </li>
        <li>
          The mathematical outcome is selected before the reels move. Animation
          cannot change the result.
        </li>
        <li>
          There are no wilds, scatters, bonus games, or balance-dependent odds.
        </li>
        <li>
          Cash Out creates a local receipt and resets the active virtual
          balance after confirmation. No real funds are transferred.
        </li>
      </ol>

      <div className="rules-note">
        Press <kbd>Space</kbd> to spin when focus is not on another control.
        Reduced-motion and sound settings are available from Settings.
      </div>
    </div>
  );
}
