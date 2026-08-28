import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { PasswordField } from '../auth/password-field';

import { passwordSchema, type PasswordValues } from './profile.schemas';

export function PasswordForm({
  pending,
  error,
  onSubmit,
  onCancel,
  onSuccess,
}: {
  pending: boolean;
  error: string | null;
  onSubmit: (values: PasswordValues) => Promise<boolean>;
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });
  async function submit(values: PasswordValues) {
    if (await onSubmit(values)) {
      reset();
      onSuccess();
    }
  }
  return (
    <form
      className="settings-form"
      onSubmit={(event) => void handleSubmit(submit)(event)}
      noValidate
    >
      {error ? (
        <p className="form-alert" role="alert">
          {error}
        </p>
      ) : null}
      <PasswordField
        id="current-password"
        label="Password saat ini"
        autoComplete="current-password"
        error={errors.currentPassword?.message}
        {...register('currentPassword')}
      />
      <PasswordField
        id="new-password"
        label="Password baru"
        autoComplete="new-password"
        error={errors.newPassword?.message}
        {...register('newPassword')}
      />
      <PasswordField
        id="confirm-password"
        label="Konfirmasi password baru"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        {...register('confirmPassword')}
      />
      <div className="dialog-actions">
        <button
          className="secondary-button"
          type="button"
          disabled={pending}
          onClick={onCancel}
        >
          Batal
        </button>
        <button className="primary-button" type="submit" disabled={pending}>
          {pending ? 'Mengubah…' : 'Ubah password'}
        </button>
      </div>
    </form>
  );
}
