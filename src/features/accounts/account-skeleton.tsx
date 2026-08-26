export function AccountSkeleton() {
  return (
    <div className="account-grid" role="status" aria-label="Memuat account">
      <span className="sr-only">Memuat account…</span>
      {[0, 1, 2].map((item) => (
        <div className="skeleton account-card-skeleton" key={item} />
      ))}
    </div>
  );
}
