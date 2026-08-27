import { formatIdr } from './dashboard-formatters';
import type { DashboardSummary } from './dashboard.types';

const flowDefinitions = [
  { key: 'monthlyIncome', label: 'Pemasukan', tone: 'income', sign: '+' },
  { key: 'monthlyExpense', label: 'Pengeluaran', tone: 'expense', sign: '−' },
  { key: 'netSaving', label: 'Net saving', tone: 'net', sign: '=' },
] as const;

export function SummaryCards({ summary }: { summary: DashboardSummary }) {
  return (
    <section className="flow-ledger" aria-labelledby="ledger-title">
      <header className="ledger-balance">
        <div>
          <p className="section-kicker">Posisi saat ini</p>
          <h2 id="ledger-title">Total saldo</h2>
        </div>
        <p className="ledger-primary-value">
          {formatIdr(summary.totalBalance)}
        </p>
        <p className="ledger-caption">Saldo seluruh account aktif</p>
      </header>
      <div className="ledger-flow" aria-label="Aliran keuangan periode ini">
        {flowDefinitions.map(({ key, label, tone, sign }) => (
          <article className={`ledger-metric ledger-${tone}`} key={key}>
            <span className="ledger-sign" aria-hidden="true">
              {sign}
            </span>
            <div>
              <h3>{label}</h3>
              <p className="ledger-value">{formatIdr(summary[key])}</p>
              <Comparison
                value={
                  key === 'monthlyIncome'
                    ? summary.incomeComparison.percentageChange
                    : key === 'monthlyExpense'
                      ? summary.expenseComparison.percentageChange
                      : summary.netSavingComparison.percentageChange
                }
              />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Comparison({ value }: { value: string | null }) {
  if (value === null)
    return <p className="summary-caption">Belum ada pembanding</p>;
  const isDecrease = value.startsWith('-');
  const visibleValue = value.replace(/^-/, '');

  return (
    <p className="summary-caption">
      <span aria-hidden="true">{isDecrease ? '↓' : '↑'}</span> {visibleValue}%
      dari bulan lalu
    </p>
  );
}
