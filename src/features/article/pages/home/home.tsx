import { Link, Navigate, useParams, useSearchParams } from 'react-router';
import { useAuth } from '../../../../core/auth/auth-context';
import { ArticleList } from '../../components/article-list';
import type { ArticleListConfig } from '../../models/article-list-config.model';
import { useTags } from '../../services/tags';
import './home.css';

export function HomePage() {
  const { isAuthenticated, authState } = useAuth();
  const { tag } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const feed = searchParams.get('feed');
  const pageParam = searchParams.get('page');
  const currentPage = pageParam ? parseInt(pageParam, 10) : 1;
  const { data: tags, isSuccess: tagsLoaded } = useTags();

  if (feed === 'following' && authState !== 'loading' && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  let type: string;
  let filters: { tag?: string } = {};

  if (tag) {
    type = 'all';
    filters = { tag };
  } else if (feed === 'following') {
    type = 'feed';
  } else {
    type = 'all';
  }

  const listConfig: ArticleListConfig = { type, filters };
  const isFollowingFeed = type === 'feed';

  function onPageChange(page: number): void {
    const queryParams = new URLSearchParams();

    if (feed) {
      queryParams.set('feed', feed);
    }

    if (page > 1) {
      queryParams.set('page', String(page));
    }

    setSearchParams(queryParams);
  }

  return (
    <div className="home-page">
      {!isAuthenticated && (
        <div className="banner">
          <div className="container">
            <h1 className="logo-font">
              <img src="assets/conduit-logo.svg" alt="Conduit" className="banner-logo" />
            </h1>
            <p>
              This is the <a href="https://github.com/realworld-apps/angular-realworld-example-app">Angular frontend</a>{' '}
              demo from the <a href="https://github.com/realworld-apps/realworld">Realworld</a> project.
              <br />
              This demo is connected to a demo backend that enforces session isolation.
            </p>
          </div>
        </div>
      )}

      <div className="container page">
        <div className="row">
          <div className="col-md-9">
            <div className="feed-toggle">
              <ul className="nav nav-pills outline-active">
                {isAuthenticated && (
                  <li className="nav-item">
                    <Link className={listConfig.type === 'feed' ? 'nav-link active' : 'nav-link'} to="/?feed=following">
                      Your Feed
                    </Link>
                  </li>
                )}
                <li className="nav-item">
                  <Link
                    className={listConfig.type === 'all' && !listConfig.filters.tag ? 'nav-link active' : 'nav-link'}
                    to="/"
                  >
                    Global Feed
                  </Link>
                </li>
                <li className="nav-item" hidden={!listConfig.filters.tag}>
                  <a className="nav-link active">
                    {' '}
                    <i className="ion-pound"></i> {listConfig.filters.tag}{' '}
                  </a>
                </li>
              </ul>
            </div>

            <ArticleList
              limit={10}
              config={listConfig}
              currentPage={currentPage}
              isFollowingFeed={isFollowingFeed}
              onPageChange={onPageChange}
            />
          </div>

          <div className="col-md-3">
            <div className="sidebar">
              <p>Popular Tags</p>

              <div className="tag-list">
                {(tags ?? []).map(popularTag => (
                  <Link key={popularTag} className="tag-default tag-pill" to={`/tag/${encodeURIComponent(popularTag)}`}>
                    {popularTag}
                  </Link>
                ))}
              </div>

              <div hidden={tagsLoaded}>Loading tags...</div>

              <div hidden={!tagsLoaded || (tags?.length ?? 0) > 0}>No tags are here... yet.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
