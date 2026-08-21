import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { API_BASE_URL } from '../../../core/api/api-client';
import type { Article } from '../models/article.model';
import type { ArticleListConfig } from '../models/article-list-config.model';
import { favoriteArticle, fetchArticles, unfavoriteArticle } from './articles';

function jsonResponse(body: unknown, status = 200): Promise<Response> {
  return Promise.resolve(
    new Response(status === 204 ? null : JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
}

const mockArticle: Article = {
  slug: 'test-article',
  title: 'Test Article',
  description: 'Test description',
  body: 'Test body content',
  tagList: ['test', 'angular'],
  createdAt: '2024-01-01',
  updatedAt: '2024-01-02',
  favorited: false,
  favoritesCount: 5,
  author: {
    username: 'testuser',
    bio: 'Test bio',
    image: 'https://example.com/avatar.jpg',
    following: false,
  },
};

const mockArticleList: Article[] = [
  mockArticle,
  {
    ...mockArticle,
    slug: 'second-article',
    title: 'Second Article',
  },
];

describe('articles API', () => {
  beforeEach(() => {
    window.localStorage.removeItem('jwtToken');
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    window.localStorage.removeItem('jwtToken');
  });

  describe('fetchArticles', () => {
    it('fetches articles with default config', async () => {
      vi.mocked(fetch).mockReturnValue(jsonResponse({ articles: mockArticleList, articlesCount: 2 }));
      const config: ArticleListConfig = { type: 'all', filters: {} };
      const response = await fetchArticles(config);
      expect(response.articles).toEqual(mockArticleList);
      expect(response.articlesCount).toBe(2);
      expect(fetch).toHaveBeenCalledWith(`${API_BASE_URL}/articles`, expect.objectContaining({ method: 'GET' }));
    });

    it('fetches feed articles when type is feed', async () => {
      vi.mocked(fetch).mockReturnValue(jsonResponse({ articles: mockArticleList, articlesCount: 2 }));
      await fetchArticles({ type: 'feed', filters: {} });
      expect(fetch).toHaveBeenCalledWith(`${API_BASE_URL}/articles/feed`, expect.objectContaining({ method: 'GET' }));
    });

    it('includes query parameters from filters', async () => {
      vi.mocked(fetch).mockReturnValue(jsonResponse({ articles: mockArticleList, articlesCount: 2 }));
      await fetchArticles({
        type: 'all',
        filters: {
          tag: 'angular',
          author: 'testuser',
          limit: 10,
          offset: 0,
        },
      });
      expect(fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/articles?tag=angular&author=testuser&limit=10&offset=0`,
        expect.objectContaining({ method: 'GET' }),
      );
    });

    it('handles pagination parameters', async () => {
      vi.mocked(fetch).mockReturnValue(jsonResponse({ articles: mockArticleList, articlesCount: 100 }));
      await fetchArticles({
        type: 'all',
        filters: {
          limit: 20,
          offset: 40,
        },
      });
      expect(fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/articles?limit=20&offset=40`,
        expect.objectContaining({ method: 'GET' }),
      );
    });

    it('handles empty results', async () => {
      vi.mocked(fetch).mockReturnValue(jsonResponse({ articles: [], articlesCount: 0 }));
      const response = await fetchArticles({ type: 'all', filters: {} });
      expect(response.articles).toEqual([]);
      expect(response.articlesCount).toBe(0);
    });
  });

  describe('favoriteArticle', () => {
    it('favorites an article', async () => {
      vi.mocked(fetch).mockReturnValue(jsonResponse({ article: { ...mockArticle, favorited: true } }));
      const article = await favoriteArticle('article-to-favorite');
      expect(article.favorited).toBe(true);
      expect(fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/articles/article-to-favorite/favorite`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({}),
        }),
      );
    });
  });

  describe('unfavoriteArticle', () => {
    it('unfavorites an article', async () => {
      vi.mocked(fetch).mockReturnValue(jsonResponse(null, 204));
      await unfavoriteArticle('article-to-unfavorite');
      expect(fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/articles/article-to-unfavorite/favorite`,
        expect.objectContaining({ method: 'DELETE' }),
      );
    });
  });
});
