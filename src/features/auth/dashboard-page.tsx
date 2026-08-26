import { useState } from 'react';

import { useAuth } from './use-auth';

export function DashboardPage() {
  const { user, logout } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setError(null);
    setIsLoggingOut(true);
    try {
      await logout();
    } catch {
      setError('Sesi lokal telah dibersihkan. Server tidak dapat dihubungi.');
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <main className="dashboard-shell">
      <nav className="dashboard-nav" aria-label="Navigasi utama">
        <span className="wordmark">
          Alira<span aria-hidden="true">.</span>
        </span>
        <button
          className="secondary-button"
          type="button"
          onClick={() => void handleLogout()}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? 'Keluar…' : 'Keluar'}
        </button>
      </nav>
      <section
        className="dashboard-placeholder"
        aria-labelledby="dashboard-title"
      >
        <p className="eyebrow">Fondasi autentikasi aktif</p>
        <h1 id="dashboard-title">Halo, {user?.email}</h1>
        <p className="lede">
          Dashboard finansial akan dibangun pada tahap berikutnya.
        </p>
        {error ? (
          <p className="form-alert" role="alert">
            {error}
          </p>
        ) : null}
      </section>
    </main>
  );
}
