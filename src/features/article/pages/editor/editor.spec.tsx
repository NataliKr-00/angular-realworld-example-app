import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router';
import { AuthProvider } from '../../../../core/auth/auth-context';
import { RequireAuth } from '../../../../core/auth/auth-guards';
import { purgeAuth, resetAuthForTests, setAuth } from '../../../../core/auth/auth-session';
import type { User } from '../../../../core/auth/user.model';
import type { Article } from '../../models/article.model';
import { EditorPage } from './editor';

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

function renderEditor(path: string) {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: (
          <AuthProvider>
            <Outlet />
          </AuthProvider>
        ),
        children: [
          { index: true, element: <div>home page</div> },
          {
            element: <RequireAuth />,
            children: [
              { path: 'editor', element: <EditorPage /> },
              { path: 'editor/:slug', element: <EditorPage /> },
            ],
          },
          { path: 'login', element: <div>login page</div> },
          { path: 'article/:slug', element: <div>article page</div> },
        ],
      },
    ],
    { initialEntries: [path] },
  );

  return {
    router,
    ...render(<RouterProvider router={router} />),
  };
}

describe('EditorPage', () => {
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

  it('redirects guests to /login', () => {
    purgeAuth();
    renderEditor('/editor');
    expect(screen.getByText('login page')).toBeTruthy();
  });

  it('keeps name attributes used by e2e', () => {
    setAuth(authorUser);
    renderEditor('/editor');
    expect(screen.getByPlaceholderText('Article Title').getAttribute('name')).toBe('title');
    expect(screen.getByPlaceholderText("What's this article about?").getAttribute('name')).toBe('description');
    expect(screen.getByPlaceholderText('Write your article (in markdown)').getAttribute('name')).toBe('body');
  });

  it('creates an article and navigates to it', async () => {
    setAuth(authorUser);
    vi.mocked(fetch).mockReturnValue(jsonResponse({ article: mockArticle }));
    renderEditor('/editor');

    fireEvent.change(screen.getByPlaceholderText('Article Title'), { target: { value: 'Test Article' } });
    fireEvent.change(screen.getByPlaceholderText("What's this article about?"), {
      target: { value: 'Test description' },
    });
    fireEvent.change(screen.getByPlaceholderText('Write your article (in markdown)'), {
      target: { value: 'Test body content' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter tags'), { target: { value: 'dragons' } });
    fireEvent.keyDown(screen.getByPlaceholderText('Enter tags'), { key: 'Enter' });
    expect(screen.getByText('dragons')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Publish Article' }));

    await waitFor(() => expect(screen.getByText('article page')).toBeTruthy());
    expect(fetch).toHaveBeenCalledWith(
      'https://api.realworld.show/api/articles',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          article: {
            title: 'Test Article',
            description: 'Test description',
            body: 'Test body content',
            tagList: ['dragons'],
          },
        }),
      }),
    );
  });

  it('shows API errors on the editor form', async () => {
    setAuth(authorUser);
    vi.mocked(fetch).mockReturnValue(jsonResponse({ errors: { title: ["can't be blank"] } }, 422));
    renderEditor('/editor');

    fireEvent.click(screen.getByRole('button', { name: 'Publish Article' }));
    await waitFor(() => expect(screen.getByText("title can't be blank")).toBeTruthy());
    expect(screen.getByRole('button', { name: 'Publish Article' })).toBeTruthy();
  });

  it('loads an existing article for its author and updates it', async () => {
    setAuth(authorUser);
    vi.mocked(fetch).mockImplementation(async (input, init) => {
      const method = init?.method ?? 'GET';
      if (method === 'PUT') {
        return jsonResponse({ article: { ...mockArticle, title: 'Updated Title' } });
      }
      return jsonResponse({ article: mockArticle });
    });
    renderEditor('/editor/test-article');

    await waitFor(() => expect(screen.getByDisplayValue('Test Article')).toBeTruthy());
    expect(screen.getByDisplayValue('Test description')).toBeTruthy();
    expect(screen.getByDisplayValue('Test body content')).toBeTruthy();
    expect(screen.getByText('dragons')).toBeTruthy();

    fireEvent.change(screen.getByPlaceholderText('Article Title'), { target: { value: 'Updated Title' } });
    fireEvent.click(screen.getByRole('button', { name: 'Publish Article' }));

    await waitFor(() => expect(screen.getByText('article page')).toBeTruthy());
    expect(fetch).toHaveBeenCalledWith(
      'https://api.realworld.show/api/articles/test-article',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({
          article: {
            title: 'Updated Title',
            description: 'Test description',
            body: 'Test body content',
            tagList: ['dragons'],
            slug: 'test-article',
          },
        }),
      }),
    );
  });

  it('redirects a non-author home', async () => {
    setAuth(otherUser);
    vi.mocked(fetch).mockReturnValue(jsonResponse({ article: mockArticle }));
    renderEditor('/editor/test-article');
    await waitFor(() => expect(screen.getByText('home page')).toBeTruthy());
  });

  it('removes a tag from the list', async () => {
    setAuth(authorUser);
    vi.mocked(fetch).mockReturnValue(jsonResponse({ article: mockArticle }));
    renderEditor('/editor/test-article');

    await waitFor(() => expect(screen.getByText('dragons')).toBeTruthy());
    fireEvent.click(document.querySelector('.ion-close-round')!);
    expect(screen.queryByText('dragons')).toBeNull();
  });
});
