import { useEffect, useRef, useState } from 'react';
import { formatCurrency } from '../utils/format';

interface WinDisplayProps {
  amountCents: number;
  lineCount: number;
}

export function WinDisplay({ amountCents, lineCount }: WinDisplayProps) {
  const [displayAmount, setDisplayAmount] = useState(0);
  const previousAmount = useRef(0);

  useEffect(() => {
    const from = previousAmount.current;
    const to = amountCents;
    const startedAt = performance.now();
    const duration = 900;
    let frame = 0;

    const animate = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayAmount(Math.round(from + (to - from) * eased));

      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      } else {
        previousAmount.current = to;
      }
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [amountCents]);

  return (
    <div className="win-display" role="status" aria-live="polite">
      <span className="win-eyebrow">
        {lineCount} WINNING {lineCount === 1 ? 'LINE' : 'LINES'}
      </span>
      <strong>{formatCurrency(displayAmount)}</strong>
      <span className="win-subline">VIRTUAL PAYOUT</span>
    </div>
  );
}
