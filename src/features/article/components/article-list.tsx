import { Link } from 'react-router';
import type { ArticleListConfig } from '../models/article-list-config.model';
import { useArticles } from '../services/articles';
import { ArticlePreview } from './article-preview';

type ArticleListProps = {
  limit: number;
  config: ArticleListConfig;
  currentPage: number;
  isFollowingFeed: boolean;
  onPageChange: (page: number) => void;
};

export function ArticleList({ limit, config, currentPage, isFollowingFeed, onPageChange }: ArticleListProps) {
  const query: ArticleListConfig = {
    type: config.type,
    filters: {
      ...config.filters,
      limit,
      offset: limit * (currentPage - 1),
    },
  };

  const { data, isPending, isError } = useArticles(query);

  if (isPending || isError) {
    return <div className="article-preview">Loading articles...</div>;
  }

  const articles = data.articles;
  const totalPages = Array.from({ length: Math.ceil(data.articlesCount / limit) }, (_, index) => index + 1);

  return (
    <>
      {articles.length === 0 ? (
        <div className="article-preview empty-feed-message">
          {isFollowingFeed ? (
            <>
              Your feed is empty. Follow some users to see their articles here, or check out the{' '}
              <Link to="/">Global Feed</Link>!
            </>
          ) : (
            'No articles are here... yet.'
          )}
        </div>
      ) : (
        articles.map(article => <ArticlePreview key={article.slug} article={article} />)
      )}

      <nav>
        <ul className="pagination">
          {totalPages.map(pageNumber => (
            <li key={pageNumber} className={pageNumber === currentPage ? 'page-item active' : 'page-item'}>
              <button
                className="page-link"
                type="button"
                onClick={() => {
                  if (pageNumber !== currentPage) {
                    onPageChange(pageNumber);
                  }
                }}
              >
                {pageNumber}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
