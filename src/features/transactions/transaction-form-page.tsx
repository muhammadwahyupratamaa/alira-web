import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '../dashboard/app-layout';
import { useAuth } from '../auth/use-auth';
import {
  createTransaction,
  getTransaction,
  updateTransaction,
} from './transaction.api';
import { getTransactionErrorMessage } from './transaction-error';
import { TransactionForm } from './transaction-form';
import type { TransactionFormValues } from './transaction.schemas';
import { useTransactionInvalidation } from './use-transaction-invalidation';

export function TransactionFormPage() {
  const { id } = useParams();
  const editing = Boolean(id);
  const { user } = useAuth();
  const navigate = useNavigate();
  const invalidate = useTransactionInvalidation();
  const [error, setError] = useState<string | null>(null);
  const detail = useQuery({
    queryKey: ['transactions', 'detail', id],
    queryFn: () => getTransaction(id ?? ''),
    enabled: editing,
  });
  const mutation = useMutation({
    mutationFn: (input: Parameters<typeof createTransaction>[0]) =>
      id ? updateTransaction(id, input) : createTransaction(input),
    onSuccess: async () => {
      await invalidate();
      await navigate('/transactions', { replace: true });
    },
    onError: (caught) => {
      setError(getTransactionErrorMessage(caught));
    },
  });
  async function submit(values: TransactionFormValues) {
    setError(null);
    await mutation
      .mutateAsync({ ...values, note: values.note || null })
      .catch(() => undefined);
  }
  return (
    <AppLayout>
      <main className="dashboard-content account-form-page">
        <Link className="back-link" to="/transactions">
          ← Kembali ke Transaksi
        </Link>
        {detail.isPending && editing ? (
          <div
            className="skeleton account-detail-skeleton"
            role="status"
            aria-label="Memuat detail transaksi"
          />
        ) : null}
        {detail.isError ? (
          <p className="form-alert" role="alert">
            {getTransactionErrorMessage(detail.error)}
          </p>
        ) : null}
        {!editing || detail.data ? (
          <section className="account-form-card">
            <p className="section-kicker">
              {editing ? 'Detail transaksi' : 'Quick Add'}
            </p>
            <h1>{editing ? 'Ubah transaksi' : 'Tambah transaksi'}</h1>
            <p>Saldo dan statistik akan dihitung ulang oleh backend.</p>
            <TransactionForm
              transaction={detail.data}
              timezone={user?.timezone ?? 'Asia/Jakarta'}
              pending={mutation.isPending}
              error={error}
              onSubmit={submit}
            />
          </section>
        ) : null}
      </main>
    </AppLayout>
  );
}
