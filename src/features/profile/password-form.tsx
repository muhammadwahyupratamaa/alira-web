import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { passwordSchema, type PasswordValues } from './profile.schemas';

export function PasswordForm({
  pending,
  error,
  success,
  onSubmit,
}: {
  pending: boolean;
  error: string | null;
  success: string | null;
  onSubmit: (values: PasswordValues) => Promise<boolean>;
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
    if (await onSubmit(values)) reset();
  }
  return (
    <form
      className="settings-form"
      onSubmit={(event) => void handleSubmit(submit)(event)}
      noValidate
    >
      {success ? (
        <p className="form-success" role="status">
          {success}
        </p>
      ) : null}
      {error ? (
        <p className="form-alert" role="alert">
          {error}
        </p>
      ) : null}
      <div className="field-group">
        <label htmlFor="current-password">Password saat ini</label>
        <input
          id="current-password"
          type="password"
          autoComplete="current-password"
          aria-invalid={Boolean(errors.currentPassword)}
          {...register('currentPassword')}
        />
        {errors.currentPassword ? (
          <p className="field-error">{errors.currentPassword.message}</p>
        ) : null}
      </div>
      <div className="field-group">
        <label htmlFor="new-password">Password baru</label>
        <input
          id="new-password"
          type="password"
          autoComplete="new-password"
          aria-invalid={Boolean(errors.newPassword)}
          {...register('newPassword')}
        />
        {errors.newPassword ? (
          <p className="field-error">{errors.newPassword.message}</p>
        ) : null}
      </div>
      <div className="field-group">
        <label htmlFor="confirm-password">Konfirmasi password baru</label>
        <input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          aria-invalid={Boolean(errors.confirmPassword)}
          {...register('confirmPassword')}
        />
        {errors.confirmPassword ? (
          <p className="field-error">{errors.confirmPassword.message}</p>
        ) : null}
      </div>
      <button
        className="primary-button settings-submit"
        type="submit"
        disabled={pending}
      >
        {pending ? 'Mengubah…' : 'Ubah password'}
      </button>
    </form>
  );
}
