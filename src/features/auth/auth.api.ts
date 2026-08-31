import {
  apiRequest,
  authenticatedApiRequest,
  setApiAccessToken,
} from '../../lib/api/api-client';
import type {
  AuthResponse,
  LoginInput,
  RegisterInput,
  User,
} from './auth.types';

let sessionRefreshPromise: Promise<AuthResponse> | null = null;

export async function register(input: RegisterInput): Promise<User> {
  return apiRequest<User>('auth/register', {
    method: 'POST',
    body: input,
  });
}

export async function login(input: LoginInput): Promise<AuthResponse> {
  const response = await apiRequest<AuthResponse>('auth/login', {
    method: 'POST',
    body: input,
  });
  setApiAccessToken(response.accessToken);
  return response;
}

export async function refreshSession(): Promise<AuthResponse> {
  sessionRefreshPromise ??= apiRequest<AuthResponse>('auth/refresh', {
    method: 'POST',
  })
    .then((response) => {
      setApiAccessToken(response.accessToken);
      return response;
    })
    .finally(() => {
      sessionRefreshPromise = null;
    });

  return sessionRefreshPromise;
}

export async function getCurrentUser(): Promise<User> {
  return authenticatedApiRequest<User>('auth/me');
}

export async function logout(): Promise<undefined> {
  try {
    await apiRequest<undefined>('auth/logout', { method: 'POST' });
    return undefined;
  } finally {
    setApiAccessToken(null);
  }
}

export async function logoutAll(): Promise<undefined> {
  try {
    await apiRequest<undefined>('auth/logout-all', { method: 'POST' });
    return undefined;
  } finally {
    setApiAccessToken(null);
  }
}
