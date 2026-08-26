import { afterEach, describe, expect, it, vi } from 'vitest';

import { apiRequest } from './api-client';

describe('apiRequest', () => {
  afterEach(() => {
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
});
