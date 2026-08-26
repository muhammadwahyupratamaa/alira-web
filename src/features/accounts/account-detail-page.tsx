import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { AppLayout } from '../dashboard/app-layout';
import { formatIdr } from '../dashboard/dashboard-formatters';
import { deactivateAccount, getAccount, updateAccount } from './account.api';
import { getAccountErrorMessage } from './account-error';
import { AccountForm } from './account-form';
import type { AccountFormValues } from './account.schemas';
import { DeactivateDialog } from './deactivate-dialog';

export function AccountDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showDeactivate, setShowDeactivate] = useState(false);
  const [deactivateError, setDeactivateError] = useState<string | null>(null);
  const account = useQuery({
    queryKey: ['accounts', id],
    queryFn: () => getAccount(id),
    enabled: Boolean(id),
  });
  const update = useMutation({
    mutationFn: (values: AccountFormValues) => updateAccount(id, values),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['accounts'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      ]);
      await navigate('/accounts', {
        replace: true,
        state: { success: 'Perubahan account berhasil disimpan.' },
      });
    },
    onError: (error) => {
      setServerError(getAccountErrorMessage(error));
    },
  });
  const deactivate = useMutation({
    mutationFn: () => deactivateAccount(id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['accounts'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      ]);
      await navigate('/accounts', {
        replace: true,
        state: { success: 'Account berhasil dinonaktifkan.' },
      });
    },
    onError: (error) => {
      setDeactivateError(getAccountErrorMessage(error));
    },
  });
  async function submit(values: AccountFormValues) {
    setServerError(null);
    await update.mutateAsync(values).catch(() => undefined);
  }

  return (
    <AppLayout>
      <main className="dashboard-content account-form-page">
        <Link className="back-link" to="/accounts">
          ← Kembali ke Account
        </Link>
        {account.isPending ? (
          <div
            className="skeleton account-detail-skeleton"
            role="status"
            aria-label="Memuat detail account"
          />
        ) : null}
        {account.isError ? (
          <section className="dashboard-error" role="alert">
            <span className="error-symbol" aria-hidden="true">
              !
            </span>
            <div>
              <h2>Detail account belum dapat dimuat</h2>
              <p>{getAccountErrorMessage(account.error)}</p>
            </div>
            <button
              className="secondary-button"
              type="button"
              onClick={() => void account.refetch()}
            >
              Coba lagi
            </button>
          </section>
        ) : null}
        {account.data ? (
          <section
            className="account-form-card"
            aria-labelledby="edit-account-title"
          >
            <div className="account-detail-heading">
              <div>
                <p className="section-kicker">Detail account</p>
                <h1 id="edit-account-title">{account.data.name}</h1>
              </div>
              <span
                className={`status-badge ${account.data.isActive ? 'status-active' : 'status-inactive'}`}
              >
                {account.data.isActive ? 'Aktif' : 'Nonaktif'}
              </span>
            </div>
            <div className="balance-highlight">
              <span>Saldo berjalan</span>
              <strong>{formatIdr(account.data.currentBalance)}</strong>
              <small>Dihitung dan dikelola oleh backend.</small>
            </div>
            <AccountForm
              account={account.data}
              isSubmitting={update.isPending}
              serverError={serverError}
              onSubmit={submit}
            />
            {account.data.isActive ? (
              <button
                className="text-danger-button deactivate-detail"
                type="button"
                onClick={() => {
                  setShowDeactivate(true);
                }}
              >
                Nonaktifkan account
              </button>
            ) : (
              <p className="inactive-notice">
                Account ini nonaktif dan tidak dapat digunakan untuk transaksi
                baru.
              </p>
            )}
          </section>
        ) : null}
      </main>
      {showDeactivate && account.data ? (
        <DeactivateDialog
          account={account.data}
          isPending={deactivate.isPending}
          error={deactivateError}
          onCancel={() => {
            setShowDeactivate(false);
            setDeactivateError(null);
          }}
          onConfirm={() => {
            deactivate.mutate();
          }}
        />
      ) : null}
    </AppLayout>
  );
}
