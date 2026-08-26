import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import { getAccounts } from '../accounts/account.api';
import { getCategories } from '../categories/category.api';
import {
  transactionSchema,
  type TransactionFormValues,
} from './transaction.schemas';
import type { Transaction } from './transaction.types';

export function TransactionForm({
  transaction,
  timezone,
  pending,
  error,
  onSubmit,
}: {
  transaction?: Transaction | undefined;
  timezone: string;
  pending: boolean;
  error: string | null;
  onSubmit: (values: TransactionFormValues) => Promise<void>;
}) {
  const accounts = useQuery({ queryKey: ['accounts'], queryFn: getAccounts });
  const categories = useQuery({
    queryKey: ['categories', 'all'],
    queryFn: getCategories,
  });
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  const {
    register,
    handleSubmit,
    control,
    setValue,
    setError,
    formState: { errors },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: transaction
      ? {
          type: transaction.type,
          accountId: transaction.account.id,
          categoryId: transaction.category.id,
          amount: transaction.amount,
          transactionDate: transaction.transactionDate,
          note: typeof transaction.note === 'string' ? transaction.note : '',
        }
      : {
          type: 'EXPENSE',
          accountId: '',
          categoryId: '',
          amount: '',
          transactionDate: today,
          note: '',
        },
  });
  const type = useWatch({ control, name: 'type' });
  useEffect(() => {
    if (!transaction) setValue('categoryId', '');
  }, [type, setValue, transaction]);
  const activeAccounts = accounts.data?.filter((item) => item.isActive) ?? [];
  const matchingCategories =
    categories.data?.filter((item) => item.isActive && item.type === type) ??
    [];
  async function submit(values: TransactionFormValues) {
    if (values.transactionDate > today) {
      setError('transactionDate', {
        message: 'Tanggal transaksi tidak boleh berada di masa depan.',
      });
      return;
    }
    await onSubmit(values);
  }
  return (
    <form
      className="account-form transaction-form"
      onSubmit={(event) => void handleSubmit(submit)(event)}
      noValidate
    >
      {error ? (
        <p className="form-alert" role="alert">
          {error}
        </p>
      ) : null}
      <fieldset className="account-type-fieldset">
        <legend>Tipe transaksi</legend>
        <div className="account-type-options category-type-options">
          <label>
            <input type="radio" value="INCOME" {...register('type')} />
            <span>+ Pemasukan</span>
          </label>
          <label>
            <input type="radio" value="EXPENSE" {...register('type')} />
            <span>− Pengeluaran</span>
          </label>
        </div>
      </fieldset>
      <div className="field-group">
        <label htmlFor="transaction-amount">Nominal</label>
        <div className="money-input">
          <span>Rp</span>
          <input
            id="transaction-amount"
            inputMode="decimal"
            aria-invalid={Boolean(errors.amount)}
            {...register('amount')}
          />
        </div>
        {errors.amount ? (
          <p className="field-error">{errors.amount.message}</p>
        ) : null}
      </div>
      <div className="transaction-form-grid">
        <div className="field-group">
          <label htmlFor="transaction-account">Account</label>
          <select
            id="transaction-account"
            aria-invalid={Boolean(errors.accountId)}
            {...register('accountId')}
          >
            <option value="">Pilih account</option>
            {activeAccounts.map((item) => (
              <option value={item.id} key={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          {errors.accountId ? (
            <p className="field-error">{errors.accountId.message}</p>
          ) : null}
        </div>
        <div className="field-group">
          <label htmlFor="transaction-category">Kategori</label>
          <select
            id="transaction-category"
            aria-invalid={Boolean(errors.categoryId)}
            {...register('categoryId')}
          >
            <option value="">Pilih kategori</option>
            {matchingCategories.map((item) => (
              <option value={item.id} key={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          {errors.categoryId ? (
            <p className="field-error">{errors.categoryId.message}</p>
          ) : null}
        </div>
      </div>
      <div className="field-group">
        <label htmlFor="transaction-date">Tanggal</label>
        <input
          id="transaction-date"
          type="date"
          max={today}
          aria-invalid={Boolean(errors.transactionDate)}
          {...register('transactionDate')}
        />
        {errors.transactionDate ? (
          <p className="field-error">{errors.transactionDate.message}</p>
        ) : null}
      </div>
      <div className="field-group">
        <label htmlFor="transaction-note">Catatan (opsional)</label>
        <textarea id="transaction-note" rows={3} {...register('note')} />
        {errors.note ? (
          <p className="field-error">{errors.note.message}</p>
        ) : null}
      </div>
      <button
        className="primary-button account-submit"
        disabled={pending || accounts.isPending || categories.isPending}
        type="submit"
      >
        {pending
          ? 'Menyimpan…'
          : transaction
            ? 'Simpan perubahan'
            : 'Simpan transaksi'}
      </button>
    </form>
  );
}
