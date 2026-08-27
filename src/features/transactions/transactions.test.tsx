import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { PropsWithChildren } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setApiAccessToken } from '../../lib/api/api-client';
import { AuthContext, type AuthContextValue } from '../auth/auth-context';
import { TransactionFormPage } from './transaction-form-page';
import { TransactionsPage } from './transactions-page';

const accountId = '11111111-1111-4111-8111-111111111111';
const categoryId = '22222222-2222-4222-8222-222222222222';
const transactionId = '33333333-3333-4333-8333-333333333333';
const transaction = {
  id: transactionId,
  type: 'EXPENSE',
  amount: '9007199254740993.25',
  transactionDate: '2026-08-26',
  note: 'Kopi',
  createdAt: '',
  updatedAt: '',
  account: { id: accountId, name: 'Bank', type: 'BANK', isActive: true },
  category: {
    id: categoryId,
    name: 'Makanan',
    type: 'EXPENSE',
    icon: null,
    color: null,
    isDefault: true,
    isActive: true,
  },
} as const;
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
function url(input: RequestInfo | URL) {
  return input instanceof URL
    ? input.toString()
    : input instanceof Request
      ? input.url
      : input;
}
function Wrapper({
  children,
  route = '/transactions',
}: PropsWithChildren<{ route?: string }>) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  return (
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[route]}>
        <AuthContext value={auth}>{children}</AuthContext>
      </MemoryRouter>
    </QueryClientProvider>
  );
}
function renderRoutes(route = '/transactions') {
  return render(
    <Routes>
      <Route path="/transactions" element={<TransactionsPage />} />
      <Route path="/transactions/new" element={<TransactionFormPage />} />
      <Route path="/transactions/:id" element={<TransactionFormPage />} />
    </Routes>,
    { wrapper: ({ children }) => <Wrapper route={route}>{children}</Wrapper> },
  );
}

describe('transaction management', () => {
  beforeEach(() => {
    setApiAccessToken('token');
  });
  afterEach(() => {
    setApiAccessToken(null);
    vi.unstubAllGlobals();
  });
  it('renders precise money, date, type, pagination and combined URL filters', async () => {
    const fetchMock = vi.fn<typeof fetch>((input) => {
      const path = url(input);
      if (path.includes('/accounts') || path.includes('/categories'))
        return Promise.resolve(json([]));
      return Promise.resolve(
        json({
          data: [transaction, { ...transaction, id: 'income', type: 'INCOME' }],
          page: 1,
          limit: 20,
          total: 2,
          totalPages: 2,
        }),
      );
    });
    vi.stubGlobal('fetch', fetchMock);
    renderRoutes();
    expect(
      await screen.findAllByText(/Rp9.007.199.254.740.993,25/),
    ).toHaveLength(2);
    expect(screen.getAllByText(/26 Agu 2026/)).toHaveLength(2);
    await userEvent.click(screen.getByRole('combobox', { name: 'Tipe' }));
    await userEvent.click(screen.getByRole('option', { name: 'Pengeluaran' }));
    await userEvent.click(screen.getByRole('combobox', { name: 'Urutkan' }));
    await userEvent.click(
      screen.getByRole('option', { name: 'Nominal terkecil' }),
    );
    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some(([input]) => {
          const parsed = new URL(url(input));
          return (
            parsed.searchParams.get('type') === 'EXPENSE' &&
            parsed.searchParams.get('sort') === 'amount:asc'
          );
        }),
      ).toBe(true);
    });
    expect(screen.getByRole('button', { name: /reset filter/i })).toBeVisible();
  });
  it('shows loading, error/retry, initial empty and filtered empty states', async () => {
    let resolveFetch: ((response: Response) => void) | undefined;
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const path = url(input);
      if (path.includes('/accounts') || path.includes('/categories'))
        return Promise.resolve(json([]));
      return new Promise<Response>((resolve) => {
        resolveFetch = resolve;
      });
    });
    vi.stubGlobal('fetch', fetchMock);
    renderRoutes();
    expect(
      screen.getByRole('status', { name: /memuat transaksi/i }),
    ).toBeVisible();
    resolveFetch?.(json({}, 500));
    expect(
      await screen.findByText(/server sedang mengalami gangguan/i),
    ).toBeVisible();
    fetchMock.mockResolvedValueOnce(
      json({ data: [], page: 1, limit: 20, total: 0, totalPages: 0 }),
    );
    await userEvent.click(screen.getByRole('button', { name: /coba lagi/i }));
    expect(await screen.findByText(/catat aliran pertamamu/i)).toBeVisible();
  });
  it('validates create form, filters active resources by type, and preserves decimal strings', async () => {
    const fetchMock = vi.fn(
      (input: RequestInfo | URL, options?: RequestInit) => {
        const path = url(input);
        if (path.includes('/accounts'))
          return Promise.resolve(
            json([
              {
                id: accountId,
                name: 'Bank',
                type: 'BANK',
                initialBalance: '0',
                currentBalance: '0',
                isActive: true,
                createdAt: '',
                updatedAt: '',
              },
              {
                id: 'inactive',
                name: 'Lama',
                type: 'CASH',
                initialBalance: '0',
                currentBalance: '0',
                isActive: false,
                createdAt: '',
                updatedAt: '',
              },
            ]),
          );
        if (path.includes('/categories'))
          return Promise.resolve(
            json([
              { ...transaction.category },
              {
                ...transaction.category,
                id: 'income-cat',
                name: 'Gaji',
                type: 'INCOME',
              },
            ]),
          );
        if (options?.method === 'POST')
          return Promise.resolve(json(transaction, 201));
        return Promise.resolve(
          json({ data: [], page: 1, limit: 20, total: 0, totalPages: 0 }),
        );
      },
    );
    vi.stubGlobal('fetch', fetchMock);
    renderRoutes('/transactions/new');
    await userEvent.click(screen.getByRole('combobox', { name: 'Account' }));
    await screen.findByRole('option', { name: 'Bank' });
    expect(
      screen.queryByRole('option', { name: 'Lama' }),
    ).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('option', { name: 'Bank' }));
    await userEvent.click(screen.getByRole('combobox', { name: 'Kategori' }));
    expect(screen.getByRole('option', { name: 'Makanan' })).toBeVisible();
    expect(
      screen.queryByRole('option', { name: 'Gaji' }),
    ).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('option', { name: 'Makanan' }));
    await userEvent.click(
      screen.getByRole('button', { name: /simpan transaksi/i }),
    );
    expect(
      await screen.findByText(/nominal harus lebih dari nol/i),
    ).toBeVisible();
    await userEvent.type(
      screen.getByLabelText('Nominal'),
      '9007199254740993.25',
    );
    await userEvent.click(screen.getByRole('combobox', { name: 'Account' }));
    await userEvent.click(screen.getByRole('option', { name: 'Bank' }));
    await userEvent.click(screen.getByRole('combobox', { name: 'Kategori' }));
    await userEvent.click(screen.getByRole('option', { name: 'Makanan' }));
    await userEvent.click(
      screen.getByRole('button', { name: /simpan transaksi/i }),
    );
    await waitFor(() => {
      const call = fetchMock.mock.calls.find(
        ([, options]) => options?.method === 'POST',
      );
      expect(typeof call?.[1]?.body === 'string' ? call[1].body : '').toContain(
        '9007199254740993.25',
      );
    });
  });
  it('duplicates, soft deletes, restores, and invalidates related data', async () => {
    const fetchMock = vi.fn(
      (input: RequestInfo | URL, options?: RequestInit) => {
        const path = url(input);
        if (path.includes('/accounts') || path.includes('/categories'))
          return Promise.resolve(json([]));
        if (path.includes('/duplicate'))
          return Promise.resolve(
            json({ ...transaction, id: 'duplicate-id' }, 201),
          );
        if (path.includes('/restore'))
          return Promise.resolve(json(transaction));
        if (options?.method === 'DELETE')
          return Promise.resolve(new Response(null, { status: 204 }));
        return Promise.resolve(
          json({
            data: [transaction],
            page: 1,
            limit: 20,
            total: 1,
            totalPages: 1,
          }),
        );
      },
    );
    vi.stubGlobal('fetch', fetchMock);
    renderRoutes();
    await userEvent.click(
      await screen.findByRole('button', { name: 'Duplikat' }),
    );
    expect(await screen.findByText(/berhasil diduplikasi/i)).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Hapus' }));
    expect(screen.getByRole('dialog')).toHaveTextContent(
      /dapat memulihkannya/i,
    );
    await userEvent.click(screen.getByRole('button', { name: /ya, hapus/i }));
    await userEvent.click(
      await screen.findByRole('button', { name: /undo hapus/i }),
    );
    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some(([input]) => url(input).includes('/restore')),
      ).toBe(true);
    });
  });
});
