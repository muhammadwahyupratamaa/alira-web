import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';

import { register as registerRequest } from './auth.api';
import { getAuthErrorMessage } from './auth-error';
import { AuthLayout } from './auth-layout';
import { registerSchema, type RegisterFormValues } from './auth.schemas';
import { PasswordField } from './password-field';

export function RegisterPage() {
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', password: '', confirmPassword: '' },
  });

  async function onSubmit(values: RegisterFormValues) {
    setSubmitError(null);
    try {
      await registerRequest({ email: values.email, password: values.password });
      void navigate('/login', { replace: true, state: { registered: true } });
    } catch (error) {
      setSubmitError(getAuthErrorMessage(error, 'register'));
    }
  }

  return (
    <AuthLayout>
      <div className="form-card">
        <header className="form-header">
          <p className="eyebrow">Mulai dengan Alira</p>
          <h2>Buat akun baru</h2>
          <p>Satu langkah menuju keuangan yang lebih tertata.</p>
        </header>
        {submitError ? (
          <p className="form-alert" role="alert">
            {submitError}
          </p>
        ) : null}
        <form
          className="auth-form"
          onSubmit={(event) => void handleSubmit(onSubmit)(event)}
          noValidate
        >
          <div className="field-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'email-error' : undefined}
              {...register('email')}
            />
            {errors.email ? (
              <p className="field-error" id="email-error">
                {errors.email.message}
              </p>
            ) : null}
          </div>
          <PasswordField
            id="password"
            label="Kata sandi"
            autoComplete="new-password"
            error={errors.password?.message}
            {...register('password')}
          />
          <PasswordField
            id="confirm-password"
            label="Konfirmasi kata sandi"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />
          <p className="password-hint">
            8–72 karakter, dengan setidaknya satu huruf dan angka.
          </p>
          <button
            className="primary-button"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="spinner" aria-hidden="true" />
                Membuat akun…
              </>
            ) : (
              'Buat akun'
            )}
          </button>
        </form>
        <p className="form-footer">
          Sudah punya akun? <Link to="/login">Masuk</Link>
        </p>
      </div>
    </AuthLayout>
  );
}
