import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import type { Article } from '../models/article.model';
import { ArticleMeta } from './article-meta';
import { FavoriteButton } from './favorite-button';

type ArticlePreviewProps = {
  article: Article;
};

export function ArticlePreview({ article: articleInput }: ArticlePreviewProps) {
  const [article, setArticle] = useState(articleInput);

  useEffect(() => {
    setArticle(articleInput);
  }, [articleInput]);

  function toggleFavorite(favorited: boolean): void {
    setArticle(current => ({
      ...current,
      favorited,
      favoritesCount: favorited ? current.favoritesCount + 1 : current.favoritesCount - 1,
    }));
  }

  return (
    <div className="article-preview">
      <ArticleMeta article={article}>
        <FavoriteButton article={article} onToggle={toggleFavorite} className="pull-xs-right">
          {article.favoritesCount}
        </FavoriteButton>
      </ArticleMeta>

      <Link to={`/article/${article.slug}`} className="preview-link">
        <h1>{article.title}</h1>
        <p>{article.description}</p>
        <span>Read more...</span>
        <ul className="tag-list">
          {article.tagList.map(tag => (
            <li key={tag} className="tag-default tag-pill tag-outline">
              {tag}
            </li>
          ))}
        </ul>
      </Link>
    </div>
  );
}
