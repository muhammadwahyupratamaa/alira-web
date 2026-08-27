import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { AppLayout } from '../dashboard/app-layout';
import { useAuth } from '../auth/use-auth';
import { changePassword, getProfile, updatePreferences } from './profile.api';
import { getProfileErrorMessage } from './profile-error';
import { PasswordForm } from './password-form';
import { PreferencesForm } from './preferences-form';
import type { PasswordValues, PreferencesValues } from './profile.schemas';

export function ProfilePage() {
  const { syncUser, logout } = useAuth();
  const client = useQueryClient();
  const [preferenceError, setPreferenceError] = useState<string | null>(null);
  const [preferenceSuccess, setPreferenceSuccess] = useState<string | null>(
    null,
  );
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const profile = useQuery({ queryKey: ['profile'], queryFn: getProfile });
  const preferences = useMutation({
    mutationFn: updatePreferences,
    onSuccess: async (user) => {
      syncUser(user);
      client.setQueryData(['profile'], user);
      setPreferenceSuccess(
        'Preferensi berhasil disimpan. Tampilan bertanggal telah diperbarui.',
      );
      await client.invalidateQueries();
    },
    onError: (error) => {
      setPreferenceError(getProfileErrorMessage(error));
    },
  });
  const password = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      setPasswordSuccess(
        'Password berhasil diubah. Refresh session lain telah dicabut.',
      );
    },
    onError: (error) => {
      setPasswordError(getProfileErrorMessage(error));
    },
  });
  async function submitPreferences(values: PreferencesValues) {
    setPreferenceError(null);
    setPreferenceSuccess(null);
    await preferences.mutateAsync(values).catch(() => undefined);
  }
  async function submitPassword(values: PasswordValues) {
    setPasswordError(null);
    setPasswordSuccess(null);
    return password
      .mutateAsync({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      })
      .then(() => true)
      .catch(() => false);
  }
  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout();
    } catch {
      /* provider clears memory state */
    } finally {
      setLoggingOut(false);
    }
  }
  return (
    <AppLayout>
      <main className="dashboard-content profile-content">
        <header className="dashboard-heading">
          <div>
            <p className="section-kicker">Akun dan preferensi</p>
            <h1>Profile</h1>
            <p>Kelola identitas akun, format tampilan, dan keamanan sesi.</p>
          </div>
        </header>
        {profile.isPending ? (
          <div
            className="profile-skeleton"
            role="status"
            aria-label="Memuat profile"
          >
            <div className="skeleton" />
            <div className="skeleton" />
          </div>
        ) : null}
        {profile.isError ? (
          <section className="dashboard-error" role="alert">
            <span className="error-symbol">!</span>
            <div>
              <h2>Profile belum dapat dimuat</h2>
              <p>{getProfileErrorMessage(profile.error)}</p>
            </div>
            <button
              className="secondary-button"
              type="button"
              disabled={profile.isRefetching}
              onClick={() => void profile.refetch()}
            >
              {profile.isRefetching ? 'Mencoba…' : 'Coba lagi'}
            </button>
          </section>
        ) : null}
        {profile.data ? (
          <div className="profile-grid" aria-busy={profile.isRefetching}>
            <section
              className="content-card profile-card"
              aria-labelledby="identity-title"
            >
              <p className="section-kicker">Identitas</p>
              <h2 id="identity-title">Profile pengguna</h2>
              <div className="profile-identity">
                <span className="profile-avatar" aria-hidden="true">
                  {profile.data.email.charAt(0).toUpperCase()}
                </span>
                <div>
                  <strong>{profile.data.email}</strong>
                  <span>
                    Email dikelola oleh sistem dan tidak dapat diubah.
                  </span>
                </div>
              </div>
              <dl className="profile-facts">
                <div>
                  <dt>Mata uang aktif</dt>
                  <dd>{profile.data.currency}</dd>
                </div>
                <div>
                  <dt>Timezone aktif</dt>
                  <dd>{profile.data.timezone}</dd>
                </div>
              </dl>
              {profile.isRefetching ? (
                <p className="background-refresh" role="status">
                  Memperbarui profile…
                </p>
              ) : null}
            </section>
            <section
              className="content-card profile-card"
              aria-labelledby="preferences-title"
            >
              <p className="section-kicker">Settings</p>
              <h2 id="preferences-title">Preferensi tampilan</h2>
              {preferenceSuccess ? (
                <p className="form-success" role="status">
                  {preferenceSuccess}
                </p>
              ) : null}
              <PreferencesForm
                key={profile.data.updatedAt}
                profile={profile.data}
                pending={preferences.isPending}
                error={preferenceError}
                onSubmit={submitPreferences}
              />
            </section>
            <section
              className="content-card profile-card"
              aria-labelledby="password-title"
            >
              <p className="section-kicker">Keamanan</p>
              <h2 id="password-title">Ubah password</h2>
              <p className="profile-description">
                Setelah berhasil, backend mencabut seluruh refresh session.
                Access token tetap hanya berada di memory.
              </p>
              <PasswordForm
                pending={password.isPending}
                error={passwordError}
                success={passwordSuccess}
                onSubmit={submitPassword}
              />
            </section>
            <section className="content-card profile-card logout-card">
              <div>
                <h2>Keluar dari Alira</h2>
                <p>
                  Akhiri sesi pada perangkat ini dan bersihkan auth state
                  frontend.
                </p>
              </div>
              <button
                className="danger-button"
                type="button"
                disabled={loggingOut}
                onClick={() => void handleLogout()}
              >
                {loggingOut ? 'Keluar…' : 'Logout'}
              </button>
            </section>
          </div>
        ) : null}
      </main>
    </AppLayout>
  );
}
