import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { PropsWithChildren } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthProvider } from '../auth/auth-provider';
import { ProtectedRoute } from '../auth/auth-route';
import { AuthContext, type AuthContextValue } from '../auth/auth-context';
import { setApiAccessToken } from '../../lib/api/api-client';
import { DashboardPage } from './dashboard-page';

vi.mock('react-chartjs-2', () => ({
  Doughnut: () => <div data-testid="expense-doughnut" />,
}));

const testUser = {
  id: '5b9a82bd-e08f-4c93-a947-6f29bb680cef',
  email: 'user@example.com',
  currency: 'IDR',
  timezone: 'Asia/Jakarta',
  createdAt: '2026-08-26T00:00:00.000Z',
  updatedAt: '2026-08-26T00:00:00.000Z',
};

const summary = {
  month: 8,
  year: 2026,
  totalBalance: '1500000.00',
  monthlyIncome: '2500000.00',
  monthlyExpense: '1000000.00',
  netSaving: '1500000.00',
  incomeComparison: { previous: '2000000.00', percentageChange: '25.00' },
  expenseComparison: { previous: '800000.00', percentageChange: '25.00' },
  netSavingComparison: { previous: '1200000.00', percentageChange: '25.00' },
};

const breakdown = {
  month: 8,
  year: 2026,
  type: 'EXPENSE',
  total: '1000000.00',
  data: [
    {
      categoryId: '4e191799-4e36-4434-a9c1-3219acc9684d',
      name: 'Makanan',
      icon: null,
      color: null,
      total: '600000.00',
      percentage: '60.00',
    },
    {
      categoryId: '974cf8fb-d98c-43ab-8373-b2a8e4cd8254',
      name: 'Transportasi',
      icon: null,
      color: null,
      total: '400000.00',
      percentage: '40.00',
    },
  ],
};

const recent = [
  {
    id: 'e7919374-501b-499e-afc2-f241453fd6be',
    type: 'INCOME',
    amount: '2500000.00',
    transactionDate: '2026-08-25',
    note: 'Gaji Agustus',
    createdAt: '2026-08-25T08:00:00.000Z',
    account: {
      id: '8cb75313-e55a-4b76-a451-66088662963b',
      name: 'Bank Utama',
      type: 'BANK',
    },
    category: {
      id: '38875fa3-c97e-480d-9780-3be446684741',
      name: 'Gaji',
      icon: null,
      color: null,
    },
  },
  {
    id: 'af140698-c377-4e71-89f0-a46c578477ba',
    type: 'EXPENSE',
    amount: '75000.50',
    transactionDate: '2026-08-24',
    note: null,
    createdAt: '2026-08-24T08:00:00.000Z',
    account: {
      id: '8cb75313-e55a-4b76-a451-66088662963b',
      name: 'Bank Utama',
      type: 'BANK',
    },
    category: {
      id: '4e191799-4e36-4434-a9c1-3219acc9684d',
      name: 'Makanan',
      icon: null,
      color: null,
    },
  },
] as const;

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function successfulFetch(input: RequestInfo | URL): Promise<Response> {
  const url = getRequestUrl(input);
  if (url.includes('/dashboard/summary'))
    return Promise.resolve(jsonResponse(summary));
  if (url.includes('/dashboard/category-breakdown'))
    return Promise.resolve(jsonResponse(breakdown));
  if (url.includes('/dashboard/recent-transactions'))
    return Promise.resolve(jsonResponse(recent));
  return Promise.resolve(jsonResponse({ message: 'Not found' }, 404));
}

function TestProviders({ children }: PropsWithChildren) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  const authValue: AuthContextValue = {
    user: testUser,
    isBootstrapping: false,
    login: vi.fn(),
    logout: vi.fn(),
    syncUser: vi.fn(),
  };

  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/dashboard']}>
        <AuthContext value={authValue}>{children}</AuthContext>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

function renderDashboard() {
  return render(<DashboardPage />, { wrapper: TestProviders });
}

describe('DashboardPage', () => {
  beforeEach(() => {
    setApiAccessToken('access-token');
    vi.stubGlobal('fetch', vi.fn(successfulFetch));
  });

  afterEach(() => {
    setApiAccessToken(null);
    sessionStorage.clear();
    vi.unstubAllGlobals();
  });

  it('renders API summary, category breakdown, and recent transactions', async () => {
    renderDashboard();

    expect(await screen.findAllByText('Rp1.500.000')).toHaveLength(2);
    expect(screen.getByRole('heading', { name: /net saving/i })).toBeVisible();
    expect(screen.getByText('Rp2.500.000')).toBeVisible();
    expect(screen.getAllByText('Rp1.000.000')).toHaveLength(2);
    expect(screen.getByTestId('expense-doughnut')).toBeInTheDocument();
    expect(screen.getAllByText('Makanan')).toHaveLength(2);
    expect(screen.getByText('60.00%')).toBeVisible();
    expect(screen.getByText('Gaji')).toBeVisible();
    expect(screen.getByText('+Rp2.500.000')).toBeVisible();
    expect(screen.getByText('−Rp75.000,5')).toBeVisible();
    expect(screen.getByText(/25 Agu 2026/i)).toBeVisible();
    expect(screen.getByText('Gaji Agustus')).toBeVisible();
    expect(
      screen.getAllByRole('link', { name: /edit transaksi: gaji/i })[0],
    ).toHaveAttribute('href', `/transactions/${recent[0].id}`);
    expect(
      screen.getAllByRole('button', { name: /duplikat transaksi:/i }),
    ).toHaveLength(2);
    expect(screen.getByText('+', { selector: '.ledger-sign' })).toBeVisible();
    expect(screen.getByText('−', { selector: '.ledger-sign' })).toBeVisible();
    expect(screen.getByText('=', { selector: '.ledger-sign' })).toBeVisible();
  });

  it('renders high-precision decimal strings without numeric conversion', async () => {
    const preciseAmount = '900719925474099312345678.12';
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL) => {
        const url = getRequestUrl(input);
        if (url.includes('/dashboard/summary')) {
          return Promise.resolve(
            jsonResponse({ ...summary, totalBalance: preciseAmount }),
          );
        }
        return successfulFetch(input);
      }),
    );

    renderDashboard();

    expect(
      await screen.findByText('Rp900.719.925.474.099.312.345.678,12'),
    ).toBeVisible();
  });

  it('opens Quick Add from the dashboard and focuses the amount field', async () => {
    renderDashboard();
    await screen.findAllByText('Rp1.500.000');
    await userEvent.click(
      within(screen.getByLabelText('Aksi cepat')).getByRole('button', {
        name: 'Tambah transaksi',
      }),
    );
    expect(screen.getByRole('dialog')).toHaveTextContent(/tambah transaksi/i);
    expect(screen.getByLabelText('Nominal')).toHaveFocus();
    await userEvent.click(
      screen.getByRole('button', { name: /tutup tambah transaksi/i }),
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('confirms a Quick Add and lets the user undo it', async () => {
    const fetchMock = vi.fn(
      (input: RequestInfo | URL, options?: RequestInit) => {
        const requestUrl = getRequestUrl(input);
        if (requestUrl.includes('/accounts')) {
          return Promise.resolve(
            jsonResponse([
              {
                id: recent[0].account.id,
                name: 'Bank Utama',
                type: 'BANK',
                initialBalance: '0',
                currentBalance: '0',
                isActive: true,
                createdAt: '',
                updatedAt: '',
              },
            ]),
          );
        }
        if (requestUrl.includes('/categories')) {
          return Promise.resolve(
            jsonResponse([
              {
                id: recent[1].category.id,
                name: 'Makanan',
                type: 'EXPENSE',
                icon: null,
                color: null,
                isDefault: true,
                isActive: true,
                createdAt: '',
                updatedAt: '',
              },
            ]),
          );
        }
        if (options?.method === 'POST')
          return Promise.resolve(jsonResponse(recent[1], 201));
        if (options?.method === 'DELETE')
          return Promise.resolve(new Response(null, { status: 204 }));
        return successfulFetch(input);
      },
    );
    vi.stubGlobal('fetch', fetchMock);
    renderDashboard();
    await screen.findAllByText('Rp1.500.000');
    await userEvent.click(
      within(screen.getByLabelText('Aksi cepat')).getByRole('button', {
        name: 'Tambah transaksi',
      }),
    );
    await userEvent.type(screen.getByLabelText('Nominal'), '75000');
    await userEvent.click(screen.getByRole('combobox', { name: 'Account' }));
    await userEvent.click(screen.getByRole('option', { name: 'Bank Utama' }));
    await userEvent.click(screen.getByRole('combobox', { name: 'Kategori' }));
    await userEvent.click(screen.getByRole('option', { name: 'Makanan' }));
    await userEvent.click(
      screen.getByRole('button', { name: 'Simpan transaksi' }),
    );
    expect(
      await screen.findByText(/transaksi berhasil ditambahkan/i),
    ).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(await screen.findByText(/transaksi dibatalkan/i)).toBeVisible();
    expect(
      fetchMock.mock.calls.some(([, options]) => options?.method === 'DELETE'),
    ).toBe(true);
  });

  it('updates period queries without adding unsupported params to recent', async () => {
    const fetchMock = vi.mocked(fetch);
    renderDashboard();
    await screen.findAllByText('Rp1.500.000');
    fetchMock.mockClear();

    fireEvent.change(screen.getByLabelText(/pilih periode dashboard/i), {
      target: { value: '2025-07' },
    });

    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some(([input]) => {
          const url = new URL(getRequestUrl(input));
          return (
            url.pathname.endsWith('/dashboard/summary') &&
            url.searchParams.get('month') === '7' &&
            url.searchParams.get('year') === '2025'
          );
        }),
      ).toBe(true);
    });
    expect(
      fetchMock.mock.calls.some(([input]) =>
        getRequestUrl(input).includes('/dashboard/recent-transactions'),
      ),
    ).toBe(false);
  });

  it('shows loading skeletons while API requests are pending', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise<Response>(() => undefined)),
    );

    renderDashboard();

    expect(
      screen.getByRole('status', { name: /memuat dashboard/i }),
    ).toBeVisible();
    expect(screen.queryByText('Rp1.500.000')).not.toBeInTheDocument();
  });

  it('shows an error and retries every dashboard request', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse({ message: 'Server error' }, 500));
    vi.stubGlobal('fetch', fetchMock);
    renderDashboard();

    await userEvent.click(
      await screen.findByRole('button', { name: /coba lagi/i }),
    );
    expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(6);
  });

  it('shows a new-user empty state without fake financial data', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL) => {
        const url = getRequestUrl(input);
        if (url.includes('/dashboard/summary')) {
          return Promise.resolve(
            jsonResponse({
              ...summary,
              totalBalance: '0.00',
              monthlyIncome: '0.00',
              monthlyExpense: '0.00',
              netSaving: '0.00',
            }),
          );
        }
        if (url.includes('/dashboard/category-breakdown')) {
          return Promise.resolve(
            jsonResponse({ ...breakdown, total: '0.00', data: [] }),
          );
        }
        return Promise.resolve(jsonResponse([]));
      }),
    );

    renderDashboard();

    expect(
      await screen.findByRole('heading', { name: /dashboard siap/i }),
    ).toBeVisible();
    expect(
      screen.getByRole('link', { name: /tambah account/i }),
    ).toHaveAttribute('href', '/accounts/new');
    expect(
      screen
        .getAllByRole('link', { name: /tambah transaksi/i })
        .some((link) => link.getAttribute('href') === '/transactions/new'),
    ).toBe(true);
  });

  it('uses the existing 401 refresh-and-retry flow', async () => {
    let summaryCalls = 0;
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = getRequestUrl(input);
      if (url.includes('/dashboard/summary')) {
        summaryCalls += 1;
        return Promise.resolve(
          summaryCalls === 1
            ? jsonResponse({ message: 'Unauthorized' }, 401)
            : jsonResponse(summary),
        );
      }
      if (url.includes('/auth/refresh')) {
        return Promise.resolve(
          jsonResponse({ accessToken: 'refreshed-token' }),
        );
      }
      return successfulFetch(input);
    });
    vi.stubGlobal('fetch', fetchMock);

    renderDashboard();

    expect(await screen.findAllByText('Rp1.500.000')).toHaveLength(2);
    expect(
      fetchMock.mock.calls.filter(([input]) =>
        getRequestUrl(input).includes('/auth/refresh'),
      ),
    ).toHaveLength(1);
    expect(summaryCalls).toBe(2);
  });

  it('does not request dashboard data before auth bootstrap completes', async () => {
    let resolveRefresh: ((response: Response) => void) | undefined;
    const refreshResponse = new Promise<Response>((resolve) => {
      resolveRefresh = resolve;
    });
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = getRequestUrl(input);
      if (url.includes('/auth/refresh')) return refreshResponse;
      if (url.includes('/auth/me'))
        return Promise.resolve(jsonResponse(testUser));
      return successfulFetch(input);
    });
    vi.stubGlobal('fetch', fetchMock);
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/dashboard']}>
          <AuthProvider>
            <Routes>
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<DashboardPage />} />
              </Route>
              <Route path="/login" element={<p>Login</p>} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledOnce();
    });
    expect(
      fetchMock.mock.calls.some(([input]) =>
        getRequestUrl(input).includes('/dashboard/'),
      ),
    ).toBe(false);

    resolveRefresh?.(
      jsonResponse({ accessToken: 'access-token', user: testUser }),
    );
    expect(await screen.findAllByText('Rp1.500.000')).toHaveLength(2);
  });
});

function getRequestUrl(input: RequestInfo | URL | undefined): string {
  if (input instanceof URL) return input.toString();
  if (input instanceof Request) return input.url;
  return input ?? '';
}
