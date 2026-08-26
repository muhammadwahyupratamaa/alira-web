import type { PropsWithChildren } from 'react';
import { Link } from 'react-router-dom';

export function AuthLayout({ children }: PropsWithChildren) {
  return (
    <main className="auth-shell">
      <section className="auth-brand" aria-labelledby="brand-heading">
        <Link className="wordmark" to="/" aria-label="Alira home">
          Alira<span aria-hidden="true">.</span>
        </Link>
        <div>
          <p className="eyebrow">Personal finance, made clear</p>
          <h1 id="brand-heading">Kendalikan setiap aliran keuanganmu.</h1>
          <p className="lede">
            Catat dengan cepat, pahami dengan jernih, dan tumbuhkan kebiasaan
            finansial yang lebih baik.
          </p>
        </div>
        <p className="privacy-note">
          Privat secara desain. Presisi dalam setiap angka.
        </p>
      </section>
      <section className="auth-panel">{children}</section>
    </main>
  );
}
