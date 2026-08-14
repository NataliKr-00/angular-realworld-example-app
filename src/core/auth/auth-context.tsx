import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import {
  getAuthSnapshot,
  getCurrentUser,
  login,
  purgeAuth,
  register,
  setAuth,
  subscribeAuth,
  updateUser,
  type AuthSnapshot,
} from './auth-session';

type AuthContextValue = AuthSnapshot & {
  login: typeof login;
  register: typeof register;
  updateUser: typeof updateUser;
  getCurrentUser: typeof getCurrentUser;
  setAuth: typeof setAuth;
  purgeAuth: typeof purgeAuth;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const snapshot = useSyncExternalStore(subscribeAuth, getAuthSnapshot, getAuthSnapshot);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...snapshot,
      login,
      register,
      updateUser,
      getCurrentUser,
      setAuth,
      purgeAuth,
      logout: purgeAuth,
    }),
    [snapshot],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  const navigate = useNavigate();

  return {
    ...context,
    logout: () => {
      purgeAuth();
      void navigate('/');
    },
  };
}
