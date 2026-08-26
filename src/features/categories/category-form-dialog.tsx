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
  useEffect(() => nameRef.current?.focus(), []);
  return (
    <div className="dialog-backdrop" role="presentation">
      <section
        className="confirm-dialog category-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="category-form-title"
      >
        <p className="section-kicker">
          {category ? 'Edit custom' : 'Kategori baru'}
        </p>
        <h2 id="category-form-title">
          {category ? 'Ubah kategori' : 'Tambah kategori'}
        </h2>
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
