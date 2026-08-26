import { authenticatedApiRequest } from '../../lib/api/api-client';
import type { Account, AccountInput } from './account.types';

export function getAccounts(): Promise<Account[]> {
  return authenticatedApiRequest('accounts');
}

export function getAccount(id: string): Promise<Account> {
  return authenticatedApiRequest(`accounts/${encodeURIComponent(id)}`);
}

export function createAccount(input: AccountInput): Promise<Account> {
  return authenticatedApiRequest('accounts', {
    method: 'POST',
    body: input,
  });
}

export function updateAccount(
  id: string,
  input: AccountInput,
): Promise<Account> {
  return authenticatedApiRequest(`accounts/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: input,
  });
}

export function deactivateAccount(id: string): Promise<undefined> {
  return authenticatedApiRequest(`accounts/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}
