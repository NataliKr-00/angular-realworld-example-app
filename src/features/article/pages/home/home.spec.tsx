import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { AuthProvider } from '../../../../core/auth/auth-context';
import { purgeAuth, resetAuthForTests, setAuth } from '../../../../core/auth/auth-session';
import type { User } from '../../../../core/auth/user.model';
import type { Article } from '../../models/article.model';
import { HomePage } from './home';

const mockUser: User = {
  email: 'test@example.com',
  token: 'test-jwt-token',
  username: 'testuser',
  bio: 'Test bio',
  image: null,
};

const mockArticle: Article = {
  slug: 'test-article',
  title: 'Test Article',
  description: 'Test description',
  body: 'Test body content',
  tagList: ['dragons'],
  createdAt: '2024-01-15T00:00:00.000Z',
  updatedAt: '2024-01-16T00:00:00.000Z',
  favorited: false,
  favoritesCount: 3,
  author: {
    username: 'jake',
    bio: null,
    image: null,
    following: false,
  },
};

function jsonResponse(body: unknown, status = 200): Promise<Response> {
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
}

function mockApi(options?: { articles?: Article[]; articlesCount?: number; tags?: string[] }) {
  const articles = options?.articles ?? [mockArticle];
  const articlesCount = options?.articlesCount ?? articles.length;
  const tags = options?.tags ?? ['angular', 'react'];

  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/tags')) {
        return jsonResponse({ tags });
      }
      if (url.includes('/articles')) {
        return jsonResponse({ articles, articlesCount });
      }
      return jsonResponse({ errors: { url: ['not found'] } }, 404);
    }),
  );
}

function renderHome(path: string) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: <HomePage />,
      },
      {
        path: '/tag/:tag',
        element: <HomePage />,
      },
      {
        path: '/login',
        element: <div>login page</div>,
      },
      {
        path: '/register',
        element: <div>register page</div>,
      },
    ],
    { initialEntries: [path] },
  );

  return {
    router,
    ...render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </QueryClientProvider>,
    ),
  };
}

describe('HomePage', () => {
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

  it('shows the guest banner and global feed', async () => {
    purgeAuth();
    mockApi();
    renderHome('/');

    expect(screen.getByAltText('Conduit')).toBeTruthy();
    expect(screen.getByText('Global Feed')).toBeTruthy();
    expect(screen.queryByText('Your Feed')).toBeNull();
    await waitFor(() => expect(screen.getByText('Test Article')).toBeTruthy());
    expect(screen.getByText('Popular Tags')).toBeTruthy();
    expect(screen.getByText('angular')).toBeTruthy();
  });

  it('shows Your Feed when authenticated and hides the banner', async () => {
    setAuth(mockUser);
    mockApi();
    renderHome('/');

    expect(screen.getByText('Your Feed')).toBeTruthy();
    expect(screen.queryByText(/Angular frontend/)).toBeNull();
    await waitFor(() => expect(screen.getByText('Test Article')).toBeTruthy());
  });

  it('loads the following feed from ?feed=following', async () => {
    setAuth(mockUser);
    mockApi({ articles: [], articlesCount: 0 });
    renderHome('/?feed=following');

    await waitFor(() => expect(screen.getByText(/Your feed is empty/)).toBeTruthy());
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/articles/feed'), expect.any(Object));
    expect(screen.getByText('Your Feed').className).toContain('active');
  });

  it('redirects guests on ?feed=following to /login', async () => {
    purgeAuth();
    mockApi();
    renderHome('/?feed=following');
    await waitFor(() => expect(screen.getByText('login page')).toBeTruthy());
  });

  it('filters the global feed by /tag/:tag', async () => {
    purgeAuth();
    mockApi();
    renderHome('/tag/angular');

    await waitFor(() => expect(screen.getByText('Test Article')).toBeTruthy());
    expect(fetch).toHaveBeenCalledWith(expect.stringMatching(/\/articles\?tag=angular/), expect.any(Object));
    expect(document.querySelector('.feed-toggle .nav-link.active')?.textContent).toContain('angular');
  });

  it('omits page=1 and sets ?page= on later pages', async () => {
    purgeAuth();
    mockApi({ articlesCount: 25 });
    const { router } = renderHome('/');

    await waitFor(() => expect(screen.getByText('Test Article')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: '2' }));
    await waitFor(() => expect(router.state.location.search).toBe('?page=2'));
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('offset=10'), expect.any(Object));
  });

  it('preserves feed=following when paginating', async () => {
    setAuth(mockUser);
    mockApi({ articlesCount: 25 });
    const { router } = renderHome('/?feed=following');

    await waitFor(() => expect(screen.getByRole('button', { name: '2' })).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: '2' }));
    await waitFor(() => expect(router.state.location.search).toBe('?feed=following&page=2'));
  });

  it('shows the empty global feed copy', async () => {
    purgeAuth();
    mockApi({ articles: [], articlesCount: 0 });
    renderHome('/');
    await waitFor(() => expect(screen.getByText('No articles are here... yet.')).toBeTruthy());
  });

  it('shows the empty tags copy', async () => {
    purgeAuth();
    mockApi({ tags: [] });
    renderHome('/');
    await waitFor(() => expect(screen.getByText('No tags are here... yet.')).toBeTruthy());
  });

  it('sends unauthenticated favorite clicks to /register', async () => {
    purgeAuth();
    mockApi();
    renderHome('/');
    await waitFor(() => expect(screen.getByText('Test Article')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: /3/ }));
    await waitFor(() => expect(screen.getByText('register page')).toBeTruthy());
  });
});
