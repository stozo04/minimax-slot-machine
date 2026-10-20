import { useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';

export function Toast() {
  const toast = useGameStore((state) => state.toast);
  const clearToast = useGameStore((state) => state.clearToast);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => clearToast(toast.id), 4200);
    return () => window.clearTimeout(timeout);
  }, [toast, clearToast]);

  if (!toast) return null;

  return (
    <div
      className={`toast toast-${toast.tone}`}
      role="status"
      aria-live="polite"
    >
      <span className="toast-indicator" aria-hidden="true" />
      {toast.message}
    </div>
  );
}
