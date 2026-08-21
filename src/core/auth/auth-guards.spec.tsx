import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router';
import { AuthProvider } from './auth-context';
import { RequireAuth, RequireGuest } from './auth-guards';
import { purgeAuth, resetAuthForTests, setAuth } from './auth-session';
import type { User } from './user.model';

function AuthLayout() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}

const mockUser: User = {
  email: 'test@example.com',
  token: 'test-jwt-token',
  username: 'testuser',
  bio: 'Test bio',
  image: null,
};

function renderAt(path: string) {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: <AuthLayout />,
        children: [
          { index: true, element: <div>home</div> },
          {
            element: <RequireGuest />,
            children: [{ path: 'login', element: <div>login page</div> }],
          },
          {
            element: <RequireAuth />,
            children: [
              { path: 'settings', element: <div>settings page</div> },
              { path: 'editor', element: <div>editor page</div> },
            ],
          },
        ],
      },
    ],
    { initialEntries: [path] },
  );

  return render(<RouterProvider router={router} />);
}

describe('auth guards', () => {
  beforeEach(() => {
    resetAuthForTests();
    window.localStorage.removeItem('jwtToken');
  });

  afterEach(() => {
    cleanup();
    resetAuthForTests();
    window.localStorage.removeItem('jwtToken');
  });

  it('redirects guests from /settings to /login', () => {
    purgeAuth();
    renderAt('/settings');
    expect(screen.getByText('login page')).toBeTruthy();
  });

  it('redirects guests from /editor to /login', () => {
    purgeAuth();
    renderAt('/editor');
    expect(screen.getByText('login page')).toBeTruthy();
  });

  it('allows authenticated users onto /settings', () => {
    setAuth(mockUser);
    renderAt('/settings');
    expect(screen.getByText('settings page')).toBeTruthy();
  });

  it('keeps authenticated users off /login', () => {
    setAuth(mockUser);
    renderAt('/login');
    expect(screen.getByText('home')).toBeTruthy();
    expect(screen.queryByText('login page')).toBeNull();
  });

  it('does not redirect while auth is still loading', () => {
    renderAt('/settings');
    expect(screen.queryByText('login page')).toBeNull();
    expect(screen.queryByText('settings page')).toBeNull();
  });
});
