import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';

import { AppSelect } from '@/components/ui/app-select';

import { getAccounts } from '../accounts/account.api';
import { getCategories } from '../categories/category.api';
import {
  transactionSchema,
  type TransactionFormValues,
} from './transaction.schemas';
import type { Transaction } from './transaction.types';

const lastSelectionKey = 'Alira:last-transaction-selection';

function getLastSelection(): Pick<
  TransactionFormValues,
  'type' | 'accountId' | 'categoryId'
> | null {
  try {
    const stored = sessionStorage.getItem(lastSelectionKey);
    if (!stored) return null;
    const value: unknown = JSON.parse(stored);
    if (
      typeof value !== 'object' ||
      value === null ||
      !('type' in value) ||
      !('accountId' in value) ||
      !('categoryId' in value)
    )
      return null;
    const { type, accountId, categoryId } = value;
    if (
      (type !== 'INCOME' && type !== 'EXPENSE') ||
      typeof accountId !== 'string' ||
      typeof categoryId !== 'string'
    )
      return null;
    return { type, accountId, categoryId };
  } catch {
    return null;
  }
}

function rememberLastSelection(values: TransactionFormValues) {
  try {
    sessionStorage.setItem(
      lastSelectionKey,
      JSON.stringify({
        type: values.type,
        accountId: values.accountId,
        categoryId: values.categoryId,
      }),
    );
  } catch {
    // Quick Add still works if browser storage is unavailable.
  }
}

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
  onSubmit: (values: TransactionFormValues) => Promise<boolean>;
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
  const lastSelection = transaction ? null : getLastSelection();
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
          type: lastSelection?.type ?? 'EXPENSE',
          accountId: lastSelection?.accountId ?? '',
          categoryId: lastSelection?.categoryId ?? '',
          amount: '',
          transactionDate: today,
          note: '',
        },
  });
  const type = useWatch({ control, name: 'type' });
  const accountId = useWatch({ control, name: 'accountId' });
  const categoryId = useWatch({ control, name: 'categoryId' });
  useEffect(() => {
    if (
      !transaction &&
      accounts.data &&
      accountId &&
      !accounts.data.some(
        (account) => account.id === accountId && account.isActive,
      )
    ) {
      setValue('accountId', '', { shouldValidate: true });
    }
  }, [accountId, accounts.data, setValue, transaction]);
  useEffect(() => {
    if (
      !transaction &&
      categories.data &&
      categoryId &&
      !categories.data.some(
        (category) =>
          category.id === categoryId &&
          category.isActive &&
          category.type === type,
      )
    ) {
      setValue('categoryId', '', { shouldValidate: true });
    }
  }, [categories.data, categoryId, setValue, transaction, type]);
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
    if (await onSubmit(values)) rememberLastSelection(values);
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
            autoFocus={!transaction}
            inputMode="decimal"
            aria-describedby={
              errors.amount ? 'transaction-amount-error' : undefined
            }
            aria-invalid={Boolean(errors.amount)}
            {...register('amount')}
          />
        </div>
        {errors.amount ? (
          <p className="field-error" id="transaction-amount-error">
            {errors.amount.message}
          </p>
        ) : null}
      </div>
      <div className="transaction-form-grid">
        <div className="field-group">
          <label htmlFor="transaction-account">Account</label>
          <Controller
            control={control}
            name="accountId"
            render={({ field }) => (
              <AppSelect
                id="transaction-account"
                describedBy={
                  errors.accountId ? 'transaction-account-error' : undefined
                }
                invalid={Boolean(errors.accountId)}
                label="Account"
                onValueChange={field.onChange}
                options={[
                  { value: '', label: 'Pilih account' },
                  ...activeAccounts.map((item) => ({
                    value: item.id,
                    label: item.name,
                  })),
                ]}
                value={field.value}
              />
            )}
          />
          {errors.accountId ? (
            <p className="field-error" id="transaction-account-error">
              {errors.accountId.message}
            </p>
          ) : null}
        </div>
        <div className="field-group">
          <label htmlFor="transaction-category">Kategori</label>
          <Controller
            control={control}
            name="categoryId"
            render={({ field }) => (
              <AppSelect
                id="transaction-category"
                describedBy={
                  errors.categoryId ? 'transaction-category-error' : undefined
                }
                invalid={Boolean(errors.categoryId)}
                label="Kategori"
                onValueChange={field.onChange}
                options={[
                  { value: '', label: 'Pilih kategori' },
                  ...matchingCategories.map((item) => ({
                    value: item.id,
                    label: item.name,
                  })),
                ]}
                value={field.value}
              />
            )}
          />
          {errors.categoryId ? (
            <p className="field-error" id="transaction-category-error">
              {errors.categoryId.message}
            </p>
          ) : null}
        </div>
      </div>
      <div className="field-group">
        <label htmlFor="transaction-date">Tanggal</label>
        <input
          id="transaction-date"
          type="date"
          max={today}
          aria-describedby={
            errors.transactionDate ? 'transaction-date-error' : undefined
          }
          aria-invalid={Boolean(errors.transactionDate)}
          {...register('transactionDate')}
        />
        {errors.transactionDate ? (
          <p className="field-error" id="transaction-date-error">
            {errors.transactionDate.message}
          </p>
        ) : null}
      </div>
      <div className="field-group">
        <label htmlFor="transaction-note">Catatan (opsional)</label>
        <textarea
          id="transaction-note"
          rows={3}
          aria-describedby={errors.note ? 'transaction-note-error' : undefined}
          {...register('note')}
        />
        {errors.note ? (
          <p className="field-error" id="transaction-note-error">
            {errors.note.message}
          </p>
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
