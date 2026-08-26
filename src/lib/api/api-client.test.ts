import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  apiRequest,
  authenticatedApiRequest,
  setApiAccessToken,
  setSessionExpiredHandler,
} from './api-client';

describe('apiRequest', () => {
  afterEach(() => {
    setApiAccessToken(null);
    setSessionExpiredHandler(null);
    vi.unstubAllGlobals();
  });

  it('returns JSON and configures authenticated requests', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: 'ok' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      apiRequest<{ status: string }>('/health', { accessToken: 'test-token' }),
    ).resolves.toEqual({ status: 'ok' });

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, options] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(url.toString()).toBe('http://localhost:3000/api/v1/health');
    expect(options.credentials).toBe('include');
    expect(new Headers(options.headers).get('Authorization')).toBe(
      'Bearer test-token',
    );
  });

  it('throws a normalized API error without a real network call', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: 'Invalid request' }), {
          status: 422,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );

    const request = apiRequest('transactions');

    await expect(request).rejects.toMatchObject({
      name: 'ApiError',
      message: 'Invalid request',
      status: 422,
      body: { message: 'Invalid request' },
    });
  });

  it('retries an authenticated request only once after a 401', async () => {
    setApiAccessToken('expired-token');
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ message: 'Unauthorized' }, 401))
      .mockResolvedValueOnce(jsonResponse({ accessToken: 'fresh-token' }))
      .mockResolvedValueOnce(jsonResponse({ id: 'user-id' }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(authenticatedApiRequest('auth/me')).resolves.toEqual({
      id: 'user-id',
    });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(getRequestUrl(fetchMock.mock.calls[1]?.[0])).toContain(
      '/auth/refresh',
    );
    expect(
      new Headers(fetchMock.mock.calls[2]?.[1]?.headers).get('Authorization'),
    ).toBe('Bearer fresh-token');
  });

  it('uses one single-flight refresh for concurrent 401 responses', async () => {
    setApiAccessToken('expired-token');
    let resolveRefresh: ((response: Response) => void) | undefined;
    const refreshResponse = new Promise<Response>((resolve) => {
      resolveRefresh = resolve;
    });
    const fetchMock = vi.fn((url: URL) => {
      if (url.pathname.endsWith('/auth/refresh')) return refreshResponse;
      return Promise.resolve(
        fetchMock.mock.calls.filter(([calledUrl]) =>
          String(calledUrl).includes('/auth/me'),
        ).length <= 2
          ? jsonResponse({ message: 'Unauthorized' }, 401)
          : jsonResponse({ id: 'user-id' }),
      );
    });
    vi.stubGlobal('fetch', fetchMock);

    const requests = [
      authenticatedApiRequest('auth/me'),
      authenticatedApiRequest('auth/me'),
    ];
    await waitForMicrotasks();
    resolveRefresh?.(jsonResponse({ accessToken: 'fresh-token' }));

    await expect(Promise.all(requests)).resolves.toEqual([
      { id: 'user-id' },
      { id: 'user-id' },
    ]);
    expect(
      fetchMock.mock.calls.filter(([url]) =>
        String(url).includes('/auth/refresh'),
      ),
    ).toHaveLength(1);
  });

  it('clears the session when refresh fails', async () => {
    const onExpired = vi.fn();
    setApiAccessToken('expired-token');
    setSessionExpiredHandler(onExpired);
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(jsonResponse({ message: 'Unauthorized' }, 401))
        .mockResolvedValueOnce(
          jsonResponse({ message: 'Invalid refresh' }, 401),
        ),
    );

    await expect(authenticatedApiRequest('auth/me')).rejects.toMatchObject({
      status: 401,
    });
    expect(onExpired).toHaveBeenCalledOnce();
  });
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function getRequestUrl(input: RequestInfo | URL | undefined): string {
  if (input instanceof URL) return input.toString();
  if (input instanceof Request) return input.url;
  return input ?? '';
}

async function waitForMicrotasks() {
  await Promise.resolve();
  await Promise.resolve();
}
