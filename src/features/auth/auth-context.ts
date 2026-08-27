import { createContext } from 'react';

import type { LoginInput, User } from './auth.types';

export interface AuthContextValue {
  user: User | null;
  isBootstrapping: boolean;
  login: (input: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
  syncUser: (user: User) => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
