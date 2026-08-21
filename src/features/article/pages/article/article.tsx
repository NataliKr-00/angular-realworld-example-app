import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import type { ApiError } from '../../../../core/api/errors';
import { useAuth } from '../../../../core/auth/auth-context';
import { ListErrors } from '../../../../shared/list-errors';
import { defaultImage } from '../../../../shared/default-image';
import { renderMarkdown } from '../../../../shared/markdown';
import { FollowButton } from '../../../profile/components/follow-button';
import type { Profile } from '../../../profile/models/profile.model';
import { ArticleMeta } from '../../components/article-meta';
import { ArticleComment } from '../../components/article-comment';
import { FavoriteButton } from '../../components/favorite-button';
import type { Article } from '../../models/article.model';
import type { Comment } from '../../models/comment.model';
import { addComment, deleteComment, useComments } from '../../services/comments';
import { deleteArticle, useArticle } from '../../services/articles';

function toLoadErrors(error: unknown): Pick<ApiError, 'errors'> {
  if (error && typeof error === 'object' && 'errors' in error) {
    return error as ApiError;
  }
  return { errors: { error: ['Failed to load article'] } };
}

type ArticleActionsProps = {
  article: Article;
  canModify: boolean;
  isDeleting: boolean;
  onDelete: () => void;
  onToggleFavorite: (favorited: boolean) => void;
  onToggleFollowing: (profile: Profile) => void;
};

function ArticleActions({
  article,
  canModify,
  isDeleting,
  onDelete,
  onToggleFavorite,
  onToggleFollowing,
}: ArticleActionsProps) {
  if (canModify) {
    return (
      <span>
        <Link className="btn btn-sm btn-outline-secondary" to={`/editor/${article.slug}`}>
          <i className="ion-edit"></i> Edit Article
        </Link>

        <button
          className={isDeleting ? 'btn btn-sm btn-outline-danger disabled' : 'btn btn-sm btn-outline-danger'}
          type="button"
          onClick={onDelete}
        >
          <i className="ion-trash-a"></i> Delete Article
        </button>
      </span>
    );
  }

  return (
    <span>
      <FollowButton profile={article.author} onToggle={onToggleFollowing} />

      <FavoriteButton article={article} onToggle={onToggleFavorite}>
        {article.favorited ? 'Unfavorite' : 'Favorite'} Article
        <span className="counter">({article.favoritesCount})</span>
      </FavoriteButton>
    </span>
  );
}

export function ArticlePage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const articleQuery = useArticle(slug);
  const commentsQuery = useComments(slug);
  const [article, setArticle] = useState<Article | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentBody, setCommentBody] = useState('');
  const [commentFormErrors, setCommentFormErrors] = useState<ApiError | null>(null);
  const [deleteCommentErrors, setDeleteCommentErrors] = useState<ApiError | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (articleQuery.data) {
      setArticle(articleQuery.data);
    }
  }, [articleQuery.data]);

  useEffect(() => {
    if (commentsQuery.data) {
      setComments(commentsQuery.data);
    }
  }, [commentsQuery.data]);

  const loadError = articleQuery.error ?? commentsQuery.error;
  const loadErrors = loadError ? toLoadErrors(loadError) : null;
  const canModify = Boolean(user && article && user.username === article.author.username);

  function onToggleFavorite(favorited: boolean): void {
    setArticle(current => {
      if (!current) {
        return current;
      }
      return {
        ...current,
        favorited,
        favoritesCount: favorited ? current.favoritesCount + 1 : current.favoritesCount - 1,
      };
    });
  }

  function toggleFollowing(profile: Profile): void {
    setArticle(current => {
      if (!current) {
        return current;
      }
      return {
        ...current,
        author: { ...current.author, following: profile.following },
      };
    });
  }

  async function onDeleteArticle(): Promise<void> {
    if (!article) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteArticle(article.slug);
      void navigate('/');
    } catch {
      // Angular leaves isDeleting true when delete fails
    }
  }

  async function onAddComment(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!article) {
      return;
    }

    setIsSubmitting(true);
    setCommentFormErrors(null);

    try {
      const comment = await addComment(article.slug, commentBody);
      setComments(current => [comment, ...current]);
      setCommentBody('');
      setIsSubmitting(false);
    } catch (error) {
      setIsSubmitting(false);
      setCommentFormErrors(error as ApiError);
    }
  }

  async function onDeleteComment(comment: Comment): Promise<void> {
    if (!article) {
      return;
    }

    setDeleteCommentErrors(null);
    try {
      await deleteComment(comment.id, article.slug);
      setComments(current => current.filter(item => item.id !== comment.id));
    } catch (error) {
      setDeleteCommentErrors(error as ApiError);
    }
  }

  const ready = article && commentsQuery.data !== undefined && !loadError;

  return (
    <div className="article-page">
      {loadErrors && (
        <div className="container">
          <div className="row">
            <div className="col-md-12">
              <ListErrors errors={loadErrors} />
            </div>
          </div>
        </div>
      )}
      {ready && article && (
        <>
          <div className="banner">
            <div className="container">
              <h1>{article.title}</h1>

              <ArticleMeta article={article}>
                <ArticleActions
                  article={article}
                  canModify={canModify}
                  isDeleting={isDeleting}
                  onDelete={() => void onDeleteArticle()}
                  onToggleFavorite={onToggleFavorite}
                  onToggleFollowing={toggleFollowing}
                />
              </ArticleMeta>
            </div>
          </div>

          <div className="container page">
            <div className="row article-content">
              <div className="col-md-12">
                <div dangerouslySetInnerHTML={{ __html: renderMarkdown(article.body) }} />

                <ul className="tag-list">
                  {article.tagList.map(tag => (
                    <li key={tag} className="tag-default tag-pill tag-outline">
                      {tag}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <hr />

            <div className="article-actions">
              <ArticleMeta article={article}>
                <ArticleActions
                  article={article}
                  canModify={canModify}
                  isDeleting={isDeleting}
                  onDelete={() => void onDeleteArticle()}
                  onToggleFavorite={onToggleFavorite}
                  onToggleFollowing={toggleFollowing}
                />
              </ArticleMeta>
            </div>

            <div className="row">
              <div className="col-xs-12 col-md-8 offset-md-2">
                {isAuthenticated && (
                  <div>
                    <ListErrors errors={commentFormErrors} />
                    <form className="card comment-form" onSubmit={event => void onAddComment(event)}>
                      <fieldset disabled={isSubmitting}>
                        <div className="card-block">
                          <textarea
                            className="form-control"
                            placeholder="Write a comment..."
                            rows={3}
                            value={commentBody}
                            onChange={event => setCommentBody(event.target.value)}
                          ></textarea>
                        </div>
                        <div className="card-footer">
                          <img src={defaultImage(user?.image)} className="comment-author-img" />
                          <button className="btn btn-sm btn-primary" type="submit">
                            Post Comment
                          </button>
                        </div>
                      </fieldset>
                    </form>
                  </div>
                )}

                {!isAuthenticated && (
                  <div>
                    <Link to="/login">Sign in</Link> or <Link to="/register">sign up</Link> to add comments on this
                    article.
                  </div>
                )}

                <ListErrors errors={deleteCommentErrors} />

                {comments.map(comment => (
                  <ArticleComment key={comment.id} comment={comment} onDelete={() => void onDeleteComment(comment)} />
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
