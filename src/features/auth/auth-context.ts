import { createContext } from 'react';

import type { LoginInput, User } from './auth.types';

export interface AuthContextValue {
  user: User | null;
  isBootstrapping: boolean;
  postLoginPath?: string | undefined;
  login: (
    input: LoginInput,
    beforeSession?: () => Promise<string | undefined>,
  ) => Promise<void>;
  logout: () => Promise<void>;
  syncUser: (user: User) => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
