import { Link } from 'react-router';
import { useAuth } from '../../../core/auth/auth-context';
import { defaultImage } from '../../../shared/default-image';
import type { Comment } from '../models/comment.model';

function formatLongDate(value: string): string {
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

type ArticleCommentProps = {
  comment: Comment;
  onDelete: () => void;
};

export function ArticleComment({ comment, onDelete }: ArticleCommentProps) {
  const { user } = useAuth();
  const canModify = user?.username === comment.author.username;

  if (!comment) {
    return null;
  }

  return (
    <div className="card">
      <div className="card-block">
        <p className="card-text">{comment.body}</p>
      </div>
      <div className="card-footer">
        <Link className="comment-author" to={`/profile/${comment.author.username}`}>
          <img src={defaultImage(comment.author.image)} className="comment-author-img" />
        </Link>
        &nbsp;
        <Link className="comment-author" to={`/profile/${comment.author.username}`}>
          {comment.author.username}
        </Link>
        <span className="date-posted">{formatLongDate(comment.createdAt)}</span>
        {canModify && (
          <span className="mod-options">
            <i className="ion-trash-a" onClick={onDelete}></i>
          </span>
        )}
      </div>
    </div>
  );
}
