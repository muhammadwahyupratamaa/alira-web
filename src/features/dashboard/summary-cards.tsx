import { formatIdr } from './dashboard-formatters';
import type { DashboardSummary } from './dashboard.types';

const cardDefinitions = [
  { key: 'totalBalance', label: 'Total saldo', tone: 'balance' },
  { key: 'monthlyIncome', label: 'Pemasukan', tone: 'income' },
  { key: 'monthlyExpense', label: 'Pengeluaran', tone: 'expense' },
] as const;

export function SummaryCards({ summary }: { summary: DashboardSummary }) {
  return (
    <section className="summary-grid" aria-label="Ringkasan keuangan">
      {cardDefinitions.map(({ key, label, tone }) => (
        <article className={`summary-card summary-${tone}`} key={key}>
          <div className="summary-card-heading">
            <span className="summary-mark" aria-hidden="true" />
            <h2>{label}</h2>
          </div>
          <p className="summary-value">{formatIdr(summary[key])}</p>
          {key === 'totalBalance' ? (
            <p className="summary-caption">Saldo seluruh account aktif</p>
          ) : (
            <Comparison
              value={
                key === 'monthlyIncome'
                  ? summary.incomeComparison.percentageChange
                  : summary.expenseComparison.percentageChange
              }
            />
          )}
        </article>
      ))}
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
