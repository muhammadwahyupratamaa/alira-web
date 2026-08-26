import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { AppLayout } from '../dashboard/app-layout';
import { PlusIcon } from '../dashboard/dashboard-icons';
import {
  createCategory,
  deactivateCategory,
  getCategories,
  updateCategory,
} from './category.api';
import { CategoryDeleteDialog } from './category-delete-dialog';
import { getCategoryErrorMessage } from './category-error';
import { CategoryFormDialog } from './category-form-dialog';
import type { CategoryFormValues } from './category.schemas';
import type { Category, CategoryInput, CategoryType } from './category.types';

export function CategoriesPage() {
  const client = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const categories = useQuery({
    queryKey: ['categories', 'all'],
    queryFn: getCategories,
  });
  async function invalidate() {
    await Promise.all([
      client.invalidateQueries({ queryKey: ['categories'] }),
      client.invalidateQueries({ queryKey: ['dashboard'] }),
    ]);
  }
  const save = useMutation({
    mutationFn: ({
      input,
      category,
    }: {
      input: CategoryInput;
      category: Category | null;
    }) =>
      category ? updateCategory(category.id, input) : createCategory(input),
    onSuccess: async (_, variables) => {
      await invalidate();
      setFormOpen(false);
      setEditing(null);
      setFeedback(
        variables.category
          ? 'Kategori berhasil diperbarui.'
          : 'Kategori berhasil ditambahkan.',
      );
    },
    onError: (error) => {
      setMutationError(getCategoryErrorMessage(error));
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) => deactivateCategory(id),
    onSuccess: async () => {
      await invalidate();
      setDeleting(null);
      setFeedback('Kategori berhasil dinonaktifkan.');
    },
    onError: (error) => {
      setMutationError(getCategoryErrorMessage(error));
    },
  });
  async function submit(values: CategoryFormValues) {
    setMutationError(null);
    const input: CategoryInput = {
      name: values.name,
      type: values.type,
      icon: values.icon || null,
      color: values.color || null,
    };
    await save.mutateAsync({ input, category: editing }).catch(() => undefined);
  }
  const openCreate = () => {
    setEditing(null);
    setMutationError(null);
    setFormOpen(true);
  };

  return (
    <AppLayout>
      <main className="dashboard-content">
        <header className="dashboard-heading account-heading">
          <div>
            <p className="section-kicker">Atur klasifikasi</p>
            <h1>Kategori</h1>
            <p>Pisahkan setiap aliran pemasukan dan pengeluaran dengan rapi.</p>
          </div>
          <button
            className="primary-link link-button"
            type="button"
            onClick={openCreate}
          >
            <PlusIcon />
            Tambah kategori
          </button>
        </header>
        {feedback ? (
          <p className="form-success" role="status">
            {feedback}
          </p>
        ) : null}
        {categories.isPending ? (
          <div
            className="category-columns"
            role="status"
            aria-label="Memuat kategori"
          >
            <div className="skeleton category-skeleton" />
            <div className="skeleton category-skeleton" />
          </div>
        ) : null}
        {categories.isError ? (
          <section className="dashboard-error" role="alert">
            <span className="error-symbol" aria-hidden="true">
              !
            </span>
            <div>
              <h2>Kategori belum dapat dimuat</h2>
              <p>{getCategoryErrorMessage(categories.error)}</p>
            </div>
            <button
              className="secondary-button"
              type="button"
              onClick={() => void categories.refetch()}
            >
              Coba lagi
            </button>
          </section>
        ) : null}
        {categories.data ? (
          <CategoryContent
            categories={categories.data}
            onCreate={openCreate}
            onEdit={(category) => {
              setMutationError(null);
              setEditing(category);
              setFormOpen(true);
            }}
            onDelete={(category) => {
              setMutationError(null);
              setDeleting(category);
            }}
          />
        ) : null}
      </main>
      {formOpen ? (
        <CategoryFormDialog
          category={editing}
          pending={save.isPending}
          error={mutationError}
          onCancel={() => {
            setFormOpen(false);
          }}
          onSubmit={submit}
        />
      ) : null}
      {deleting ? (
        <CategoryDeleteDialog
          category={deleting}
          pending={remove.isPending}
          error={mutationError}
          onCancel={() => {
            setDeleting(null);
          }}
          onConfirm={() => {
            remove.mutate(deleting.id);
          }}
        />
      ) : null}
    </AppLayout>
  );
}

function CategoryContent({
  categories,
  onCreate,
  onEdit,
  onDelete,
}: {
  categories: Category[];
  onCreate: () => void;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
}) {
  if (categories.length === 0)
    return (
      <section className="dashboard-empty account-empty">
        <p className="section-kicker">Belum ada kategori</p>
        <h2>Tambahkan kategori custom pertamamu.</h2>
        <p>
          Kategori bawaan sistem akan muncul otomatis ketika tersedia dari
          backend.
        </p>
        <button
          className="primary-link link-button"
          type="button"
          onClick={onCreate}
        >
          <PlusIcon />
          Tambah kategori
        </button>
      </section>
    );
  return (
    <div className="category-columns">
      <CategoryGroup
        title="Pemasukan"
        type="INCOME"
        categories={categories.filter((item) => item.type === 'INCOME')}
        onEdit={onEdit}
        onDelete={onDelete}
      />
      <CategoryGroup
        title="Pengeluaran"
        type="EXPENSE"
        categories={categories.filter((item) => item.type === 'EXPENSE')}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  );
}

function CategoryGroup({
  title,
  type,
  categories,
  onEdit,
  onDelete,
}: {
  title: string;
  type: CategoryType;
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
}) {
  return (
    <section
      className="content-card category-group"
      aria-labelledby={`category-${type}`}
    >
      <header className="category-group-heading">
        <div>
          <span
            className={`category-flow ${type === 'INCOME' ? 'category-income' : 'category-expense'}`}
            aria-hidden="true"
          >
            {type === 'INCOME' ? '+' : '−'}
          </span>
          <h2 id={`category-${type}`}>{title}</h2>
        </div>
        <span>{categories.length} kategori</span>
      </header>
      {categories.length === 0 ? (
        <p className="category-group-empty">
          Belum ada kategori {title.toLowerCase()}.
        </p>
      ) : (
        <ul className="category-list">
          {categories.map((category) => (
            <li
              key={category.id}
              className={category.isActive ? '' : 'category-inactive'}
            >
              <span className="category-symbol" aria-hidden="true">
                {typeof category.icon === 'string' && category.icon
                  ? category.icon.slice(0, 2).toUpperCase()
                  : category.name.charAt(0).toUpperCase()}
              </span>
              <div>
                <strong>{category.name}</strong>
                <span>
                  {category.isDefault ? 'Bawaan sistem' : 'Custom'} ·{' '}
                  {category.isActive ? 'Aktif' : 'Nonaktif'}
                </span>
              </div>
              {category.isDefault ? (
                <span className="status-badge status-system">Sistem</span>
              ) : category.isActive ? (
                <div className="category-actions">
                  <button
                    type="button"
                    onClick={() => {
                      onEdit(category);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onDelete(category);
                    }}
                  >
                    Nonaktifkan
                  </button>
                </div>
              ) : (
                <span className="status-badge status-inactive">Nonaktif</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
