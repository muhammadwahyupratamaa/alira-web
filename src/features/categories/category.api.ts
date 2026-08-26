import { authenticatedApiRequest } from '../../lib/api/api-client';
import type { Category, CategoryInput } from './category.types';

export function getCategories(): Promise<Category[]> {
  return authenticatedApiRequest('categories?includeInactive=true');
}
export function createCategory(input: CategoryInput): Promise<Category> {
  return authenticatedApiRequest('categories', { method: 'POST', body: input });
}
export function updateCategory(
  id: string,
  input: CategoryInput,
): Promise<Category> {
  return authenticatedApiRequest(`categories/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: input,
  });
}
export function deactivateCategory(id: string): Promise<undefined> {
  return authenticatedApiRequest(`categories/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}
