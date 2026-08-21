import { Link } from 'react-router';
import { defaultImage } from '../../../shared/default-image';
import type { Article } from '../models/article.model';
import type { ReactNode } from 'react';

function formatLongDate(value: string): string {
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

type ArticleMetaProps = {
  article: Article;
  children?: ReactNode;
};

export function ArticleMeta({ article, children }: ArticleMetaProps) {
  return (
    <div className="article-meta">
      <Link to={`/profile/${article.author.username}`}>
        <img src={defaultImage(article.author.image)} />
      </Link>

      <div className="info">
        <Link className="author" to={`/profile/${article.author.username}`}>
          {article.author.username}
        </Link>
        <span className="date">{formatLongDate(article.createdAt)}</span>
      </div>

      {children}
    </div>
  );
}
