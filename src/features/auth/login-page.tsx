import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation } from 'react-router-dom';

import { getAuthErrorMessage } from './auth-error';
import { AuthLayout } from './auth-layout';
import { loginSchema, type LoginFormValues } from './auth.schemas';
import { PasswordField } from './password-field';
import { useAuth } from './use-auth';
import { getAccounts } from '../accounts/account.api';

export function LoginPage() {
  const { login } = useAuth();
  const location = useLocation();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const registrationMessage = (
    location.state as { registered?: boolean } | null
  )?.registered;

  async function onSubmit(values: LoginFormValues) {
    setSubmitError(null);
    try {
      let destination = '/dashboard';
      await login(values, async () => {
        try {
          const accounts = await getAccounts();
          if (!accounts.some((account) => account.isActive))
            destination = '/accounts/new';
        } catch {
          // Account lookup must not block a user with a valid session.
        }
        return destination;
      });
    } catch (error) {
      setSubmitError(getAuthErrorMessage(error, 'login'));
    }
  }

  return (
    <AuthLayout>
      <div className="form-card">
        <header className="form-header">
          <p className="eyebrow">Selamat datang kembali</p>
          <h2>Masuk ke Alira</h2>
          <p>Lanjutkan perjalanan finansialmu dengan aman.</p>
        </header>
        {registrationMessage ? (
          <p className="form-success" role="status">
            Akun berhasil dibuat. Silakan masuk.
          </p>
        ) : null}
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
            autoComplete="current-password"
            error={errors.password?.message}
            {...register('password')}
          />
          <button
            className="primary-button"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="spinner" aria-hidden="true" />
                Memproses…
              </>
            ) : (
              'Masuk'
            )}
          </button>
        </form>
        <p className="form-footer">
          Belum punya akun? <Link to="/register">Daftar sekarang</Link>
        </p>
      </div>
    </AuthLayout>
  );
}
