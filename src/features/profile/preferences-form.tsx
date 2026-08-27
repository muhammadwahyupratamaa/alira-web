import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';

import { preferencesSchema, type PreferencesValues } from './profile.schemas';
import type { User } from '../auth/auth.types';

export function PreferencesForm({
  profile,
  pending,
  error,
  onSubmit,
}: {
  profile: User;
  pending: boolean;
  error: string | null;
  onSubmit: (values: PreferencesValues) => Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<PreferencesValues>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: { currency: 'IDR', timezone: profile.timezone },
  });
  return (
    <form
      className="settings-form"
      onSubmit={(event) => void handleSubmit(onSubmit)(event)}
      noValidate
    >
      {error ? (
        <p className="form-alert" role="alert">
          {error}
        </p>
      ) : null}
      <div className="field-group">
        <label htmlFor="currency">Mata uang</label>
        <NativeSelect
          className="w-full"
          id="currency"
          {...register('currency')}
        >
          <NativeSelectOption value="IDR">
            IDR — Rupiah Indonesia
          </NativeSelectOption>
        </NativeSelect>
        <p className="field-hint">MVP Alira saat ini hanya mendukung IDR.</p>
      </div>
      <div className="field-group">
        <label htmlFor="timezone">Timezone</label>
        <input
          id="timezone"
          autoComplete="off"
          aria-invalid={Boolean(errors.timezone)}
          aria-describedby={
            errors.timezone ? 'timezone-error' : 'timezone-hint'
          }
          {...register('timezone')}
        />
        <p id="timezone-hint" className="field-hint">
          Gunakan nama IANA, misalnya Asia/Jakarta.
        </p>
        {errors.timezone ? (
          <p id="timezone-error" className="field-error">
            {errors.timezone.message}
          </p>
        ) : null}
      </div>
      <button
        className="primary-button settings-submit"
        type="submit"
        disabled={pending || !isDirty}
      >
        {pending ? 'Menyimpan…' : 'Simpan preferensi'}
      </button>
    </form>
  );
}
