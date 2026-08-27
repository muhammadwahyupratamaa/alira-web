import { authenticatedApiRequest } from '../../lib/api/api-client';
import type { User } from '../auth/auth.types';

export interface PreferencesInput {
  currency: 'IDR';
  timezone: string;
}
export interface PasswordInput {
  currentPassword: string;
  newPassword: string;
}
export function getProfile(): Promise<User> {
  return authenticatedApiRequest('profile');
}
export function updatePreferences(input: PreferencesInput): Promise<User> {
  return authenticatedApiRequest('profile/preferences', {
    method: 'PATCH',
    body: input,
  });
}
export function changePassword(input: PasswordInput): Promise<undefined> {
  return authenticatedApiRequest('profile/password', {
    method: 'PATCH',
    body: input,
  });
}
