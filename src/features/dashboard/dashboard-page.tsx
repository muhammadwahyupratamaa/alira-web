import { useState } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../auth/use-auth';
import { AppLayout } from './app-layout';
import { DashboardSkeleton } from './dashboard-skeleton';
import {
  formatPeriod,
  getCurrentPeriod,
  inputValueToPeriod,
  isZeroDecimal,
  periodToInputValue,
} from './dashboard-formatters';
import { PlusIcon, WalletIcon } from './dashboard-icons';
import type {
  CategoryBreakdown,
  DashboardPeriod,
  DashboardSummary,
  RecentTransaction,
} from './dashboard.types';
import { ExpenseChart } from './expense-chart';
import { RecentTransactions } from './recent-transactions';
import { SummaryCards } from './summary-cards';
import { useDashboard } from './use-dashboard';

export function DashboardPage() {
  const { user } = useAuth();
  const timezone = user?.timezone ?? 'Asia/Jakarta';
  const [period, setPeriod] = useState<DashboardPeriod>(() =>
    getCurrentPeriod(timezone),
  );
  const dashboard = useDashboard(period);

  return (
    <AppLayout>
      <main className="dashboard-content">
        <header className="dashboard-heading">
          <div>
            <p className="section-kicker">Ringkasan keuangan</p>
            <h1>Dashboard</h1>
            <p>Pantau setiap aliran keuanganmu dalam satu pandangan.</p>
          </div>
          <label className="period-control">
            <span>Periode</span>
            <input
              type="month"
              min="2000-01"
              max="2100-12"
              value={periodToInputValue(period)}
              aria-label="Pilih periode dashboard"
              onChange={(event) => {
                const nextPeriod = inputValueToPeriod(event.target.value);
                if (nextPeriod) setPeriod(nextPeriod);
              }}
            />
          </label>
        </header>

        {dashboard.isLoading ? <DashboardSkeleton /> : null}
        {dashboard.isError ? (
          <section className="dashboard-error" role="alert">
            <span className="error-symbol" aria-hidden="true">
              !
            </span>
            <div>
              <h2>Data dashboard belum dapat dimuat</h2>
              <p>Periksa koneksi Anda, lalu coba lagi.</p>
            </div>
            <button
              className="secondary-button"
              type="button"
              disabled={dashboard.isRetrying}
              onClick={() => void dashboard.retry()}
            >
              {dashboard.isRetrying ? 'Mencoba…' : 'Coba lagi'}
            </button>
          </section>
        ) : null}

        {!dashboard.isLoading &&
        !dashboard.isError &&
        dashboard.summary.data &&
        dashboard.breakdown.data &&
        dashboard.recent.data ? (
          <DashboardContent
            period={period}
            timezone={timezone}
            summary={dashboard.summary.data}
            breakdown={dashboard.breakdown.data}
            recent={dashboard.recent.data}
          />
        ) : null}
      </main>
    </AppLayout>
  );
}

function DashboardContent({
  period,
  timezone,
  summary,
  breakdown,
  recent,
}: {
  period: DashboardPeriod;
  timezone: string;
  summary: DashboardSummary;
  breakdown: CategoryBreakdown;
  recent: RecentTransaction[];
}) {
  const isEmpty =
    recent.length === 0 &&
    breakdown.data.length === 0 &&
    isZeroDecimal(summary.totalBalance) &&
    isZeroDecimal(summary.monthlyIncome) &&
    isZeroDecimal(summary.monthlyExpense);

  if (isEmpty) {
    return (
      <section className="dashboard-empty" aria-labelledby="empty-title">
        <span className="empty-orbit" aria-hidden="true">
          <WalletIcon />
        </span>
        <p className="section-kicker">Mulai perjalananmu</p>
        <h2 id="empty-title">Dashboard siap untuk data pertamamu.</h2>
        <p>
          Tambahkan account untuk mencatat saldo awal, lalu buat transaksi
          pertama agar ringkasanmu mulai terbentuk.
        </p>
        <div className="empty-actions">
          <Link className="primary-link" to="/accounts/new">
            <WalletIcon />
            Tambah account
          </Link>
          <Link className="secondary-link" to="/transactions/new">
            <PlusIcon />
            Tambah transaksi
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div className="dashboard-data">
      <div className="dashboard-period-label">
        Menampilkan {formatPeriod(period, timezone)}
      </div>
      <SummaryCards summary={summary} />
      <div className="quick-actions" aria-label="Aksi cepat">
        <Link className="primary-link" to="/transactions/new">
          <PlusIcon />
          Tambah transaksi
        </Link>
        <Link className="secondary-link" to="/accounts/new">
          <WalletIcon />
          Tambah account
        </Link>
      </div>
      <div className="dashboard-grid">
        <ExpenseChart breakdown={breakdown} />
        <RecentTransactions transactions={recent} timezone={timezone} />
      </div>
    </div>
  );
}
