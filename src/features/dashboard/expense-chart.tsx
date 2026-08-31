import {
  ArcElement,
  Chart as ChartJS,
  Legend,
  Tooltip,
  type ChartOptions,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { Link } from 'react-router-dom';

import { formatIdr } from './dashboard-formatters';
import type { CategoryBreakdown } from './dashboard.types';

ChartJS.register(ArcElement, Tooltip, Legend);

const palette = [
  '#6258e8',
  '#ef8b5f',
  '#e8bc52',
  '#5db6a8',
  '#8c7ecf',
  '#df6e86',
];

export function ExpenseChart({ breakdown }: { breakdown: CategoryBreakdown }) {
  if (breakdown.data.length === 0) {
    return (
      <section
        className="content-card chart-card"
        aria-labelledby="breakdown-title"
      >
        <SectionHeading />
        <div className="compact-empty">
          <p>Belum ada data pengeluaran bulan ini.</p>
          <span>
            Transaksi pengeluaran akan dirangkum per kategori di sini.
          </span>
        </div>
      </section>
    );
  }

  const data = {
    labels: breakdown.data.map((item) => item.name),
    datasets: [
      {
        data: breakdown.data.map((item) => Number(item.percentage)),
        backgroundColor: breakdown.data.map(
          (_, index) => palette[index % palette.length],
        ),
        borderColor: '#ffffff',
        borderWidth: 4,
        hoverOffset: 3,
      },
    ],
  };
  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => `${context.label}: ${String(context.raw)}%`,
        },
      },
    },
  };

  return (
    <section
      className="content-card chart-card"
      aria-labelledby="breakdown-title"
    >
      <SectionHeading />
      <div className="chart-content">
        <div
          className="chart-visual"
          role="img"
          aria-label="Diagram persentase pengeluaran per kategori"
        >
          <Doughnut data={data} options={options} />
          <div className="chart-center" aria-hidden="true">
            <span>Total</span>
            <strong>{formatIdr(breakdown.total)}</strong>
          </div>
        </div>
        <ul className="chart-legend" aria-label="Rincian kategori pengeluaran">
          {breakdown.data.map((item, index) => (
            <li key={item.categoryId}>
              <span
                className="legend-dot"
                style={{ backgroundColor: palette[index % palette.length] }}
                aria-hidden="true"
              />
              <Link
                className="legend-name"
                to={`/transactions?categoryId=${encodeURIComponent(item.categoryId)}`}
                aria-label={`Lihat transaksi pengeluaran ${item.name}`}
              >
                {item.name}
              </Link>
              <strong>{item.percentage}%</strong>
              <span className="legend-total">{formatIdr(item.total)}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function SectionHeading() {
  return (
    <header className="section-heading">
      <div>
        <p className="section-kicker">Analisis</p>
        <h2 id="breakdown-title">Pengeluaran per kategori</h2>
      </div>
    </header>
  );
}
