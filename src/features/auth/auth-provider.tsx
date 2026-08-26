import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import {
  setApiAccessToken,
  setSessionExpiredHandler,
} from '../../lib/api/api-client';
import {
  getCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
  refreshSession,
} from './auth.api';
import { AuthContext, type AuthContextValue } from './auth-context';
import type { LoginInput, User } from './auth.types';

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const clearSession = useCallback(() => {
    setApiAccessToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    setSessionExpiredHandler(clearSession);
    let isActive = true;
    const isCurrent = () => isActive;

    async function bootstrap() {
      try {
        await refreshSession();
        if (!isCurrent()) return;
        const currentUser = await getCurrentUser();
        if (isCurrent()) setUser(currentUser);
      } catch {
        if (isCurrent()) clearSession();
      } finally {
        if (isCurrent()) setIsBootstrapping(false);
      }
    }

    void bootstrap();

    return () => {
      isActive = false;
      setSessionExpiredHandler(null);
    };
  }, [clearSession]);

  const login = useCallback(async (input: LoginInput) => {
    const response = await loginRequest(input);
    setUser(response.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isBootstrapping, login, logout }),
    [isBootstrapping, login, logout, user],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}
