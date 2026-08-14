import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getAuthSnapshot,
  getCurrentUser,
  initAuth,
  login,
  purgeAuth,
  register,
  resetAuthForTests,
  setAuth,
  updateUser,
} from './auth-session';
import { jwtStorage } from './jwt-storage';
import { bindDebugInterface } from './conduit-debug';
import type { User } from './user.model';

const mockUser: User = {
  email: 'test@example.com',
  token: 'test-jwt-token',
  username: 'testuser',
  bio: 'Test bio',
  image: 'https://example.com/avatar.jpg',
};

function jsonResponse(body: unknown, status = 200): Promise<Response> {
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
}

describe('auth-session', () => {
  beforeEach(() => {
    resetAuthForTests();
    window.localStorage.removeItem('jwtToken');
    vi.stubGlobal('fetch', vi.fn());
    vi.useFakeTimers();
  });

  afterEach(() => {
    resetAuthForTests();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    window.localStorage.removeItem('jwtToken');
    delete window.__conduit_debug__;
  });

  it('starts in loading with no user', () => {
    expect(getAuthSnapshot()).toEqual({
      user: null,
      authState: 'loading',
      isAuthenticated: false,
    });
  });

  it('initAuth without a token becomes unauthenticated', () => {
    initAuth();
    expect(getAuthSnapshot().authState).toBe('unauthenticated');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('initAuth with a token loads GET /user', async () => {
    jwtStorage.saveToken('stored');
    vi.mocked(fetch).mockReturnValue(jsonResponse({ user: mockUser }));
    initAuth();
    await vi.waitFor(() => expect(getAuthSnapshot().authState).toBe('authenticated'));
    expect(fetch).toHaveBeenCalledWith('https://api.realworld.show/api/user', expect.any(Object));
    expect(getAuthSnapshot().user).toEqual(mockUser);
  });

  it('GET /user 401 clears the token', async () => {
    jwtStorage.saveToken('bad');
    vi.mocked(fetch).mockReturnValue(jsonResponse({ errors: { unauthorized: ['no'] } }, 401));
    await getCurrentUser();
    expect(getAuthSnapshot().authState).toBe('unauthenticated');
    expect(jwtStorage.getToken() == null).toBe(true);
  });

  it('GET /user 500 keeps the token and retries', async () => {
    jwtStorage.saveToken('stored');
    vi.mocked(fetch).mockReturnValue(jsonResponse({}, 500));
    await getCurrentUser();
    expect(getAuthSnapshot().authState).toBe('unavailable');
    expect(jwtStorage.getToken()).toBe('stored');

    vi.mocked(fetch).mockReturnValue(jsonResponse({ user: mockUser }));
    await vi.advanceTimersByTimeAsync(2000);
    await vi.waitFor(() => expect(getAuthSnapshot().authState).toBe('authenticated'));
  });

  it('login posts to /users/login and stores the token', async () => {
    vi.mocked(fetch).mockReturnValue(jsonResponse({ user: mockUser }));
    await login({ email: 'test@example.com', password: 'password123' });
    expect(fetch).toHaveBeenCalledWith(
      'https://api.realworld.show/api/users/login',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ user: { email: 'test@example.com', password: 'password123' } }),
      }),
    );
    expect(jwtStorage.getToken()).toBe(mockUser.token);
    expect(getAuthSnapshot().isAuthenticated).toBe(true);
  });

  it('register posts to /users', async () => {
    vi.mocked(fetch).mockReturnValue(jsonResponse({ user: mockUser }));
    await register({ username: 'newuser', email: 'new@example.com', password: 'password123' });
    expect(fetch).toHaveBeenCalledWith(
      'https://api.realworld.show/api/users',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('updateUser writes the current user without changing authState', async () => {
    setAuth(mockUser);
    const updated = { ...mockUser, bio: 'Updated bio' };
    vi.mocked(fetch).mockReturnValue(jsonResponse({ user: updated }));
    await updateUser({ bio: 'Updated bio' });
    expect(getAuthSnapshot().user).toEqual(updated);
    expect(getAuthSnapshot().authState).toBe('authenticated');
  });

  it('purgeAuth clears token and user', () => {
    setAuth(mockUser);
    purgeAuth();
    expect(getAuthSnapshot()).toMatchObject({
      user: null,
      authState: 'unauthenticated',
      isAuthenticated: false,
    });
    expect(jwtStorage.getToken() == null).toBe(true);
  });

  it('exposes live getters on window.__conduit_debug__', () => {
    bindDebugInterface();
    expect(window.__conduit_debug__?.getAuthState()).toBe('loading');
    setAuth(mockUser);
    expect(window.__conduit_debug__?.getToken()).toBe(mockUser.token);
    expect(window.__conduit_debug__?.getAuthState()).toBe('authenticated');
    expect(window.__conduit_debug__?.getCurrentUser()).toEqual(mockUser);
  });

  it('logs out on 401 from other endpoints after initAuth', async () => {
    initAuth();
    setAuth(mockUser);
    vi.mocked(fetch).mockReturnValue(jsonResponse({ errors: { unauthorized: ['no'] } }, 401));
    const { apiClient } = await import('../api/api-client');
    await expect(apiClient('/articles')).rejects.toMatchObject({ status: 401 });
    expect(getAuthSnapshot().authState).toBe('unauthenticated');
  });
});
