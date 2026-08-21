import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../core/api/api-client';
import type { Article } from '../models/article.model';
import type { ArticleListConfig } from '../models/article-list-config.model';

export type ArticlesResponse = { articles: Article[]; articlesCount: number };

export function fetchArticles(config: ArticleListConfig): Promise<ArticlesResponse> {
  const path = config.type === 'feed' ? '/articles/feed' : '/articles';
  return apiClient<ArticlesResponse>(path, { query: config.filters });
}

export function favoriteArticle(slug: string): Promise<Article> {
  return apiClient<{ article: Article }>(`/articles/${slug}/favorite`, {
    method: 'POST',
    body: {},
  }).then(data => data.article);
}

export function unfavoriteArticle(slug: string): Promise<void> {
  return apiClient<void>(`/articles/${slug}/favorite`, { method: 'DELETE' });
}

export function useArticles(config: ArticleListConfig) {
  return useQuery({
    queryKey: ['articles', config],
    queryFn: () => fetchArticles(config),
    retry: false,
    refetchOnWindowFocus: false,
  });
}
