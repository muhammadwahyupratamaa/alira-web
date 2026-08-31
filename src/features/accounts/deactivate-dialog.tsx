import { useEffect, useRef } from 'react';

import type { Account } from './account.types';

export function DeactivateDialog({
  account,
  isPending,
  error,
  onCancel,
  onConfirm,
}: {
  account: Account;
  isPending: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    cancelRef.current?.focus();
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !isPending) onCancel();
      if (event.key !== 'Tab') return;
      const buttons = dialogRef.current?.querySelectorAll<HTMLButtonElement>(
        'button:not(:disabled)',
      );
      if (!buttons?.length) return;
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus();
    };
  }, [isPending, onCancel]);

  return (
    <div
      className="dialog-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isPending) onCancel();
      }}
    >
      <section
        ref={dialogRef}
        className="confirm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="deactivate-title"
        aria-describedby="deactivate-description"
      >
        <p className="section-kicker">Konfirmasi</p>
        <h2 id="deactivate-title">Nonaktifkan {account.name}?</h2>
        <p id="deactivate-description">
          Account tidak dapat dipakai untuk transaksi baru dan akan ditampilkan
          sebagai nonaktif. Riwayat transaksi serta saldo tetap tersimpan.
        </p>
        {error ? (
          <p className="form-alert" role="alert">
            {error}
          </p>
        ) : null}
        <div className="dialog-actions">
          <button
            ref={cancelRef}
            className="secondary-button"
            type="button"
            disabled={isPending}
            onClick={onCancel}
          >
            Batal
          </button>
          <button
            className="danger-button"
            type="button"
            disabled={isPending}
            onClick={onConfirm}
          >
            {isPending ? 'Menonaktifkan…' : 'Ya, nonaktifkan'}
          </button>
        </div>
      </section>
    </div>
  );
}
