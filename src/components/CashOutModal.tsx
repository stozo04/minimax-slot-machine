import { Modal } from './Modal';
import type { CashOutReceipt } from '../game/types';
import { formatCurrency, formatSignedCurrency } from '../utils/format';

interface CashOutModalProps {
  open: boolean;
  receipt: CashOutReceipt | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export function CashOutModal({
  open,
  receipt,
  onCancel,
  onConfirm,
}: CashOutModalProps) {
  return (
    <Modal open={open} onClose={onCancel} titleId="cashout-title" className="cashout-modal">
      <div className="receipt-scanline" aria-hidden="true" />
      <div className="modal-heading">
        <span className="eyebrow">HOLOGRAPHIC CREDIT TRANSFER</span>
        <h2 id="cashout-title">CASH OUT</h2>
        <p>
          This transfers only fictional credits to your local session history.
          No real money is transferred.
        </p>
      </div>

      {receipt && (
        <div className="cashout-receipt" role="status">
          <div className="receipt-row">
            <span>FINAL VIRTUAL BALANCE</span>
            <strong>{formatCurrency(receipt.finalBalanceCents)}</strong>
          </div>
          <div className="receipt-row">
            <span>SESSION RESULT</span>
            <strong className={receipt.sessionProfitCents >= 0 ? 'positive' : 'negative'}>
              {formatSignedCurrency(receipt.sessionProfitCents)}
            </strong>
          </div>
          <div className="receipt-row">
            <span>SPINS COMPLETED</span>
            <strong>{receipt.spinCount}</strong>
          </div>
          <div className="receipt-row">
            <span>RECEIPT</span>
            <strong className="receipt-code">{receipt.receiptId}</strong>
          </div>
        </div>
      )}

      <div className="modal-actions">
        <button type="button" className="secondary-button" onClick={onCancel}>
          CANCEL
        </button>
        <button
          type="button"
          className="primary-button"
          onClick={onConfirm}
          disabled={!receipt}
        >
          CONFIRM TRANSFER & RESET
        </button>
      </div>
    </Modal>
  );
}
