import { formatFinancialDate, formatIdr } from './dashboard-formatters';
import type { RecentTransaction } from './dashboard.types';

export function RecentTransactions({
  transactions,
  timezone,
}: {
  transactions: RecentTransaction[];
  timezone: string;
}) {
  return (
    <section
      className="content-card transactions-card"
      aria-labelledby="recent-title"
    >
      <header className="section-heading">
        <div>
          <p className="section-kicker">Aktivitas</p>
          <h2 id="recent-title">Transaksi terbaru</h2>
        </div>
        <span className="section-meta">5 terakhir</span>
      </header>
      {transactions.length === 0 ? (
        <div className="compact-empty">
          <p>Belum ada transaksi.</p>
          <span>Mulai catat pemasukan atau pengeluaran pertamamu.</span>
        </div>
      ) : (
        <ul className="transaction-list">
          {transactions.map((transaction) => {
            const isIncome = transaction.type === 'INCOME';
            return (
              <li key={transaction.id}>
                <span
                  className={`transaction-icon ${isIncome ? 'transaction-income' : 'transaction-expense'}`}
                  aria-hidden="true"
                >
                  {isIncome ? '↙' : '↗'}
                </span>
                <div className="transaction-main">
                  <strong>{transaction.category.name}</strong>
                  <span>
                    {transaction.account.name} ·{' '}
                    {formatFinancialDate(transaction.transactionDate, timezone)}
                  </span>
                  {typeof transaction.note === 'string' && transaction.note ? (
                    <small className="transaction-note">
                      {transaction.note}
                    </small>
                  ) : null}
                </div>
                <div className="transaction-amount">
                  <strong>
                    {isIncome ? '+' : '−'}
                    {formatIdr(transaction.amount)}
                  </strong>
                  <span>{isIncome ? 'Pemasukan' : 'Pengeluaran'}</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
