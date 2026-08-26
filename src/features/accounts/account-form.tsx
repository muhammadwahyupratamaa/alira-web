import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { accountSchema, type AccountFormValues } from './account.schemas';
import type { Account } from './account.types';

const typeOptions = [
  { value: 'BANK', label: 'Bank' },
  { value: 'CASH', label: 'Cash' },
  { value: 'EWALLET', label: 'E-Wallet' },
] as const;

export function AccountForm({
  account,
  isSubmitting,
  serverError,
  onSubmit,
}: {
  account?: Account;
  isSubmitting: boolean;
  serverError: string | null;
  onSubmit: (values: AccountFormValues) => Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: account
      ? {
          name: account.name,
          type: account.type,
          initialBalance: account.initialBalance,
        }
      : { name: '', type: 'BANK', initialBalance: '0' },
  });

  return (
    <form
      className="account-form"
      onSubmit={(event) => void handleSubmit(onSubmit)(event)}
      noValidate
    >
      {serverError ? (
        <p className="form-alert" role="alert">
          {serverError}
        </p>
      ) : null}
      <div className="field-group">
        <label htmlFor="account-name">Nama account</label>
        <input
          id="account-name"
          autoComplete="off"
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? 'account-name-error' : undefined}
          {...register('name')}
        />
        {errors.name ? (
          <p id="account-name-error" className="field-error">
            {errors.name.message}
          </p>
        ) : null}
      </div>
      <fieldset className="account-type-fieldset">
        <legend>Tipe account</legend>
        <div className="account-type-options">
          {typeOptions.map((option) => (
            <label key={option.value}>
              <input type="radio" value={option.value} {...register('type')} />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
        {errors.type ? (
          <p className="field-error">{errors.type.message}</p>
        ) : null}
      </fieldset>
      <div className="field-group">
        <label htmlFor="initial-balance">Saldo awal</label>
        <div className="money-input">
          <span>Rp</span>
          <input
            id="initial-balance"
            inputMode="decimal"
            aria-invalid={Boolean(errors.initialBalance)}
            aria-describedby={
              errors.initialBalance
                ? 'initial-balance-error'
                : 'initial-balance-hint'
            }
            {...register('initialBalance')}
          />
        </div>
        <p id="initial-balance-hint" className="field-hint">
          Masukkan nilai tanpa pemisah ribuan, misalnya 1500000.00.
        </p>
        {errors.initialBalance ? (
          <p id="initial-balance-error" className="field-error">
            {errors.initialBalance.message}
          </p>
        ) : null}
      </div>
      <button
        className="primary-button account-submit"
        type="submit"
        disabled={isSubmitting}
      >
        {isSubmitting
          ? 'Menyimpan…'
          : account
            ? 'Simpan perubahan'
            : 'Buat account'}
      </button>
    </form>
  );
}
