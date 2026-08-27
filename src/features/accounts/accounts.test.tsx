import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { PropsWithChildren } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError, setApiAccessToken } from '../../lib/api/api-client';
import { AuthContext, type AuthContextValue } from '../auth/auth-context';
import { AccountDetailPage } from './account-detail-page';
import { getAccountErrorMessage } from './account-error';
import { AccountsPage } from './accounts-page';
import { CreateAccountPage } from './create-account-page';

const testUser = {
  id: '5b9a82bd-e08f-4c93-a947-6f29bb680cef',
  email: 'user@example.com',
  currency: 'IDR',
  timezone: 'Asia/Jakarta',
  createdAt: '2026-08-26T00:00:00.000Z',
  updatedAt: '2026-08-26T00:00:00.000Z',
};

const preciseAccount = {
  id: '8cb75313-e55a-4b76-a451-66088662963b',
  name: 'Bank Utama',
  type: 'BANK',
  initialBalance: '9007199254740993.25',
  currentBalance: '9007199254740993.75',
  isActive: true,
  createdAt: '2026-08-26T00:00:00.000Z',
  updatedAt: '2026-08-26T00:00:00.000Z',
} as const;

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function TestProviders({
  children,
  route = '/accounts',
}: PropsWithChildren<{ route?: string }>) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  const auth: AuthContextValue = {
    user: testUser,
    isBootstrapping: false,
    login: vi.fn(),
    logout: vi.fn(),
    syncUser: vi.fn(),
  };
  return (
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[route]}>
        <AuthContext value={auth}>{children}</AuthContext>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

function renderRoutes(route = '/accounts') {
  return render(
    <Routes>
      <Route path="/accounts" element={<AccountsPage />} />
      <Route path="/accounts/new" element={<CreateAccountPage />} />
      <Route path="/accounts/:id" element={<AccountDetailPage />} />
    </Routes>,
    {
      wrapper: ({ children }) => (
        <TestProviders route={route}>{children}</TestProviders>
      ),
    },
  );
}

function requestUrl(input: RequestInfo | URL | undefined) {
  if (input instanceof URL) return input.toString();
  if (input instanceof Request) return input.url;
  return input ?? '';
}

function parseJsonBody(body: BodyInit | null | undefined): unknown {
  if (typeof body !== 'string') throw new Error('Expected a JSON string body');
  return JSON.parse(body) as unknown;
}

describe('account management', () => {
  beforeEach(() => {
    setApiAccessToken('access-token');
  });
  afterEach(() => {
    setApiAccessToken(null);
    vi.unstubAllGlobals();
  });

  it('renders account types, status, and precise balances from the API', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse([
          preciseAccount,
          {
            ...preciseAccount,
            id: 'cash-id',
            name: 'Dompet',
            type: 'CASH',
            isActive: false,
          },
          {
            ...preciseAccount,
            id: 'wallet-id',
            name: 'Dana',
            type: 'EWALLET',
          },
        ]),
      ),
    );
    renderRoutes();
    expect(
      (await screen.findAllByText('Rp9.007.199.254.740.993,75'))[0],
    ).toBeVisible();
    expect(screen.getAllByText('Rp9.007.199.254.740.993,25')[0]).toBeVisible();
    expect(screen.getByText('Bank')).toBeVisible();
    expect(screen.getByText('Cash')).toBeVisible();
    expect(screen.getByText('E-Wallet')).toBeVisible();
    expect(screen.getByText('Nonaktif')).toBeVisible();
    expect(screen.getByText(/hanya untuk melihat riwayat/i)).toBeVisible();
  });

  it('handles loading, empty, error, and retry states', async () => {
    let resolveRequest: ((value: Response) => void) | undefined;
    const fetchMock = vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          resolveRequest = resolve;
        }),
    );
    vi.stubGlobal('fetch', fetchMock);
    renderRoutes();
    expect(
      screen.getByRole('status', { name: /memuat account/i }),
    ).toBeVisible();
    resolveRequest?.(jsonResponse({ message: 'Server error' }, 500));
    expect(
      await screen.findByText(/server sedang mengalami gangguan/i),
    ).toBeVisible();
    fetchMock.mockResolvedValueOnce(jsonResponse([]));
    await userEvent.click(screen.getByRole('button', { name: /coba lagi/i }));
    expect(
      await screen.findByRole('heading', { name: /mulai dari tempat uangmu/i }),
    ).toBeVisible();
  });

  it('validates create input and creates an account with the exact decimal string', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse(preciseAccount, 201));
    vi.stubGlobal('fetch', fetchMock);
    renderRoutes('/accounts/new');
    await userEvent.clear(screen.getByLabelText(/nama account/i));
    await userEvent.clear(screen.getByLabelText(/saldo awal/i));
    await userEvent.type(screen.getByLabelText(/saldo awal/i), '-1.234');
    await userEvent.click(
      screen.getByRole('button', { name: /buat account/i }),
    );
    expect(await screen.findByText(/nama account wajib/i)).toBeVisible();
    expect(screen.getByText(/maksimal dua angka desimal/i)).toBeVisible();
    expect(fetchMock).not.toHaveBeenCalled();

    await userEvent.type(
      screen.getByLabelText(/nama account/i),
      'Bank Presisi',
    );
    await userEvent.clear(screen.getByLabelText(/saldo awal/i));
    await userEvent.type(
      screen.getByLabelText(/saldo awal/i),
      '9007199254740993.25',
    );
    await userEvent.click(screen.getByRole('radio', { name: 'E-Wallet' }));
    await userEvent.click(
      screen.getByRole('button', { name: /buat account/i }),
    );
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });
    const [, options] = fetchMock.mock.calls[0] ?? [];
    expect(options?.method).toBe('POST');
    expect(parseJsonBody(options?.body)).toEqual({
      name: 'Bank Presisi',
      type: 'EWALLET',
      initialBalance: '9007199254740993.25',
    });
  });

  it('loads detail, updates fields, and refetches account queries', async () => {
    let listCalls = 0;
    const fetchMock = vi.fn(
      (input: RequestInfo | URL, options?: RequestInit) => {
        const url = requestUrl(input);
        if (options?.method === 'PATCH')
          return Promise.resolve(
            jsonResponse({ ...preciseAccount, name: 'Bank Baru' }),
          );
        if (url.endsWith(`/accounts/${preciseAccount.id}`))
          return Promise.resolve(jsonResponse(preciseAccount));
        listCalls += 1;
        return Promise.resolve(
          jsonResponse([{ ...preciseAccount, name: 'Bank Baru' }]),
        );
      },
    );
    vi.stubGlobal('fetch', fetchMock);
    renderRoutes(`/accounts/${preciseAccount.id}`);
    const name = await screen.findByLabelText(/nama account/i);
    expect(screen.getByText('Rp9.007.199.254.740.993,75')).toBeVisible();
    await userEvent.clear(name);
    await userEvent.type(name, 'Bank Baru');
    await userEvent.click(
      screen.getByRole('button', { name: /simpan perubahan/i }),
    );
    expect(
      await screen.findByText(/perubahan account berhasil/i),
    ).toBeVisible();
    expect(listCalls).toBeGreaterThanOrEqual(1);
    const patchCall = fetchMock.mock.calls.find(
      ([, options]) => options?.method === 'PATCH',
    );
    expect(parseJsonBody(patchCall?.[1]?.body)).toMatchObject({
      name: 'Bank Baru',
      initialBalance: preciseAccount.initialBalance,
    });
  });

  it('shows deactivate impact, completes deactivation, and invalidates the list', async () => {
    let getCalls = 0;
    const fetchMock = vi.fn(
      (_input: RequestInfo | URL, options?: RequestInit) => {
        if (options?.method === 'DELETE')
          return Promise.resolve(new Response(null, { status: 204 }));
        getCalls += 1;
        return Promise.resolve(
          jsonResponse(
            getCalls === 1
              ? [preciseAccount]
              : [{ ...preciseAccount, isActive: false }],
          ),
        );
      },
    );
    vi.stubGlobal('fetch', fetchMock);
    renderRoutes();
    await userEvent.click(
      await screen.findByRole('button', { name: /nonaktifkan/i }),
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveTextContent(
      /tidak dapat dipakai untuk transaksi baru/i,
    );
    expect(dialog).toHaveTextContent(
      /riwayat transaksi serta saldo tetap tersimpan/i,
    );
    await userEvent.click(
      screen.getByRole('button', { name: /ya, nonaktifkan/i }),
    );
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(await screen.findByText('Nonaktif')).toBeVisible();
    expect(getCalls).toBeGreaterThanOrEqual(2);
  });

  it('shows safe API errors for conflict and not-found responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse([preciseAccount])),
    );
    renderRoutes();
    await userEvent.click(
      await screen.findByRole('button', { name: /nonaktifkan/i }),
    );
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({ message: 'internal conflict detail' }, 409),
    );
    await userEvent.click(
      screen.getByRole('button', { name: /ya, nonaktifkan/i }),
    );
    expect(
      await screen.findByText(/minimal satu account aktif/i),
    ).toBeVisible();
    expect(
      screen.queryByText(/internal conflict detail/i),
    ).not.toBeInTheDocument();
    expect(getAccountErrorMessage(new ApiError('bad', 400, null))).toMatch(
      /belum valid/i,
    );
    expect(getAccountErrorMessage(new ApiError('bad', 401, null))).toMatch(
      /sesi/i,
    );
    expect(getAccountErrorMessage(new ApiError('bad', 404, null))).toMatch(
      /tidak ditemukan/i,
    );
    expect(getAccountErrorMessage(new ApiError('bad', 429, null))).toMatch(
      /terlalu banyak/i,
    );
    expect(getAccountErrorMessage(new ApiError('bad', 500, null))).toMatch(
      /server/i,
    );
    expect(getAccountErrorMessage(new TypeError('network'))).toMatch(
      /terhubung/i,
    );
  });
});
