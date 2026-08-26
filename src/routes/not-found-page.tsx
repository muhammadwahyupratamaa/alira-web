import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <main className="app-shell">
      <section className="surface" aria-labelledby="not-found-title">
        <p className="eyebrow">404</p>
        <h1 id="not-found-title">Page not found.</h1>
        <p className="lede">The page you requested does not exist.</p>
        <Link className="text-link" to="/">
          Return home
        </Link>
      </section>
    </main>
  );
}
