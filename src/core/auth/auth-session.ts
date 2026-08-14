import { apiClient, setUnauthorizedHandler } from '../api/api-client';
import { jwtStorage } from './jwt-storage';
import type { User } from './user.model';

export type AuthState = 'authenticated' | 'unauthenticated' | 'unavailable' | 'loading';

export type AuthSnapshot = {
  user: User | null;
  authState: AuthState;
  isAuthenticated: boolean;
};

type Listener = () => void;

let user: User | null = null;
let authState: AuthState = 'loading';
let retryAttempt = 0;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<Listener>();
let snapshot: AuthSnapshot = {
  user: null,
  authState: 'loading',
  isAuthenticated: false,
};

function emit(): void {
  snapshot = {
    user,
    authState,
    isAuthenticated: !!user,
  };
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeAuth(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getAuthSnapshot(): AuthSnapshot {
  return snapshot;
}

function cancelRetry(): void {
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
}

function scheduleRetry(): void {
  cancelRetry();

  if (!jwtStorage.getToken()) {
    return;
  }

  const delaySeconds = Math.min(2 * Math.pow(2, retryAttempt), 16);
  retryAttempt += 1;

  retryTimer = setTimeout(() => {
    if (jwtStorage.getToken()) {
      authState = 'loading';
      emit();
      void getCurrentUser();
    }
  }, delaySeconds * 1000);
}

function setAuthUnavailable(): void {
  user = null;
  authState = 'unavailable';
  emit();
  scheduleRetry();
}

function handleAuthError(status: number): void {
  if (status >= 400 && status < 500) {
    purgeAuth();
  } else {
    setAuthUnavailable();
  }
}

export function setAuth(nextUser: User): void {
  cancelRetry();
  retryAttempt = 0;
  jwtStorage.saveToken(nextUser.token);
  user = nextUser;
  authState = 'authenticated';
  emit();
}

export function purgeAuth(): void {
  cancelRetry();
  retryAttempt = 0;
  jwtStorage.destroyToken();
  user = null;
  authState = 'unauthenticated';
  emit();
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const data = await apiClient<{ user: User }>('/user');
    setAuth(data.user);
    return data.user;
  } catch (error) {
    const status = typeof error === 'object' && error && 'status' in error ? Number(error.status) : 0;
    handleAuthError(status);
    return null;
  }
}

export async function login(credentials: { email: string; password: string }): Promise<{ user: User }> {
  const data = await apiClient<{ user: User }>('/users/login', {
    method: 'POST',
    body: { user: credentials },
  });
  setAuth(data.user);
  return data;
}

export async function register(credentials: {
  username: string;
  email: string;
  password: string;
}): Promise<{ user: User }> {
  const data = await apiClient<{ user: User }>('/users', {
    method: 'POST',
    body: { user: credentials },
  });
  setAuth(data.user);
  return data;
}

export async function updateUser(nextUser: Partial<User>): Promise<{ user: User }> {
  const data = await apiClient<{ user: User }>('/user', {
    method: 'PUT',
    body: { user: nextUser },
  });
  user = data.user;
  emit();
  return data;
}

export function initAuth(): void {
  setUnauthorizedHandler(() => {
    purgeAuth();
  });

  if (jwtStorage.getToken()) {
    void getCurrentUser();
  } else {
    purgeAuth();
  }
}

export function resetAuthForTests(): void {
  cancelRetry();
  retryAttempt = 0;
  user = null;
  authState = 'loading';
  setUnauthorizedHandler(undefined);
  emit();
}
