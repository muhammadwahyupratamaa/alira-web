import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { getAccounts } from '../accounts/account.api';
import { formatIdr } from './dashboard-formatters';
import { WalletIcon } from './dashboard-icons';

export function AccountOverview() {
  const accounts = useQuery({ queryKey: ['accounts'], queryFn: getAccounts });
  const activeAccounts = accounts.data?.filter((account) => account.isActive);

  return (
    <section
      className="content-card dashboard-accounts"
      aria-labelledby="accounts-title"
    >
      <header className="section-heading">
        <div>
          <p className="section-kicker">Sumber dana</p>
          <h2 id="accounts-title">Account aktif</h2>
        </div>
        <Link className="section-link" to="/accounts">
          Lihat semua
        </Link>
      </header>
      {accounts.isPending ? (
        <div
          className="dashboard-accounts-loading"
          role="status"
          aria-label="Memuat account"
        />
      ) : null}
      {accounts.isError ? (
        <p className="compact-message">Account belum dapat dimuat.</p>
      ) : null}
      {activeAccounts?.length === 0 ? (
        <div className="compact-empty dashboard-accounts-empty">
          <p>Belum ada account aktif.</p>
          <span>Tambahkan account untuk mulai mencatat transaksi.</span>
        </div>
      ) : null}
      {activeAccounts && activeAccounts.length > 0 ? (
        <ul className="dashboard-account-list">
          {activeAccounts.slice(0, 3).map((account) => (
            <li key={account.id}>
              <span className="account-type-mark" aria-hidden="true">
                <WalletIcon />
              </span>
              <Link to={`/accounts/${account.id}`}>
                <strong>{account.name}</strong>
                <span>
                  {account.type === 'EWALLET' ? 'E-Wallet' : account.type}
                </span>
              </Link>
              <strong>{formatIdr(account.currentBalance)}</strong>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
