import { useMutation } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';

import { createTransaction } from './transaction.api';
import { getTransactionErrorMessage } from './transaction-error';
import { TransactionForm } from './transaction-form';
import type { TransactionFormValues } from './transaction.schemas';
import { useTransactionInvalidation } from './use-transaction-invalidation';

export function QuickAddDialog({
  timezone,
  onClose,
}: {
  timezone: string;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLElement>(null);
  const invalidate = useTransactionInvalidation();
  const [error, setError] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: createTransaction,
    onSuccess: async () => {
      await invalidate();
      onClose();
    },
    onError: (caught) => {
      setError(getTransactionErrorMessage(caught));
    },
  });

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    dialogRef.current
      ?.querySelector<HTMLInputElement>('#transaction-amount')
      ?.focus();
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !mutation.isPending) onClose();
      if (event.key !== 'Tab') return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'input, button:not(:disabled), [role="combobox"]',
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
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
  }, [mutation.isPending, onClose]);

  async function submit(values: TransactionFormValues) {
    setError(null);
    return mutation
      .mutateAsync({ ...values, note: values.note || null })
      .then(() => true)
      .catch(() => false);
  }

  return (
    <div
      className="dialog-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !mutation.isPending)
          onClose();
      }}
    >
      <section
        ref={dialogRef}
        className="confirm-dialog quick-add-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-add-title"
      >
        <button
          className="dialog-close"
          type="button"
          disabled={mutation.isPending}
          onClick={onClose}
          aria-label="Tutup tambah transaksi"
        >
          ×
        </button>
        <p className="section-kicker">Quick Add</p>
        <h2 id="quick-add-title">Tambah transaksi</h2>
        <p>Catat pemasukan atau pengeluaran tanpa meninggalkan Dashboard.</p>
        <TransactionForm
          timezone={timezone}
          pending={mutation.isPending}
          error={error}
          onSubmit={submit}
        />
      </section>
    </div>
  );
}
