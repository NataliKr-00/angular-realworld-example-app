import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { AuthProvider } from '../auth/auth-context';
import { getCurrentUser, purgeAuth, resetAuthForTests, setAuth } from '../auth/auth-session';
import { jwtStorage } from '../auth/jwt-storage';
import type { User } from '../auth/user.model';
import { Header } from './header';

const mockUser: User = {
  email: 'test@example.com',
  token: 'test-jwt-token',
  username: 'testuser',
  bio: 'Test bio',
  image: null,
};

function renderHeader() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <Header />
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('Header', () => {
  beforeEach(() => {
    resetAuthForTests();
    window.localStorage.removeItem('jwtToken');
  });

  afterEach(() => {
    cleanup();
    resetAuthForTests();
    vi.unstubAllGlobals();
    window.localStorage.removeItem('jwtToken');
  });

  it('shows Sign in and Sign up when unauthenticated', () => {
    purgeAuth();
    renderHeader();
    expect(screen.getByText('Sign in')).toBeTruthy();
    expect(screen.getByText('Sign up')).toBeTruthy();
  });

  it('shows New Article, Settings, and username when authenticated', () => {
    setAuth(mockUser);
    renderHeader();
    expect(screen.getByText('New Article')).toBeTruthy();
    expect(screen.getByText('Settings')).toBeTruthy();
    expect(screen.getByText('testuser')).toBeTruthy();
    expect(screen.queryByText('Sign in')).toBeNull();
  });

  it('shows Loading... while auth state is loading', () => {
    renderHeader();
    expect(screen.getByText('Loading...')).toBeTruthy();
  });

  it('shows Connecting... when auth is unavailable', async () => {
    jwtStorage.saveToken('stored');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('{}', {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );
    await getCurrentUser();
    renderHeader();
    expect(screen.getByText('Connecting...')).toBeTruthy();
  });
});
