import { useEffect, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import type { ApiError } from '../../../../core/api/errors';
import { useAuth } from '../../../../core/auth/auth-context';
import { ListErrors } from '../../../../shared/list-errors';
import { createArticle, fetchArticle, updateArticle } from '../../services/articles';

export function EditorPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [body, setBody] = useState('');
  const [tagField, setTagField] = useState('');
  const [tagList, setTagList] = useState<string[]>([]);
  const [errors, setErrors] = useState<ApiError | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    if (!slug || !user) {
      return;
    }

    let cancelled = false;

    void fetchArticle(slug)
      .then(article => {
        if (cancelled) {
          return;
        }
        if (user.username !== article.author.username) {
          setForbidden(true);
          return;
        }
        setTitle(article.title);
        setDescription(article.description);
        setBody(article.body);
        setTagList(article.tagList);
      })
      .catch((error: ApiError) => {
        if (!cancelled) {
          setErrors(error);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [slug, user]);

  if (forbidden) {
    return <Navigate to="/" replace />;
  }

  function addTag(): void {
    const tag = tagField;
    if (tag != null && tag.trim() !== '' && tagList.indexOf(tag) < 0) {
      setTagList(tags => [...tags, tag]);
    }
    setTagField('');
  }

  function removeTag(tagName: string): void {
    setTagList(tags => tags.filter(tag => tag !== tagName));
  }

  function onTagKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      addTag();
    }
  }

  async function submitForm(): Promise<void> {
    setIsSubmitting(true);

    const nextTags = [...tagList];
    if (tagField != null && tagField.trim() !== '' && nextTags.indexOf(tagField) < 0) {
      nextTags.push(tagField);
    }
    setTagList(nextTags);
    setTagField('');

    const articleData = {
      title,
      description,
      body,
      tagList: nextTags,
    };

    try {
      const article = slug ? await updateArticle({ ...articleData, slug }) : await createArticle(articleData);
      void navigate(`/article/${article.slug}`);
    } catch (error) {
      setErrors(error as ApiError);
      setIsSubmitting(false);
    }
  }

  return (
    <div className="editor-page">
      <div className="container page">
        <div className="row">
          <div className="col-md-10 offset-md-1 col-xs-12">
            <ListErrors errors={errors} />

            <form
              onSubmit={(event: FormEvent<HTMLFormElement>) => {
                event.preventDefault();
              }}
            >
              <fieldset disabled={isSubmitting}>
                <fieldset className="form-group">
                  <input
                    className="form-control form-control-lg"
                    name="title"
                    type="text"
                    placeholder="Article Title"
                    value={title}
                    onChange={event => setTitle(event.target.value)}
                  />
                </fieldset>

                <fieldset className="form-group">
                  <input
                    className="form-control"
                    name="description"
                    type="text"
                    placeholder="What's this article about?"
                    value={description}
                    onChange={event => setDescription(event.target.value)}
                  />
                </fieldset>

                <fieldset className="form-group">
                  <textarea
                    className="form-control"
                    name="body"
                    rows={8}
                    placeholder="Write your article (in markdown)"
                    value={body}
                    onChange={event => setBody(event.target.value)}
                  ></textarea>
                </fieldset>

                <fieldset className="form-group">
                  <input
                    className="form-control"
                    type="text"
                    placeholder="Enter tags"
                    value={tagField}
                    onChange={event => setTagField(event.target.value)}
                    onKeyDown={onTagKeyDown}
                  />
                  <div className="tag-list">
                    {tagList.map(tag => (
                      <span key={tag} className="tag-default tag-pill">
                        <i className="ion-close-round" onClick={() => removeTag(tag)}></i>
                        {tag}
                      </span>
                    ))}
                  </div>
                </fieldset>

                <button
                  className="btn btn-lg pull-xs-right btn-primary"
                  type="button"
                  onClick={() => void submitForm()}
                >
                  Publish Article
                </button>
              </fieldset>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
