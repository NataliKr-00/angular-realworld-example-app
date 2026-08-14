import { jwtStorage } from './jwt-storage';
import { getAuthSnapshot, type AuthState } from './auth-session';
import type { User } from './user.model';

export interface ConduitDebug {
  getToken: () => string | null;
  getAuthState: () => AuthState;
  getCurrentUser: () => User | null;
}

declare global {
  interface Window {
    __conduit_debug__?: ConduitDebug;
  }
}

export function bindDebugInterface(): void {
  window.__conduit_debug__ = {
    getToken: () => jwtStorage.getToken() ?? null,
    getAuthState: () => getAuthSnapshot().authState,
    getCurrentUser: () => getAuthSnapshot().user,
  };
}
