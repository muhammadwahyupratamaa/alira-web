import type { Category } from './category.types';

export function CategoryDeleteDialog({
  category,
  pending,
  error,
  onCancel,
  onConfirm,
}: {
  category: Category;
  pending: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="dialog-backdrop" role="presentation">
      <section
        className="confirm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-category-title"
      >
        <p className="section-kicker">Konfirmasi</p>
        <h2 id="delete-category-title">Nonaktifkan {category.name}?</h2>
        <p>
          Kategori tidak dapat dipakai untuk transaksi baru. Jika sudah
          digunakan, kategori tetap tersimpan pada riwayat transaksi lama.
        </p>
        {error ? (
          <p className="form-alert" role="alert">
            {error}
          </p>
        ) : null}
        <div className="dialog-actions">
          <button
            className="secondary-button"
            type="button"
            disabled={pending}
            onClick={onCancel}
          >
            Batal
          </button>
          <button
            className="danger-button"
            type="button"
            disabled={pending}
            onClick={onConfirm}
          >
            {pending ? 'Menonaktifkan…' : 'Ya, nonaktifkan'}
          </button>
        </div>
      </section>
    </div>
  );
}
