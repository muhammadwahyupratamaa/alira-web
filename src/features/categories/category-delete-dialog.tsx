import { useEffect, useRef } from 'react';

import type { Category } from './category.types';

export function CategoryDeleteDialog({
  category,
  pending,
  error,
  onCancel,
  onConfirm,
}: {
  category: Category;
  pending: boolean;
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
      if (event.key === 'Escape' && !pending) onCancel();
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
  }, [onCancel, pending]);
  return (
    <div
      className="dialog-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !pending) onCancel();
      }}
    >
      <section
        ref={dialogRef}
        className="confirm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-category-title"
        aria-describedby="delete-category-description"
      >
        <p className="section-kicker">Konfirmasi</p>
        <h2 id="delete-category-title">Nonaktifkan {category.name}?</h2>
        <p id="delete-category-description">
          Kategori tidak dapat dipakai untuk transaksi baru. Jika sudah
          digunakan, kategori tetap tersimpan pada riwayat transaksi lama.
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
            disabled={pending}
            onClick={onCancel}
          >
            Batal
          </button>
          <button
            className="danger-button"
            type="button"
            disabled={pending}
            onClick={onConfirm}
          >
            {pending ? 'Menonaktifkan…' : 'Ya, nonaktifkan'}
          </button>
        </div>
      </section>
    </div>
  );
}
