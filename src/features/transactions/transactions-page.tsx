import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { AppSelect } from '@/components/ui/app-select';

import { AppLayout } from '../dashboard/app-layout';
import {
  formatFinancialDate,
  formatIdr,
} from '../dashboard/dashboard-formatters';
import { PlusIcon } from '../dashboard/dashboard-icons';
import { useAuth } from '../auth/use-auth';
import { getAccounts } from '../accounts/account.api';
import { getCategories } from '../categories/category.api';
import {
  deleteTransaction,
  duplicateTransaction,
  listTransactions,
  restoreTransaction,
} from './transaction.api';
import { getTransactionErrorMessage } from './transaction-error';
import type { TransactionFilters } from './transaction.types';
import { useTransactionInvalidation } from './use-transaction-invalidation';

const sorts = [
  'transactionDate:desc',
  'transactionDate:asc',
  'createdAt:desc',
  'createdAt:asc',
  'amount:desc',
  'amount:asc',
] as const;

const sortLabels: Record<(typeof sorts)[number], string> = {
  'transactionDate:desc': 'Tanggal terbaru',
  'transactionDate:asc': 'Tanggal terlama',
  'createdAt:desc': 'Terakhir ditambahkan',
  'createdAt:asc': 'Pertama ditambahkan',
  'amount:desc': 'Nominal terbesar',
  'amount:asc': 'Nominal terkecil',
};
function filtersFrom(params: URLSearchParams): TransactionFilters {
  const sortValue = params.get('sort');
  const requestedPage = Number(params.get('page') ?? '1');
  return {
    startDate: params.get('startDate') ?? undefined,
    endDate: params.get('endDate') ?? undefined,
    accountId: params.get('accountId') ?? undefined,
    categoryId: params.get('categoryId') ?? undefined,
    type:
      params.get('type') === 'INCOME'
        ? 'INCOME'
        : params.get('type') === 'EXPENSE'
          ? 'EXPENSE'
          : undefined,
    search: params.get('search') ?? undefined,
    page:
      Number.isInteger(requestedPage) && requestedPage >= 1 ? requestedPage : 1,
    limit: 20,
    sort: sorts.find((item) => item === sortValue) ?? 'transactionDate:desc',
  };
}
export function TransactionsPage() {
  const { user } = useAuth();
  const timezone = user?.timezone ?? 'Asia/Jakarta';
  const [params, setParams] = useSearchParams();
  const filters = filtersFrom(params);
  const invalidate = useTransactionInvalidation();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [deletedId, setDeletedId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const query = useQuery({
    queryKey: ['transactions', filters],
    queryFn: () => listTransactions(filters),
  });
  const accounts = useQuery({ queryKey: ['accounts'], queryFn: getAccounts });
  const categories = useQuery({
    queryKey: ['categories', 'all'],
    queryFn: getCategories,
  });
  const remove = useMutation({
    mutationFn: deleteTransaction,
    onSuccess: async (_, id) => {
      setDeletedId(id);
      setConfirmId(null);
      setFeedback('Transaksi dipindahkan dari daftar.');
      await invalidate();
    },
    onError: (error) => {
      setMutationError(getTransactionErrorMessage(error));
    },
  });
  const restore = useMutation({
    mutationFn: restoreTransaction,
    onSuccess: async () => {
      setDeletedId(null);
      setFeedback('Transaksi berhasil dipulihkan.');
      await invalidate();
    },
    onError: (error) => {
      setMutationError(getTransactionErrorMessage(error));
    },
  });
  const duplicate = useMutation({
    mutationFn: duplicateTransaction,
    onSuccess: async () => {
      setFeedback('Transaksi berhasil diduplikasi untuk hari ini.');
      await invalidate();
    },
    onError: (error) => {
      setMutationError(getTransactionErrorMessage(error));
    },
  });
  function setFilter(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.set('page', '1');
    setParams(next);
  }
  const hasFilters = [
    'startDate',
    'endDate',
    'type',
    'accountId',
    'categoryId',
    'search',
  ].some((key) => params.has(key));
  return (
    <AppLayout>
      <main className="dashboard-content">
        <header className="dashboard-heading account-heading">
          <div>
            <p className="section-kicker">Riwayat keuangan</p>
            <h1>Transaksi</h1>
            <p>Cari dan kelola setiap pemasukan serta pengeluaran.</p>
          </div>
          <Link className="primary-link" to="/transactions/new">
            <PlusIcon />
            Tambah transaksi
          </Link>
        </header>
        {feedback ? (
          <div className="form-success transaction-feedback" role="status">
            <span>{feedback}</span>
            {deletedId ? (
              <button
                type="button"
                disabled={restore.isPending}
                onClick={() => {
                  restore.mutate(deletedId);
                }}
              >
                Undo hapus
              </button>
            ) : null}
          </div>
        ) : null}
        {mutationError ? (
          <p className="form-alert" role="alert">
            {mutationError}
          </p>
        ) : null}
        <section className="transaction-filters" aria-label="Filter transaksi">
          <label>
            Mulai
            <input
              type="date"
              value={filters.startDate ?? ''}
              onChange={(event) => {
                setFilter('startDate', event.target.value);
              }}
            />
          </label>
          <label>
            Sampai
            <input
              type="date"
              value={filters.endDate ?? ''}
              onChange={(event) => {
                setFilter('endDate', event.target.value);
              }}
            />
          </label>
          <label>
            Tipe
            <AppSelect
              label="Tipe"
              value={filters.type ?? ''}
              onValueChange={(value) => {
                setFilter('type', value);
              }}
              options={[
                { value: '', label: 'Semua tipe' },
                { value: 'INCOME', label: 'Pemasukan' },
                { value: 'EXPENSE', label: 'Pengeluaran' },
              ]}
            />
          </label>
          <label>
            Account
            <AppSelect
              label="Account"
              value={filters.accountId ?? ''}
              onValueChange={(value) => {
                setFilter('accountId', value);
              }}
              options={[
                { value: '', label: 'Semua account' },
                ...(accounts.data ?? []).map((item) => ({
                  value: item.id,
                  label: item.name,
                })),
              ]}
            />
          </label>
          <label>
            Kategori
            <AppSelect
              label="Kategori"
              value={filters.categoryId ?? ''}
              onValueChange={(value) => {
                setFilter('categoryId', value);
              }}
              options={[
                { value: '', label: 'Semua kategori' },
                ...(categories.data ?? []).map((item) => ({
                  value: item.id,
                  label: item.name,
                })),
              ]}
            />
          </label>
          <label>
            Urutkan
            <AppSelect
              label="Urutkan"
              value={filters.sort}
              onValueChange={(value) => {
                setFilter('sort', value);
              }}
              options={sorts.map((sort) => ({
                value: sort,
                label: sortLabels[sort],
              }))}
            />
          </label>
          <label className="transaction-search">
            Cari catatan
            <input
              value={filters.search ?? ''}
              maxLength={200}
              onChange={(event) => {
                setFilter('search', event.target.value);
              }}
            />
          </label>
          {hasFilters ? (
            <button
              className="secondary-button"
              type="button"
              onClick={() => {
                setParams({});
              }}
            >
              Reset filter
            </button>
          ) : null}
        </section>
        {query.isPending ? (
          <div
            className="skeleton transaction-list-skeleton"
            role="status"
            aria-label="Memuat transaksi"
          />
        ) : null}
        {query.isError ? (
          <section className="dashboard-error" role="alert">
            <span className="error-symbol">!</span>
            <div>
              <h2>Transaksi belum dapat dimuat</h2>
              <p>{getTransactionErrorMessage(query.error)}</p>
            </div>
            <button
              className="secondary-button"
              type="button"
              onClick={() => void query.refetch()}
            >
              Coba lagi
            </button>
          </section>
        ) : null}
        {query.data ? (
          query.data.data.length === 0 ? (
            <section className="dashboard-empty account-empty">
              <p className="section-kicker">
                {hasFilters ? 'Tidak ada hasil' : 'Belum ada transaksi'}
              </p>
              <h2>
                {hasFilters
                  ? 'Tidak ada transaksi yang cocok.'
                  : 'Catat aliran pertamamu.'}
              </h2>
              <p>
                {hasFilters
                  ? 'Ubah atau reset filter untuk melihat transaksi lain.'
                  : 'Tambah transaksi untuk memperbarui saldo dan Dashboard.'}
              </p>
              {hasFilters ? (
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => {
                    setParams({});
                  }}
                >
                  Reset filter
                </button>
              ) : (
                <Link className="primary-link" to="/transactions/new">
                  Tambah transaksi
                </Link>
              )}
            </section>
          ) : (
            <>
              <div className="transaction-history" role="list">
                {query.data.data.map((item) => (
                  <article
                    className="transaction-row"
                    role="listitem"
                    key={item.id}
                  >
                    <span
                      className={`transaction-icon ${item.type === 'INCOME' ? 'transaction-income' : 'transaction-expense'}`}
                    >
                      {item.type === 'INCOME' ? '+' : '−'}
                    </span>
                    <div>
                      <strong>{item.category.name}</strong>
                      <span>
                        {item.account.name} ·{' '}
                        {formatFinancialDate(item.transactionDate, timezone)}
                      </span>
                      {typeof item.note === 'string' && item.note ? (
                        <small>{item.note}</small>
                      ) : null}
                    </div>
                    <strong
                      className={
                        item.type === 'INCOME'
                          ? 'amount-income'
                          : 'amount-expense'
                      }
                    >
                      {item.type === 'INCOME' ? '+' : '−'}
                      {formatIdr(item.amount)}
                    </strong>
                    <div className="transaction-row-actions">
                      <Link to={`/transactions/${item.id}`}>Detail</Link>
                      <button
                        type="button"
                        disabled={duplicate.isPending}
                        onClick={() => {
                          duplicate.mutate(item.id);
                        }}
                      >
                        Duplikat
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMutationError(null);
                          setConfirmId(item.id);
                        }}
                      >
                        Hapus
                      </button>
                    </div>
                  </article>
                ))}
              </div>
              <nav className="pagination" aria-label="Pagination transaksi">
                <button
                  type="button"
                  disabled={query.data.page <= 1}
                  onClick={() => {
                    setFilter('page', String(query.data.page - 1));
                  }}
                >
                  Sebelumnya
                </button>
                <span>
                  Halaman {query.data.page} dari {query.data.totalPages}
                </span>
                <button
                  type="button"
                  disabled={query.data.page >= query.data.totalPages}
                  onClick={() => {
                    setFilter('page', String(query.data.page + 1));
                  }}
                >
                  Berikutnya
                </button>
              </nav>
            </>
          )
        ) : null}
      </main>
      {confirmId ? (
        <div className="dialog-backdrop">
          <section
            className="confirm-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-transaction-title"
          >
            <h2 id="delete-transaction-title">Hapus transaksi?</h2>
            <p>
              Transaksi akan dihapus sementara dan saldo dihitung ulang oleh
              backend. Anda dapat memulihkannya melalui tombol Undo.
            </p>
            {mutationError ? (
              <p className="form-alert">{mutationError}</p>
            ) : null}
            <div className="dialog-actions">
              <button
                className="secondary-button"
                type="button"
                onClick={() => {
                  setConfirmId(null);
                }}
              >
                Batal
              </button>
              <button
                className="danger-button"
                type="button"
                disabled={remove.isPending}
                onClick={() => {
                  remove.mutate(confirmId);
                }}
              >
                {remove.isPending ? 'Menghapus…' : 'Ya, hapus'}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </AppLayout>
  );
}
