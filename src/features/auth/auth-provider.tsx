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
  logoutAll as logoutAllRequest,
  refreshSession,
} from './auth.api';
import { AuthContext, type AuthContextValue } from './auth-context';
import type { LoginInput, User } from './auth.types';

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [postLoginPath, setPostLoginPath] = useState<string | undefined>();

  const clearSession = useCallback(() => {
    setApiAccessToken(null);
    setUser(null);
    setPostLoginPath(undefined);
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

  const login = useCallback(
    async (
      input: LoginInput,
      beforeSession?: () => Promise<string | undefined>,
    ) => {
      const response = await loginRequest(input);
      setPostLoginPath(await beforeSession?.());
      setUser(response.user);
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      clearSession();
    }
  }, [clearSession]);
  const logoutAll = useCallback(async () => {
    try {
      await logoutAllRequest();
    } finally {
      clearSession();
    }
  }, [clearSession]);
  const syncUser = useCallback((nextUser: User) => {
    setUser(nextUser);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isBootstrapping,
      postLoginPath,
      login,
      logout,
      logoutAll,
      syncUser,
    }),
    [isBootstrapping, login, logout, logoutAll, postLoginPath, syncUser, user],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}
