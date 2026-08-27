import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { PropsWithChildren } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { setApiAccessToken } from '../../lib/api/api-client';
import { AuthContext, type AuthContextValue } from '../auth/auth-context';
import { CategoriesPage } from './categories-page';

const categories = [
  {
    id: 'default-income',
    name: 'Gaji',
    type: 'INCOME',
    icon: null,
    color: null,
    isDefault: true,
    isActive: true,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
  {
    id: 'custom-expense',
    name: 'Kopi',
    type: 'EXPENSE',
    icon: 'cup',
    color: '#EF4444',
    isDefault: false,
    isActive: true,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
] as const;
const auth: AuthContextValue = {
  user: {
    id: 'user',
    email: 'user@example.com',
    currency: 'IDR',
    timezone: 'Asia/Jakarta',
    createdAt: '',
    updatedAt: '',
  },
  isBootstrapping: false,
  login: vi.fn(),
  logout: vi.fn(),
  syncUser: vi.fn(),
};
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
function Wrapper({ children }: PropsWithChildren) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  return (
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <AuthContext value={auth}>{children}</AuthContext>
      </MemoryRouter>
    </QueryClientProvider>
  );
}
function renderPage() {
  return render(<CategoriesPage />, { wrapper: Wrapper });
}

describe('CategoriesPage', () => {
  beforeEach(() => {
    setApiAccessToken('token');
  });
  afterEach(() => {
    setApiAccessToken(null);
    vi.unstubAllGlobals();
  });

  it('separates income and expense and protects system categories', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json(categories)));
    renderPage();
    expect(
      await screen.findByRole('heading', { name: 'Pemasukan' }),
    ).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Pengeluaran' })).toBeVisible();
    expect(screen.getByText('Gaji')).toBeVisible();
    expect(screen.getByText('Sistem')).toBeVisible();
    expect(screen.getAllByRole('button', { name: 'Edit' })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: 'Nonaktifkan' })).toHaveLength(
      1,
    );
  });

  it('handles loading, error retry, and empty state', async () => {
    let resolveFetch: ((response: Response) => void) | undefined;
    const fetchMock = vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        }),
    );
    vi.stubGlobal('fetch', fetchMock);
    renderPage();
    expect(
      screen.getByRole('status', { name: /memuat kategori/i }),
    ).toBeVisible();
    resolveFetch?.(json({}, 500));
    expect(
      await screen.findByText(/server sedang mengalami gangguan/i),
    ).toBeVisible();
    fetchMock.mockResolvedValueOnce(json([]));
    await userEvent.click(screen.getByRole('button', { name: /coba lagi/i }));
    expect(
      await screen.findByRole('heading', {
        name: /kategori custom pertamamu/i,
      }),
    ).toBeVisible();
  });

  it('validates and creates a custom category then invalidates the list', async () => {
    let gets = 0;
    const fetchMock = vi.fn(
      (_input: RequestInfo | URL, options?: RequestInit) => {
        if (options?.method === 'POST')
          return Promise.resolve(json(categories[1], 201));
        gets += 1;
        return Promise.resolve(json(gets === 1 ? [] : categories));
      },
    );
    vi.stubGlobal('fetch', fetchMock);
    renderPage();
    await userEvent.click(
      await screen.findByRole('button', { name: /tambah kategori/i }),
    );
    await userEvent.click(
      screen.getByRole('button', { name: /simpan kategori/i }),
    );
    expect(await screen.findByText(/nama kategori wajib/i)).toBeVisible();
    await userEvent.type(screen.getByLabelText('Nama'), 'Kopi');
    await userEvent.type(screen.getByLabelText(/warna hex/i), 'merah');
    await userEvent.click(
      screen.getByRole('button', { name: /simpan kategori/i }),
    );
    expect(await screen.findByText(/format warna hex/i)).toBeVisible();
    await userEvent.clear(screen.getByLabelText(/warna hex/i));
    await userEvent.type(screen.getByLabelText(/warna hex/i), '#EF4444');
    await userEvent.click(
      screen.getByRole('button', { name: /simpan kategori/i }),
    );
    expect(await screen.findByText(/berhasil ditambahkan/i)).toBeVisible();
    expect(gets).toBeGreaterThanOrEqual(2);
  });

  it('updates and deactivates custom categories with confirmation and safe conflict errors', async () => {
    const fetchMock = vi.fn(
      (_input: RequestInfo | URL, options?: RequestInit) => {
        if (options?.method === 'PATCH')
          return Promise.resolve(json({ ...categories[1], name: 'Ngopi' }));
        if (options?.method === 'DELETE')
          return Promise.resolve(new Response(null, { status: 204 }));
        return Promise.resolve(json(categories));
      },
    );
    vi.stubGlobal('fetch', fetchMock);
    renderPage();
    const [editButton] = await screen.findAllByRole('button', { name: 'Edit' });
    if (!editButton) throw new Error('Expected an edit button');
    await userEvent.click(editButton);
    const name = screen.getByLabelText('Nama');
    await userEvent.clear(name);
    await userEvent.type(name, 'Ngopi');
    await userEvent.click(
      screen.getByRole('button', { name: /simpan kategori/i }),
    );
    expect(await screen.findByText(/berhasil diperbarui/i)).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Nonaktifkan' }));
    expect(screen.getByRole('dialog')).toHaveTextContent(
      /riwayat transaksi lama/i,
    );
    await userEvent.click(
      screen.getByRole('button', { name: /ya, nonaktifkan/i }),
    );
    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some(
          ([, options]) => options?.method === 'DELETE',
        ),
      ).toBe(true);
    });
  });
});
