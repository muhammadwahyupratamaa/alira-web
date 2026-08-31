import { useMutation } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../auth/use-auth';
import { QuickAddDialog } from '../transactions/quick-add-dialog';
import {
  deleteTransaction,
  duplicateTransaction,
} from '../transactions/transaction.api';
import { getTransactionErrorMessage } from '../transactions/transaction-error';
import { useTransactionInvalidation } from '../transactions/use-transaction-invalidation';
import { AppLayout } from './app-layout';
import { AccountOverview } from './account-overview';
import { DashboardSkeleton } from './dashboard-skeleton';
import {
  formatPeriod,
  getCurrentPeriod,
  inputValueToPeriod,
  isZeroDecimal,
  periodToInputValue,
} from './dashboard-formatters';
import { CalendarIcon, PlusIcon, WalletIcon } from './dashboard-icons';
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
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddUndoId, setQuickAddUndoId] = useState<string | null>(null);
  const [quickAddFeedback, setQuickAddFeedback] = useState<string | null>(null);
  const dashboard = useDashboard(period);
  const invalidateTransactions = useTransactionInvalidation();
  const undoQuickAdd = useMutation({
    mutationFn: deleteTransaction,
    onSuccess: async () => {
      await invalidateTransactions();
      setQuickAddUndoId(null);
      setQuickAddFeedback('Transaksi dibatalkan.');
    },
    onError: (error) => {
      setQuickAddFeedback(getTransactionErrorMessage(error));
    },
  });
  const duplicate = useMutation({
    mutationFn: duplicateTransaction,
    onSuccess: async () => {
      await invalidateTransactions();
      if (!quickAddUndoId)
        setQuickAddFeedback('Transaksi berhasil diduplikasi untuk hari ini.');
    },
    onError: (error) => {
      if (!quickAddUndoId)
        setQuickAddFeedback(getTransactionErrorMessage(error));
    },
  });
  useEffect(() => {
    if (!quickAddUndoId) return;
    const timeout = window.setTimeout(() => {
      setQuickAddUndoId(null);
      setQuickAddFeedback(null);
    }, 8_000);
    return () => {
      window.clearTimeout(timeout);
    };
  }, [quickAddUndoId]);

  return (
    <AppLayout>
      <main className="dashboard-content">
        <header className="dashboard-heading">
          <div>
            <p className="section-kicker">Ringkasan keuangan</p>
            <h1>Dashboard</h1>
            <p>Pantau setiap Aliran keuanganmu dalam satu pandangan.</p>
          </div>
          <label className="period-control">
            <span className="period-control-label">
              <CalendarIcon />
              Periode
            </span>
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
        {quickAddFeedback ? (
          <div className="form-success transaction-feedback" role="status">
            <span>{quickAddFeedback}</span>
            {quickAddUndoId ? (
              <button
                type="button"
                disabled={undoQuickAdd.isPending}
                onClick={() => {
                  undoQuickAdd.mutate(quickAddUndoId);
                }}
              >
                {undoQuickAdd.isPending ? 'Membatalkan…' : 'Undo'}
              </button>
            ) : null}
          </div>
        ) : null}

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
            isRefreshing={dashboard.isRefreshing}
            duplicatePending={duplicate.isPending}
            onDuplicate={(id) => {
              duplicate.mutate(id);
            }}
            onQuickAdd={() => {
              setQuickAddOpen(true);
            }}
          />
        ) : null}
      </main>
      {quickAddOpen ? (
        <QuickAddDialog
          timezone={timezone}
          onClose={() => {
            setQuickAddOpen(false);
          }}
          onSuccess={(transaction) => {
            setQuickAddUndoId(transaction.id);
            setQuickAddFeedback('Transaksi berhasil ditambahkan.');
          }}
        />
      ) : null}
    </AppLayout>
  );
}

function DashboardContent({
  period,
  timezone,
  summary,
  breakdown,
  recent,
  isRefreshing,
  onDuplicate,
  duplicatePending,
  onQuickAdd,
}: {
  period: DashboardPeriod;
  timezone: string;
  summary: DashboardSummary;
  breakdown: CategoryBreakdown;
  recent: RecentTransaction[];
  isRefreshing: boolean;
  onDuplicate: (id: string) => void;
  duplicatePending: boolean;
  onQuickAdd: () => void;
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
    <div className="dashboard-data" aria-busy={isRefreshing}>
      <div className="dashboard-period-row">
        <span>Menampilkan {formatPeriod(period, timezone)}</span>
        {isRefreshing ? <span role="status">Memperbarui data…</span> : null}
      </div>
      <SummaryCards summary={summary} />
      <div className="quick-actions" aria-label="Aksi cepat">
        <button className="primary-button" type="button" onClick={onQuickAdd}>
          <PlusIcon />
          Tambah transaksi
        </button>
        <Link className="secondary-link" to="/accounts/new">
          <WalletIcon />
          Tambah account
        </Link>
      </div>
      <div className="dashboard-grid">
        <ExpenseChart breakdown={breakdown} />
        <RecentTransactions
          transactions={recent}
          timezone={timezone}
          onDuplicate={onDuplicate}
          duplicatePending={duplicatePending}
        />
      </div>
      <AccountOverview />
    </div>
  );
}
