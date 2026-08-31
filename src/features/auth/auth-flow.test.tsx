import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthProvider } from './auth-provider';
import { GuestRoute, ProtectedRoute } from './auth-route';
import { LoginPage } from './login-page';
import { RegisterPage } from './register-page';
import { useAuth } from './use-auth';

const testUser = {
  id: '5b9a82bd-e08f-4c93-a947-6f29bb680cef',
  email: 'user@example.com',
  currency: 'IDR',
  timezone: 'Asia/Jakarta',
  createdAt: '2026-08-26T00:00:00.000Z',
  updatedAt: '2026-08-26T00:00:00.000Z',
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function renderAuthApp(route = '/login', strict = false) {
  const app = (
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider>
        <Routes>
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<AuthTestDashboard />} />
            <Route path="/accounts/new" element={<AuthTestOnboarding />} />
          </Route>
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );

  return render(strict ? <StrictMode>{app}</StrictMode> : app);
}

function AuthTestOnboarding() {
  return <h1>Onboarding account</h1>;
}

function AuthTestDashboard() {
  const { user, logout } = useAuth();
  return (
    <main>
      <h1>Dashboard for {user?.email}</h1>
      <button type="button" onClick={() => void logout()}>
        Keluar
      </button>
    </main>
  );
}

describe('authentication flows', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({}, 401)));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('validates login fields before sending credentials', async () => {
    renderAuthApp();
    await screen.findByRole('heading', { name: /masuk ke Alira/i });
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockClear();

    await userEvent.click(screen.getByRole('button', { name: /^masuk$/i }));

    expect(await screen.findByText(/alamat email yang valid/i)).toBeVisible();
    expect(screen.getByText(/minimal 8 karakter/i)).toBeVisible();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('validates register confirmation and never sends it', async () => {
    renderAuthApp('/register');
    await screen.findByRole('heading', { name: /buat akun baru/i });
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockClear();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/^email$/i), 'new@example.com');
    await user.type(screen.getByLabelText(/^kata sandi$/i), 'Password1');
    await user.type(screen.getByLabelText(/konfirmasi/i), 'Different1');
    await user.click(screen.getByRole('button', { name: /buat akun/i }));

    expect(
      await screen.findByText(/konfirmasi kata sandi tidak cocok/i),
    ).toBeVisible();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('registers successfully without sending confirmPassword', async () => {
    renderAuthApp('/register');
    await screen.findByRole('heading', { name: /buat akun baru/i });
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockClear();
    fetchMock.mockResolvedValueOnce(jsonResponse(testUser, 201));
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/^email$/i), 'new@example.com');
    await user.type(screen.getByLabelText(/^kata sandi$/i), 'Password1');
    await user.type(screen.getByLabelText(/konfirmasi/i), 'Password1');
    await user.click(screen.getByRole('button', { name: /buat akun/i }));

    expect(await screen.findByText(/akun berhasil dibuat/i)).toBeVisible();
    const requestBody = fetchMock.mock.calls[0]?.[1]?.body;
    expect(typeof requestBody).toBe('string');
    if (typeof requestBody !== 'string') throw new Error('Expected JSON body.');
    const body = JSON.parse(requestBody) as Record<string, unknown>;
    expect(body).toEqual({ email: 'new@example.com', password: 'Password1' });
    expect(body).not.toHaveProperty('confirmPassword');
  });

  it('shows a friendly duplicate email error', async () => {
    renderAuthApp('/register');
    await screen.findByRole('heading', { name: /buat akun baru/i });
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockClear();
    fetchMock.mockResolvedValueOnce(jsonResponse({ message: 'Conflict' }, 409));
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/^email$/i), 'used@example.com');
    await user.type(screen.getByLabelText(/^kata sandi$/i), 'Password1');
    await user.type(screen.getByLabelText(/konfirmasi/i), 'Password1');
    await user.click(screen.getByRole('button', { name: /buat akun/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /sudah digunakan/i,
    );
  });

  it('logs in and opens the protected dashboard', async () => {
    renderAuthApp();
    await screen.findByRole('heading', { name: /masuk ke Alira/i });
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockClear();
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ accessToken: 'memory-token', user: testUser }),
    );
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/^email$/i), 'user@example.com');
    await user.type(screen.getByLabelText(/^kata sandi$/i), 'Password1');
    await user.click(screen.getByRole('button', { name: /^masuk$/i }));

    expect(
      await screen.findByRole('heading', { name: /user@example.com/i }),
    ).toBeVisible();
  });

  it('sends a user without an active account to account onboarding after login', async () => {
    renderAuthApp();
    await screen.findByRole('heading', { name: /masuk ke Alira/i });
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockClear();
    fetchMock.mockImplementation((input) =>
      getRequestUrl(input).includes('/auth/login')
        ? Promise.resolve(
            jsonResponse({ accessToken: 'memory-token', user: testUser }),
          )
        : getRequestUrl(input).includes('/accounts')
          ? Promise.resolve(jsonResponse([]))
          : Promise.resolve(jsonResponse({}, 401)),
    );
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/^email$/i), 'new@example.com');
    await user.type(screen.getByLabelText(/^kata sandi$/i), 'Password1');
    await user.click(screen.getByRole('button', { name: /^masuk$/i }));

    expect(
      await screen.findByRole('heading', { name: /onboarding account/i }),
    ).toBeVisible();
  });

  it('uses a non-enumerating message for invalid credentials', async () => {
    renderAuthApp();
    await screen.findByRole('heading', { name: /masuk ke Alira/i });
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockClear();
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ message: 'User missing' }, 401),
    );
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/^email$/i), 'unknown@example.com');
    await user.type(screen.getByLabelText(/^kata sandi$/i), 'Password1');
    await user.click(screen.getByRole('button', { name: /^masuk$/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /email atau kata sandi tidak sesuai/i,
    );
    expect(screen.getByRole('alert')).not.toHaveTextContent(/user missing/i);
  });

  it('bootstraps through refresh and me, then redirects guests away', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({ accessToken: 'memory-token', user: testUser }),
      )
      .mockResolvedValueOnce(jsonResponse(testUser));

    renderAuthApp('/login');

    expect(
      await screen.findByRole('heading', { name: /user@example.com/i }),
    ).toBeVisible();
    expect(getRequestUrl(fetchMock.mock.calls[0]?.[0])).toContain(
      '/auth/refresh',
    );
    expect(getRequestUrl(fetchMock.mock.calls[1]?.[0])).toContain('/auth/me');
  });

  it('uses one bootstrap refresh in React Strict Mode', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({ accessToken: 'memory-token', user: testUser }),
      )
      .mockResolvedValueOnce(jsonResponse(testUser));

    renderAuthApp('/dashboard', true);

    expect(
      await screen.findByRole('heading', { name: /user@example.com/i }),
    ).toBeVisible();
    expect(
      fetchMock.mock.calls.filter(([input]) =>
        getRequestUrl(input).includes('/auth/refresh'),
      ),
    ).toHaveLength(1);
  });

  it('redirects an unauthenticated protected route after bootstrap', async () => {
    renderAuthApp('/dashboard');

    expect(
      await screen.findByRole('heading', { name: /masuk ke Alira/i }),
    ).toBeVisible();
    expect(screen.queryByText(/dashboard finansial/i)).not.toBeInTheDocument();
  });

  it('clears auth state on logout without writing browser storage', async () => {
    const localSet = vi.spyOn(Storage.prototype, 'setItem');
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({ accessToken: 'memory-token', user: testUser }),
      )
      .mockResolvedValueOnce(jsonResponse(testUser))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    renderAuthApp('/dashboard');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: /keluar/i }));

    expect(
      await screen.findByRole('heading', { name: /masuk ke Alira/i }),
    ).toBeVisible();
    expect(localSet).not.toHaveBeenCalled();
  });
});

function getRequestUrl(input: RequestInfo | URL | undefined): string {
  if (input instanceof URL) return input.toString();
  if (input instanceof Request) return input.url;
  return input ?? '';
}
