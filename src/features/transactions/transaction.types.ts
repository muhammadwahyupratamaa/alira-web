import type { AccountType } from '../accounts/account.types';
import type { CategoryType } from '../categories/category.types';

export type TransactionType = 'INCOME' | 'EXPENSE';
export interface Transaction {
  id: string;
  type: TransactionType;
  amount: string;
  transactionDate: string;
  note?: unknown;
  createdAt: string;
  updatedAt: string;
  deletedAt?: unknown;
  account: { id: string; name: string; type: AccountType; isActive: boolean };
  category: {
    id: string;
    name: string;
    type: CategoryType;
    icon?: unknown;
    color?: unknown;
    isDefault: boolean;
    isActive: boolean;
  };
}
export interface TransactionList {
  data: Transaction[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
export interface TransactionInput {
  accountId: string;
  categoryId: string;
  type: TransactionType;
  amount: string;
  transactionDate: string;
  note: string | null;
}
export interface TransactionFilters {
  startDate?: string | undefined;
  endDate?: string | undefined;
  accountId?: string | undefined;
  categoryId?: string | undefined;
  type?: TransactionType | undefined;
  search?: string | undefined;
  page: number;
  limit: number;
  sort:
    | 'transactionDate:desc'
    | 'transactionDate:asc'
    | 'createdAt:desc'
    | 'createdAt:asc'
    | 'amount:desc'
    | 'amount:asc';
}
