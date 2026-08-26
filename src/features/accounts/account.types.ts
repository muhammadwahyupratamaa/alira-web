export const accountTypes = ['CASH', 'BANK', 'EWALLET'] as const;

export type AccountType = (typeof accountTypes)[number];

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  initialBalance: string;
  currentBalance: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AccountInput {
  name: string;
  type: AccountType;
  initialBalance: string;
}
