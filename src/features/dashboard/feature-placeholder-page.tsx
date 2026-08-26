import { Link } from 'react-router-dom';

import { AppLayout } from './app-layout';

export function FeaturePlaceholderPage({ title }: { title: string }) {
  return (
    <AppLayout>
      <main className="dashboard-content">
        <section
          className="feature-placeholder"
          aria-labelledby="placeholder-title"
        >
          <p className="section-kicker">Segera hadir</p>
          <h1 id="placeholder-title">{title}</h1>
          <p>Fitur ini belum tersedia pada scope Dashboard saat ini.</p>
          <Link className="secondary-link" to="/dashboard">
            Kembali ke Dashboard
          </Link>
        </section>
      </main>
    </AppLayout>
  );
}
