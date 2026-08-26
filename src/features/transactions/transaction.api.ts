import { authenticatedApiRequest } from '../../lib/api/api-client';
import type {
  Transaction,
  TransactionFilters,
  TransactionInput,
  TransactionList,
} from './transaction.types';

export function listTransactions(
  filters: TransactionFilters,
): Promise<TransactionList> {
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') query.set(key, String(value));
  });
  return authenticatedApiRequest(`transactions?${query}`);
}
export function getTransaction(id: string): Promise<Transaction> {
  return authenticatedApiRequest(`transactions/${encodeURIComponent(id)}`);
}
export function createTransaction(
  input: TransactionInput,
): Promise<Transaction> {
  return authenticatedApiRequest('transactions', {
    method: 'POST',
    body: input,
  });
}
export function updateTransaction(
  id: string,
  input: TransactionInput,
): Promise<Transaction> {
  return authenticatedApiRequest(`transactions/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: input,
  });
}
export function deleteTransaction(id: string): Promise<undefined> {
  return authenticatedApiRequest(`transactions/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}
export function restoreTransaction(id: string): Promise<Transaction> {
  return authenticatedApiRequest(
    `transactions/${encodeURIComponent(id)}/restore`,
    { method: 'POST' },
  );
}
export function duplicateTransaction(id: string): Promise<Transaction> {
  return authenticatedApiRequest(
    `transactions/${encodeURIComponent(id)}/duplicate`,
    { method: 'POST' },
  );
}
