import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  type ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

import { ApiError } from '../../lib/api/api-client';
import {
  formatCashFlowLabel,
  formatIdr,
  isZeroDecimal,
} from './dashboard-formatters';
import type { CashFlowResponse } from './dashboard.types';

ChartJS.register(
  CategoryScale,
  Filler,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
);

export function CashFlowChart({
  cashFlow,
  timezone,
  isLoading,
  error,
  onRetry,
}: {
  cashFlow: CashFlowResponse | undefined;
  timezone: string;
  isLoading: boolean;
  error: Error | null;
  onRetry: () => void;
}) {
  if (isLoading) {
    return (
      <section
        className="content-card cash-flow-card"
        aria-labelledby="cash-flow-title"
      >
        <CashFlowHeading />
        <div
          className="cash-flow-skeleton skeleton"
          role="status"
          aria-label="Memuat grafik arus kas"
        />
      </section>
    );
  }
  if (error) {
    const isInvalidRange = error instanceof ApiError && error.status === 400;
    return (
      <section
        className="content-card cash-flow-card"
        aria-labelledby="cash-flow-title"
      >
        <CashFlowHeading />
        <div className="compact-empty cash-flow-message" role="alert">
          <p>
            {isInvalidRange
              ? 'Periode grafik tidak valid.'
              : 'Grafik arus kas belum dapat dimuat.'}
          </p>
          <span>
            {isInvalidRange
              ? 'Pilih periode lain, lalu coba lagi.'
              : 'Ringkasan dashboard lain tetap tersedia. Coba lagi saat koneksi siap.'}
          </span>
          <button className="secondary-button" type="button" onClick={onRetry}>
            Coba lagi
          </button>
        </div>
      </section>
    );
  }
  if (
    !cashFlow ||
    cashFlow.data.length === 0 ||
    cashFlow.data.every(
      (item) => isZeroDecimal(item.income) && isZeroDecimal(item.expense),
    )
  ) {
    return (
      <section
        className="content-card cash-flow-card"
        aria-labelledby="cash-flow-title"
      >
        <CashFlowHeading />
        <div className="compact-empty">
          <p>Belum ada transaksi pada periode ini.</p>
          <span>
            Catat pemasukan atau pengeluaran untuk melihat arus kas harian.
          </span>
        </div>
      </section>
    );
  }

  const visual = visualSeries(cashFlow);
  const labels = cashFlow.data.map((item) =>
    formatCashFlowLabel(item.label, cashFlow.granularity, timezone),
  );
  const data = {
    labels,
    datasets: [
      {
        label: 'Pemasukan',
        data: visual.income,
        borderColor: '#287e64',
        backgroundColor: 'rgb(40 126 100 / 12%)',
        borderWidth: 2.5,
        fill: true,
        pointRadius: 0,
        pointHoverRadius: 4,
        tension: 0.28,
      },
      {
        label: 'Pengeluaran',
        data: visual.expense,
        borderColor: '#b85b55',
        backgroundColor: 'transparent',
        borderDash: [7, 5],
        borderWidth: 2.25,
        fill: false,
        pointRadius: 0,
        pointHoverRadius: 4,
        tension: 0.28,
      },
    ],
  };
  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { intersect: false, mode: 'index' },
    scales: {
      x: {
        grid: { display: false },
        ticks: { autoSkip: true, maxTicksLimit: 6, maxRotation: 0 },
      },
      y: {
        beginAtZero: true,
        max: 100,
        ticks: { display: false },
        border: { display: false },
        grid: { color: 'rgb(20 36 43 / 8%)' },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          title: (items) =>
            items[0] ? (labels[items[0].dataIndex] ?? '') : '',
          label: (context) => {
            const bucket = cashFlow.data[context.dataIndex];
            if (!bucket) return '';
            const value =
              context.dataset.label === 'Pemasukan'
                ? bucket.income
                : bucket.expense;
            return `${context.dataset.label ?? 'Arus kas'}: ${formatIdr(value)}`;
          },
        },
      },
    },
  };

  return (
    <section
      className="content-card cash-flow-card"
      aria-labelledby="cash-flow-title"
    >
      <CashFlowHeading />
      <div className="cash-flow-legend" aria-label="Legenda grafik arus kas">
        <span>
          <i className="income-line" aria-hidden="true" />
          Pemasukan · garis penuh
        </span>
        <span>
          <i className="expense-line" aria-hidden="true" />
          Pengeluaran · garis putus-putus
        </span>
      </div>
      <div className="cash-flow-visual" aria-hidden="true">
        <Line data={data} options={options} />
      </div>
      <details className="cash-flow-table-wrap">
        <summary>Rincian arus kas periode ini</summary>
        <table>
          <caption className="sr-only">
            Pemasukan dan pengeluaran per periode
          </caption>
          <thead>
            <tr>
              <th scope="col">Periode</th>
              <th scope="col">Pemasukan</th>
              <th scope="col">Pengeluaran</th>
            </tr>
          </thead>
          <tbody>
            {cashFlow.data.map((bucket, index) => (
              <tr key={bucket.label}>
                <th scope="row">{labels[index]}</th>
                <td>{formatIdr(bucket.income)}</td>
                <td>{formatIdr(bucket.expense)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </section>
  );
}

function CashFlowHeading() {
  return (
    <header className="section-heading">
      <div>
        <p className="section-kicker">Ledger arus</p>
        <h2 id="cash-flow-title">Pemasukan dan pengeluaran</h2>
      </div>
      <span className="section-meta">Per hari</span>
    </header>
  );
}

function visualSeries(cashFlow: CashFlowResponse): {
  income: number[];
  expense: number[];
} {
  const fractions = cashFlow.data.flatMap((item) => [
    fractionLength(item.income),
    fractionLength(item.expense),
  ]);
  const scale = Math.max(...fractions, 0);
  const values = cashFlow.data.flatMap((item) => [
    toScaledInteger(item.income, scale),
    toScaledInteger(item.expense, scale),
  ]);
  const maximum = values.reduce(
    (largest, value) => (value > largest ? value : largest),
    0n,
  );
  return {
    income: cashFlow.data.map((item) =>
      toVisualPercent(toScaledInteger(item.income, scale), maximum),
    ),
    expense: cashFlow.data.map((item) =>
      toVisualPercent(toScaledInteger(item.expense, scale), maximum),
    ),
  };
}

function fractionLength(value: string): number {
  return value.split('.')[1]?.length ?? 0;
}
function toScaledInteger(value: string, scale: number): bigint {
  const [integer, fraction = ''] = value.replace(/^\+/, '').split('.');
  return BigInt(`${integer ?? '0'}${fraction.padEnd(scale, '0')}`);
}
function toVisualPercent(value: bigint, maximum: bigint): number {
  if (maximum === 0n) return 0;
  return Number((value * 10_000n) / maximum) / 100;
}
