import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { AuthProvider } from './auth-context';
import { AuthPage } from './auth-page';
import { resetAuthForTests } from './auth-session';
import type { User } from './user.model';

const mockUser: User = {
  email: 'test@example.com',
  token: 'test-jwt-token',
  username: 'testuser',
  bio: 'Test bio',
  image: null,
};

function jsonResponse(body: unknown, status = 200): Promise<Response> {
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
}

function renderAuth(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<AuthPage />} />
          <Route path="/register" element={<AuthPage />} />
          <Route path="/" element={<div>home</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('AuthPage', () => {
  beforeEach(() => {
    resetAuthForTests();
    window.localStorage.removeItem('jwtToken');
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    cleanup();
    resetAuthForTests();
    vi.unstubAllGlobals();
    window.localStorage.removeItem('jwtToken');
  });

  it('renders Sign in with a link to register', () => {
    renderAuth('/login');
    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Need an account?' })).toBeTruthy();
    expect(screen.queryByPlaceholderText('Username')).toBeNull();
  });

  it('renders Sign up with a username field', () => {
    renderAuth('/register');
    expect(screen.getByRole('heading', { name: 'Sign up' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Have an account?' })).toBeTruthy();
    expect(screen.getByPlaceholderText('Username')).toBeTruthy();
  });

  it('keeps name attributes used by e2e', () => {
    renderAuth('/register');
    expect(screen.getByPlaceholderText('Username').getAttribute('name')).toBe('username');
    expect(screen.getByPlaceholderText('Email').getAttribute('name')).toBe('email');
    expect(screen.getByPlaceholderText('Password').getAttribute('name')).toBe('password');
  });

  it('disables submit until required fields are filled', () => {
    renderAuth('/login');
    const submit = screen.getByRole('button', { name: 'Sign in' });
    expect(submit.hasAttribute('disabled')).toBe(true);

    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'secret' } });
    expect(submit.hasAttribute('disabled')).toBe(false);
  });

  it('logs in and navigates home', async () => {
    vi.mocked(fetch).mockReturnValue(jsonResponse({ user: mockUser }));
    renderAuth('/login');

    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => expect(screen.getByText('home')).toBeTruthy());
    expect(fetch).toHaveBeenCalledWith(
      'https://api.realworld.show/api/users/login',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ user: { email: 'test@example.com', password: 'password123' } }),
      }),
    );
  });

  it('shows API errors on the login form', async () => {
    vi.mocked(fetch).mockReturnValue(jsonResponse({ errors: { 'email or password': ['is invalid'] } }, 422));
    renderAuth('/login');

    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'bad' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => expect(screen.getByText('email or password is invalid')).toBeTruthy());
    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeTruthy();
  });

  it('registers with username, email, and password', async () => {
    vi.mocked(fetch).mockReturnValue(jsonResponse({ user: mockUser }));
    renderAuth('/register');

    fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign up' }));

    await waitFor(() => expect(screen.getByText('home')).toBeTruthy());
    expect(fetch).toHaveBeenCalledWith(
      'https://api.realworld.show/api/users',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          user: { username: 'testuser', email: 'test@example.com', password: 'password123' },
        }),
      }),
    );
  });
});
