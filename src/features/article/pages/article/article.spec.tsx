import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { AuthProvider } from '../../../../core/auth/auth-context';
import { purgeAuth, resetAuthForTests, setAuth } from '../../../../core/auth/auth-session';
import type { User } from '../../../../core/auth/user.model';
import type { Article } from '../../models/article.model';
import type { Comment } from '../../models/comment.model';
import { ArticlePage } from './article';

const authorUser: User = {
  email: 'jake@example.com',
  token: 'jake-token',
  username: 'jake',
  bio: null,
  image: null,
};

const otherUser: User = {
  email: 'jane@example.com',
  token: 'jane-token',
  username: 'jane',
  bio: null,
  image: null,
};

const mockArticle: Article = {
  slug: 'test-article',
  title: 'Test Article',
  description: 'Test description',
  body: '## Hello body',
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

const mockComment: Comment = {
  id: '1',
  body: 'First comment',
  createdAt: '2024-01-15T00:00:00.000Z',
  author: {
    username: 'jake',
    bio: null,
    image: null,
    following: false,
  },
};

function jsonResponse(body: unknown, status = 200): Promise<Response> {
  return Promise.resolve(
    new Response(status === 204 ? null : JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
}

function mockApi(options?: { article?: Article; comments?: Comment[]; failArticle?: boolean }) {
  const article = options?.article ?? mockArticle;
  const comments = options?.comments ?? [mockComment];

  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? 'GET';

      if (url.includes('/comments/') && method === 'DELETE') {
        return jsonResponse(null, 204);
      }
      if (url.includes('/comments') && method === 'POST') {
        const body = JSON.parse(String(init?.body)) as { comment: { body: string } };
        return jsonResponse({
          comment: {
            ...mockComment,
            id: '2',
            body: body.comment.body,
            author: { ...mockComment.author, username: 'jane' },
          },
        });
      }
      if (url.includes('/comments')) {
        return jsonResponse({ comments });
      }
      if (url.includes('/follow')) {
        return jsonResponse({ profile: { ...article.author, following: !article.author.following } });
      }
      if (url.includes('/articles/') && method === 'DELETE') {
        return jsonResponse(null, 204);
      }
      if (url.includes('/articles/') && options?.failArticle) {
        return jsonResponse({ errors: { article: ['not found'] } }, 404);
      }
      if (url.includes('/articles/')) {
        return jsonResponse({ article });
      }
      return jsonResponse({ errors: { url: ['not found'] } }, 404);
    }),
  );
}

function renderArticle(path = '/article/test-article') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const router = createMemoryRouter(
    [
      { path: '/article/:slug', element: <ArticlePage /> },
      { path: '/', element: <div>home page</div> },
      { path: '/login', element: <div>login page</div> },
      { path: '/register', element: <div>register page</div> },
      { path: '/editor/:slug', element: <div>editor page</div> },
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

describe('ArticlePage', () => {
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

  it('renders title, markdown body, tags, and comments', async () => {
    purgeAuth();
    mockApi();
    renderArticle();

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Test Article' })).toBeTruthy());
    expect(screen.getByText('Hello body').tagName).toBe('H2');
    expect(screen.getByText('dragons')).toBeTruthy();
    expect(screen.getByText('First comment')).toBeTruthy();
    expect(screen.getByText('Sign in')).toBeTruthy();
    expect(screen.getByText('sign up')).toBeTruthy();
  });

  it('shows load errors when the article request fails', async () => {
    purgeAuth();
    mockApi({ failArticle: true });
    renderArticle();

    await waitFor(() => expect(screen.getByText('article not found')).toBeTruthy());
    expect(screen.queryByRole('heading', { name: 'Test Article' })).toBeNull();
  });

  it('shows edit and delete for the author', async () => {
    setAuth(authorUser);
    mockApi();
    renderArticle();

    await waitFor(() => expect(screen.getAllByText('Edit Article').length).toBeGreaterThan(0));
    expect(screen.getAllByText('Delete Article').length).toBeGreaterThan(0);
    expect(screen.queryByText(/Follow jake/)).toBeNull();
  });

  it('deletes the article and navigates home', async () => {
    setAuth(authorUser);
    mockApi();
    renderArticle();

    await waitFor(() => expect(screen.getAllByText('Delete Article').length).toBeGreaterThan(0));
    fireEvent.click(screen.getAllByRole('button', { name: /Delete Article/ })[0]);
    await waitFor(() => expect(screen.getByText('home page')).toBeTruthy());
  });

  it('shows a comment form when authenticated', async () => {
    setAuth(otherUser);
    mockApi();
    renderArticle();

    await waitFor(() => expect(screen.getByPlaceholderText('Write a comment...')).toBeTruthy());
    expect(screen.getByText('Post Comment')).toBeTruthy();
    expect(screen.queryByText('Sign in')).toBeNull();
  });

  it('posts a comment and prepends it', async () => {
    setAuth(otherUser);
    mockApi();
    renderArticle();

    await waitFor(() => expect(screen.getByPlaceholderText('Write a comment...')).toBeTruthy());
    fireEvent.change(screen.getByPlaceholderText('Write a comment...'), {
      target: { value: 'Nice post' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Post Comment' }));

    await waitFor(() => expect(screen.getByText('Nice post')).toBeTruthy());
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/articles/test-article/comments'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ comment: { body: 'Nice post' } }),
      }),
    );
  });

  it('lets the comment author delete it', async () => {
    setAuth(authorUser);
    mockApi();
    const { container } = renderArticle();

    await waitFor(() => expect(screen.getByText('First comment')).toBeTruthy());
    fireEvent.click(container.querySelector('.mod-options .ion-trash-a')!);
    await waitFor(() => expect(screen.queryByText('First comment')).toBeNull());
  });

  it('sends unauthenticated follow clicks to /login', async () => {
    purgeAuth();
    mockApi();
    renderArticle();

    await waitFor(() => expect(screen.getAllByText(/Follow jake/).length).toBeGreaterThan(0));
    fireEvent.click(screen.getAllByRole('button', { name: /Follow jake/ })[0]);
    await waitFor(() => expect(screen.getByText('login page')).toBeTruthy());
  });

  it('sends unauthenticated favorite clicks to /register', async () => {
    purgeAuth();
    mockApi();
    renderArticle();

    await waitFor(() => expect(screen.getAllByText(/Favorite Article/).length).toBeGreaterThan(0));
    fireEvent.click(screen.getAllByRole('button', { name: /Favorite Article/ })[0]);
    await waitFor(() => expect(screen.getByText('register page')).toBeTruthy());
  });
});
