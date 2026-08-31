import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { PropsWithChildren } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setApiAccessToken } from '../../lib/api/api-client';
import { AuthContext, type AuthContextValue } from '../auth/auth-context';
import { ProfilePage } from './profile-page';

const profile = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'profile@example.com',
  currency: 'IDR',
  timezone: 'Asia/Jakarta',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};
const syncUser = vi.fn();
const logout = vi.fn().mockResolvedValue(undefined);
const logoutAll = vi.fn().mockResolvedValue(undefined);
const auth: AuthContextValue = {
  user: profile,
  isBootstrapping: false,
  login: vi.fn(),
  logout,
  logoutAll,
  syncUser,
};
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
function requestUrl(input: RequestInfo | URL) {
  return input instanceof URL
    ? input.toString()
    : input instanceof Request
      ? input.url
      : input;
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
  return render(<ProfilePage />, { wrapper: Wrapper });
}

describe('ProfilePage', () => {
  beforeEach(() => {
    setApiAccessToken('token');
    syncUser.mockClear();
    logout.mockClear();
    logoutAll.mockClear();
  });
  afterEach(() => {
    setApiAccessToken(null);
    vi.unstubAllGlobals();
  });
  it('renders backend profile and active settings without unsupported editable fields', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json(profile)));
    renderPage();
    expect(await screen.findByLabelText('Timezone')).toHaveValue(
      'Asia/Jakarta',
    );
    expect(screen.getAllByText('profile@example.com')).toHaveLength(2);
    expect(screen.getByText('Asia/Jakarta')).toBeVisible();
    expect(
      screen.getByRole('combobox', { name: /mata uang/i }),
    ).toHaveTextContent(/IDR/);
    expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText(/avatar|locale|tema/i),
    ).not.toBeInTheDocument();
  });
  it('handles loading, server error, and retry', async () => {
    let resolve: ((response: Response) => void) | undefined;
    const fetchMock = vi.fn(
      () =>
        new Promise<Response>((done) => {
          resolve = done;
        }),
    );
    vi.stubGlobal('fetch', fetchMock);
    renderPage();
    expect(
      screen.getByRole('status', { name: /memuat profile/i }),
    ).toBeVisible();
    await vi.waitFor(() => {
      expect(fetchMock).toHaveBeenCalledOnce();
    });
    resolve?.(json({}, 500));
    expect(
      await screen.findByText(/server sedang mengalami gangguan/i),
    ).toBeVisible();
    fetchMock.mockResolvedValueOnce(json(profile));
    await userEvent.click(screen.getByRole('button', { name: /coba lagi/i }));
    expect(await screen.findByLabelText('Timezone')).toHaveValue(
      'Asia/Jakarta',
    );
  });
  it('validates and updates only supported preferences then syncs auth state', async () => {
    const updated = {
      ...profile,
      timezone: 'Asia/Makassar',
      updatedAt: '2026-01-02T00:00:00Z',
    };
    const fetchMock = vi.fn(
      (_input: RequestInfo | URL, options?: RequestInit) =>
        options?.method === 'PATCH'
          ? Promise.resolve(json(updated))
          : Promise.resolve(json(profile)),
    );
    vi.stubGlobal('fetch', fetchMock);
    renderPage();
    const timezone = await screen.findByLabelText('Timezone');
    await userEvent.clear(timezone);
    await userEvent.type(timezone, 'Invalid/Zone');
    await userEvent.click(
      screen.getByRole('button', { name: /simpan preferensi/i }),
    );
    expect(await screen.findByText(/timezone tidak dikenali/i)).toBeVisible();
    await userEvent.clear(timezone);
    await userEvent.type(timezone, 'Asia/Makassar');
    await userEvent.click(
      screen.getByRole('button', { name: /simpan preferensi/i }),
    );
    expect(await screen.findByText(/preferensi berhasil/i)).toBeVisible();
    expect(syncUser).toHaveBeenCalledWith(updated);
    const patch = fetchMock.mock.calls.find(
      ([, options]) => options?.method === 'PATCH',
    );
    expect(
      JSON.parse(typeof patch?.[1]?.body === 'string' ? patch[1].body : '{}'),
    ).toEqual({ currency: 'IDR', timezone: 'Asia/Makassar' });
  });
  it('validates password, excludes confirmation, avoids storage, and logs out', async () => {
    const localSetItem = vi.fn();
    const sessionSetItem = vi.fn();
    vi.stubGlobal('localStorage', { setItem: localSetItem });
    vi.stubGlobal('sessionStorage', { setItem: sessionSetItem });
    const fetchMock = vi.fn<typeof fetch>((input) => {
      if (requestUrl(input).includes('/password'))
        return Promise.resolve(new Response(null, { status: 204 }));
      return Promise.resolve(json(profile));
    });
    vi.stubGlobal('fetch', fetchMock);
    renderPage();
    await userEvent.click(
      await screen.findByRole('button', { name: 'Ubah password' }),
    );
    await screen.findByLabelText('Password saat ini');
    await userEvent.type(
      screen.getByLabelText('Password saat ini'),
      'oldPassword1',
    );
    await userEvent.type(
      screen.getByLabelText('Password baru'),
      'NewPassword2',
    );
    await userEvent.type(
      screen.getByLabelText(/Konfirmasi password baru/),
      'Different3',
    );
    await userEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Ubah password',
      }),
    );
    expect(await screen.findByText(/tidak sama/i)).toBeVisible();
    await userEvent.clear(screen.getByLabelText(/Konfirmasi password baru/));
    await userEvent.type(
      screen.getByLabelText(/Konfirmasi password baru/),
      'NewPassword2',
    );
    await userEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Ubah password',
      }),
    );
    expect(await screen.findByText(/password berhasil/i)).toBeVisible();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    const call = fetchMock.mock.calls.find(([input]) =>
      requestUrl(input).includes('/password'),
    );
    const body = JSON.parse(
      typeof call?.[1]?.body === 'string' ? call[1].body : '{}',
    ) as Record<string, unknown>;
    expect(body).toEqual({
      currentPassword: 'oldPassword1',
      newPassword: 'NewPassword2',
    });
    expect(body).not.toHaveProperty('confirmPassword');
    expect(localSetItem).not.toHaveBeenCalled();
    expect(sessionSetItem).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Logout' }));
    expect(logout).toHaveBeenCalledOnce();
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true));
    await userEvent.click(
      screen.getByRole('button', { name: /keluar dari semua perangkat/i }),
    );
    expect(logoutAll).toHaveBeenCalledOnce();
  });

  it('keeps the password form in an accessible dialog and closes it with controls or Escape', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json(profile)));
    renderPage();
    const trigger = await screen.findByRole('button', {
      name: 'Ubah password',
    });
    await userEvent.click(trigger);
    expect(screen.getByRole('dialog')).toHaveAttribute(
      'aria-labelledby',
      'change-password-title',
    );
    expect(screen.getByLabelText('Password saat ini')).toHaveFocus();
    await userEvent.click(screen.getByRole('button', { name: 'Batal' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();

    await userEvent.click(trigger);
    await userEvent.click(
      screen.getByRole('button', { name: /tutup ubah password/i }),
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();

    await userEvent.click(trigger);
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('keeps password API errors in the dialog and prevents duplicate submission while pending', async () => {
    let resolvePassword: ((response: Response) => void) | undefined;
    const fetchMock = vi.fn<typeof fetch>((input) => {
      if (requestUrl(input).includes('/password')) {
        return new Promise<Response>((resolve) => {
          resolvePassword = resolve;
        });
      }
      return Promise.resolve(json(profile));
    });
    vi.stubGlobal('fetch', fetchMock);
    renderPage();
    await userEvent.click(
      await screen.findByRole('button', { name: 'Ubah password' }),
    );
    await userEvent.type(
      screen.getByLabelText('Password saat ini'),
      'oldPass1',
    );
    await userEvent.type(screen.getByLabelText('Password baru'), 'NewPass2');
    await userEvent.type(
      screen.getByLabelText(/Konfirmasi password baru/),
      'NewPass2',
    );
    const dialog = screen.getByRole('dialog');
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Ubah password' }),
    );
    expect(
      within(dialog).getByRole('button', { name: 'Mengubah…' }),
    ).toBeDisabled();
    expect(
      within(dialog).getByRole('button', { name: 'Batal' }),
    ).toBeDisabled();
    resolvePassword?.(json({ message: 'Server error' }, 500));
    expect(
      await screen.findByText(/server sedang mengalami gangguan/i),
    ).toBeVisible();
    expect(screen.getByRole('dialog')).toBeVisible();
  });
});
