export function DashboardSkeleton() {
  return (
    <div
      className="dashboard-loading"
      role="status"
      aria-label="Memuat dashboard"
    >
      <div className="skeleton skeleton-title" />
      <div className="skeleton ledger-skeleton">
        <span className="sr-only">Memuat ringkasan saldo dan Aliran</span>
      </div>
      <div className="dashboard-grid">
        <div className="skeleton skeleton-panel" />
        <div className="skeleton skeleton-panel" />
      </div>
      <span className="sr-only">Memuat data dashboard…</span>
    </div>
  );
}
