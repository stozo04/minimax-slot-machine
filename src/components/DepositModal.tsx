import { Modal } from './Modal';
import { formatCurrency } from '../utils/format';

interface DepositModalProps {
  open: boolean;
  onClose: () => void;
  onDeposit: (amountCents: number) => void;
}

const depositOptions = [10000, 50000, 100000, 500000];

export function DepositModal({
  open,
  onClose,
  onDeposit,
}: DepositModalProps) {
  return (
    <Modal open={open} onClose={onClose} titleId="deposit-title">
      <div className="modal-heading">
        <span className="eyebrow">VIRTUAL CREDIT SYSTEM</span>
        <h2 id="deposit-title">DEPOSIT CREDITS</h2>
        <p>
          Add fictional credits to this session. No purchase, deposit, payment,
          or withdrawal is involved.
        </p>
      </div>

      <div className="deposit-options">
        {depositOptions.map((amount) => (
          <button
            type="button"
            key={amount}
            className="deposit-option"
            onClick={() => onDeposit(amount)}
          >
            <span>{formatCurrency(amount)}</span>
            <small>ADD VIRTUAL CREDITS</small>
          </button>
        ))}
      </div>

      <div className="modal-disclaimer">
        <span className="disclaimer-line" />
        SIMULATED MONEY ONLY · NO REAL FUNDS
        <span className="disclaimer-line" />
      </div>
    </Modal>
  );
}
