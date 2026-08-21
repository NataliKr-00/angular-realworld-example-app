import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../../core/auth/auth-context';
import type { Article } from '../models/article.model';
import { favoriteArticle, unfavoriteArticle } from '../services/articles';

type FavoriteButtonProps = {
  article: Article;
  onToggle: (favorited: boolean) => void;
  children?: ReactNode;
  className?: string;
};

export function FavoriteButton({ article, onToggle, children, className }: FavoriteButtonProps) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function toggleFavorite(): Promise<void> {
    setIsSubmitting(true);

    if (!isAuthenticated) {
      void navigate('/register');
      return;
    }

    try {
      if (!article.favorited) {
        await favoriteArticle(article.slug);
      } else {
        await unfavoriteArticle(article.slug);
      }
      setIsSubmitting(false);
      onToggle(!article.favorited);
    } catch {
      setIsSubmitting(false);
    }
  }

  const classes = [
    'btn',
    'btn-sm',
    isSubmitting ? 'disabled' : '',
    article.favorited ? 'btn-primary' : 'btn-outline-primary',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={classes} type="button" onClick={() => void toggleFavorite()}>
      <i className="ion-heart"></i> {children}
    </button>
  );
}
