import type { ReactNode } from 'react';

interface PanelShellProps {
  title: string;
  eyebrow: string;
  onClose: () => void;
  children: ReactNode;
}

export function PanelShell({
  title,
  eyebrow,
  onClose,
  children,
}: PanelShellProps) {
  return (
    <aside className="side-panel glass-panel" aria-label={title}>
      <div className="panel-header">
        <div>
          <span className="eyebrow">{eyebrow}</span>
          <h2>{title}</h2>
        </div>
        <button
          type="button"
          className="panel-close"
          onClick={onClose}
          aria-label="Close panel"
        >
          CLOSE
        </button>
      </div>
      <div className="panel-content">{children}</div>
    </aside>
  );
}
