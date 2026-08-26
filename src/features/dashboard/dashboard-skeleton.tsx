export function DashboardSkeleton() {
  return (
    <div
      className="dashboard-loading"
      role="status"
      aria-label="Memuat dashboard"
    >
      <div className="skeleton skeleton-title" />
      <div className="summary-grid">
        {[0, 1, 2].map((item) => (
          <div className="skeleton skeleton-card" key={item} />
        ))}
      </div>
      <div className="dashboard-grid">
        <div className="skeleton skeleton-panel" />
        <div className="skeleton skeleton-panel" />
      </div>
      <span className="sr-only">Memuat data dashboard…</span>
    </div>
  );
}
