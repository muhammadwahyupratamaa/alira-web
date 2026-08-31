import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';

import { categorySchema, type CategoryFormValues } from './category.schemas';
import type { Category } from './category.types';

export function CategoryFormDialog({
  category,
  pending,
  error,
  onCancel,
  onSubmit,
}: {
  category: Category | null;
  pending: boolean;
  error: string | null;
  onCancel: () => void;
  onSubmit: (values: CategoryFormValues) => Promise<void>;
}) {
  const nameRef = useRef<HTMLInputElement | null>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: category
      ? {
          name: category.name,
          type: category.type,
          icon: typeof category.icon === 'string' ? category.icon : '',
          color: typeof category.color === 'string' ? category.color : '',
        }
      : { name: '', type: 'EXPENSE', icon: '', color: '' },
  });
  const nameRegistration = register('name');
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    nameRef.current?.focus();
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !pending) onCancel();
      if (event.key !== 'Tab') return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'input:not(:disabled), button:not(:disabled)',
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus();
    };
  }, [onCancel, pending]);
  return (
    <div
      className="dialog-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !pending) onCancel();
      }}
    >
      <section
        ref={dialogRef}
        className="confirm-dialog category-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="category-form-title"
        aria-describedby="category-form-description"
      >
        <p className="section-kicker">
          {category ? 'Edit custom' : 'Kategori baru'}
        </p>
        <h2 id="category-form-title">
          {category ? 'Ubah kategori' : 'Tambah kategori'}
        </h2>
        <p id="category-form-description">
          Kategori custom dapat dipakai untuk transaksi baru.
        </p>
        <form
          className="account-form"
          onSubmit={(event) => void handleSubmit(onSubmit)(event)}
          noValidate
        >
          {error ? (
            <p className="form-alert" role="alert">
              {error}
            </p>
          ) : null}
          <div className="field-group">
            <label htmlFor="category-name">Nama</label>
            <input
              id="category-name"
              aria-invalid={Boolean(errors.name)}
              {...nameRegistration}
              ref={(element) => {
                nameRegistration.ref(element);
                nameRef.current = element;
              }}
            />
            {errors.name ? (
              <p className="field-error">{errors.name.message}</p>
            ) : null}
          </div>
          <fieldset className="account-type-fieldset">
            <legend>Tipe</legend>
            <div className="account-type-options category-type-options">
              <label>
                <input type="radio" value="INCOME" {...register('type')} />
                <span>+ Pemasukan</span>
              </label>
              <label>
                <input type="radio" value="EXPENSE" {...register('type')} />
                <span>− Pengeluaran</span>
              </label>
            </div>
          </fieldset>
          <div className="category-optional-grid">
            <div className="field-group">
              <label htmlFor="category-icon">Ikon (opsional)</label>
              <input
                id="category-icon"
                placeholder="briefcase"
                {...register('icon')}
              />
              {errors.icon ? (
                <p className="field-error">{errors.icon.message}</p>
              ) : null}
            </div>
            <div className="field-group">
              <label htmlFor="category-color">Warna hex (opsional)</label>
              <input
                id="category-color"
                placeholder="#22C55E"
                {...register('color')}
              />
              {errors.color ? (
                <p className="field-error">{errors.color.message}</p>
              ) : null}
            </div>
          </div>
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
              className="primary-button category-save"
              type="submit"
              disabled={pending}
            >
              {pending ? 'Menyimpan…' : 'Simpan kategori'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
