import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { AppLayout } from '../dashboard/app-layout';
import { formatIdr } from '../dashboard/dashboard-formatters';
import { PlusIcon, WalletIcon } from '../dashboard/dashboard-icons';
import { deactivateAccount, getAccounts } from './account.api';
import { getAccountErrorMessage } from './account-error';
import { AccountSkeleton } from './account-skeleton';
import type { Account, AccountType } from './account.types';
import { DeactivateDialog } from './deactivate-dialog';

const typeLabels: Record<AccountType, string> = {
  BANK: 'Bank',
  CASH: 'Cash',
  EWALLET: 'E-Wallet',
};

export function AccountsPage() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [deactivateError, setDeactivateError] = useState<string | null>(null);
  const accounts = useQuery({ queryKey: ['accounts'], queryFn: getAccounts });
  const deactivate = useMutation({
    mutationFn: (id: string) => deactivateAccount(id),
    onSuccess: async () => {
      setSelectedAccount(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['accounts'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      ]);
    },
    onError: (error) => {
      setDeactivateError(getAccountErrorMessage(error));
    },
  });
  const successMessage = (location.state as { success?: unknown } | null)
    ?.success;

  return (
    <AppLayout>
      <main className="dashboard-content account-content">
        <header className="dashboard-heading account-heading">
          <div>
            <p className="section-kicker">Kelola sumber dana</p>
            <h1>Account</h1>
            <p>Lihat saldo berjalan dan kelola tempat uangmu tersimpan.</p>
          </div>
          <Link className="primary-link" to="/accounts/new">
            <PlusIcon />
            Tambah account
          </Link>
        </header>
        {typeof successMessage === 'string' ? (
          <p className="form-success" role="status">
            {successMessage}
          </p>
        ) : null}
        {accounts.isPending ? <AccountSkeleton /> : null}
        {accounts.isError ? (
          <section className="dashboard-error" role="alert">
            <span className="error-symbol" aria-hidden="true">
              !
            </span>
            <div>
              <h2>Account belum dapat dimuat</h2>
              <p>{getAccountErrorMessage(accounts.error)}</p>
            </div>
            <button
              className="secondary-button"
              type="button"
              disabled={accounts.isRefetching}
              onClick={() => void accounts.refetch()}
            >
              {accounts.isRefetching ? 'Mencoba…' : 'Coba lagi'}
            </button>
          </section>
        ) : null}
        {accounts.data?.length === 0 ? (
          <section
            className="dashboard-empty account-empty"
            aria-labelledby="account-empty-title"
          >
            <span className="empty-orbit" aria-hidden="true">
              <WalletIcon />
            </span>
            <p className="section-kicker">Account pertama</p>
            <h2 id="account-empty-title">
              Mulai dari tempat uangmu tersimpan.
            </h2>
            <p>Tambahkan bank, cash, atau e-wallet beserta saldo awalnya.</p>
            <Link className="primary-link" to="/accounts/new">
              <PlusIcon />
              Tambah account
            </Link>
          </section>
        ) : null}
        {accounts.data && accounts.data.length > 0 ? (
          <section aria-label="Daftar account">
            <div className="account-grid">
              {accounts.data.map((account) => (
                <AccountCard
                  key={account.id}
                  account={account}
                  onDeactivate={() => {
                    setDeactivateError(null);
                    setSelectedAccount(account);
                  }}
                />
              ))}
            </div>
          </section>
        ) : null}
      </main>
      {selectedAccount ? (
        <DeactivateDialog
          account={selectedAccount}
          isPending={deactivate.isPending}
          error={deactivateError}
          onCancel={() => {
            setSelectedAccount(null);
            setDeactivateError(null);
          }}
          onConfirm={() => {
            deactivate.mutate(selectedAccount.id);
          }}
        />
      ) : null}
    </AppLayout>
  );
}

function AccountCard({
  account,
  onDeactivate,
}: {
  account: Account;
  onDeactivate: () => void;
}) {
  return (
    <article
      className={`account-card${account.isActive ? '' : 'account-card-inactive'}`}
    >
      <header>
        <span className="account-type-mark" aria-hidden="true">
          <WalletIcon />
        </span>
        <div>
          <h2>{account.name}</h2>
          <p>{typeLabels[account.type]}</p>
        </div>
        <span
          className={`status-badge ${account.isActive ? 'status-active' : 'status-inactive'}`}
        >
          {account.isActive ? 'Aktif' : 'Nonaktif'}
        </span>
      </header>
      <dl>
        <div>
          <dt>Saldo berjalan</dt>
          <dd>{formatIdr(account.currentBalance)}</dd>
        </div>
        <div>
          <dt>Saldo awal</dt>
          <dd>{formatIdr(account.initialBalance)}</dd>
        </div>
      </dl>
      <footer>
        <Link className="secondary-link" to={`/accounts/${account.id}`}>
          Lihat detail
        </Link>
        {account.isActive ? (
          <button
            className="text-danger-button"
            type="button"
            onClick={onDeactivate}
          >
            Nonaktifkan
          </button>
        ) : (
          <span className="inactive-account-caption">
            Hanya untuk melihat riwayat
          </span>
        )}
      </footer>
    </article>
  );
}
