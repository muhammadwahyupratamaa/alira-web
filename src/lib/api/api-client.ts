import { env } from '../env';

interface ApiErrorBody {
  message?: unknown;
}

export class ApiError extends Error {
  public constructor(
    message: string,
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  accessToken?: string;
  body?: BodyInit | object | null;
}

let accessToken: string | null = null;
let refreshPromise: Promise<string> | null = null;
let sessionExpiredHandler: (() => void) | null = null;

export function setApiAccessToken(token: string | null): void {
  accessToken = token;
}

export function setSessionExpiredHandler(handler: (() => void) | null): void {
  sessionExpiredHandler = handler;
}

function isBodyInit(
  body: NonNullable<ApiRequestOptions['body']>,
): body is BodyInit {
  return (
    typeof body === 'string' ||
    body instanceof Blob ||
    body instanceof FormData ||
    body instanceof URLSearchParams ||
    body instanceof ArrayBuffer ||
    ArrayBuffer.isView(body) ||
    body instanceof ReadableStream
  );
}

async function parseResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204) return undefined;

  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) return response.json();

  const text = await response.text();
  return text || undefined;
}

function getErrorMessage(body: unknown, status: number): string {
  const message = (body as ApiErrorBody | null)?.message;

  if (
    typeof body === 'object' &&
    body !== null &&
    'message' in body &&
    typeof message === 'string'
  ) {
    return message;
  }

  return `Request failed with status ${String(status)}`;
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { accessToken, body, headers: customHeaders, ...requestInit } = options;
  const headers = new Headers(customHeaders);
  let requestBody: BodyInit | null | undefined;

  if (body !== undefined && body !== null && !isBodyInit(body)) {
    headers.set('Content-Type', 'application/json');
    requestBody = JSON.stringify(body);
  } else {
    requestBody = body;
  }

  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);

  const fetchOptions: RequestInit = {
    ...requestInit,
    credentials: 'include',
    headers,
  };

  if (requestBody !== undefined) fetchOptions.body = requestBody;

  const normalizedPath = path.replace(/^\/+/, '');
  const response = await fetch(
    new URL(normalizedPath, `${env.VITE_API_BASE_URL}/`),
    fetchOptions,
  );
  const responseBody = await parseResponseBody(response);

  if (!response.ok) {
    throw new ApiError(
      getErrorMessage(responseBody, response.status),
      response.status,
      responseBody,
    );
  }

  return responseBody as T;
}

interface RefreshResponse {
  accessToken: string;
}

async function refreshAccessToken(): Promise<string> {
  refreshPromise ??= apiRequest<RefreshResponse>('auth/refresh', {
    method: 'POST',
  })
    .then((response) => {
      setApiAccessToken(response.accessToken);
      return response.accessToken;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

export async function authenticatedApiRequest<T>(
  path: string,
  options: Omit<ApiRequestOptions, 'accessToken'> = {},
): Promise<T> {
  try {
    return await apiRequest<T>(path, {
      ...options,
      ...(accessToken ? { accessToken } : {}),
    });
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) throw error;
  }

  try {
    const refreshedToken = await refreshAccessToken();
    return await apiRequest<T>(path, {
      ...options,
      accessToken: refreshedToken,
    });
  } catch (error) {
    setApiAccessToken(null);
    sessionExpiredHandler?.();
    throw error;
  }
}
