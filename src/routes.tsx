import { createBrowserRouter } from 'react-router';
import { AuthPage } from './core/auth/auth-page';
import { RequireAuth, RequireGuest } from './core/auth/auth-guards';
import { AppShell } from './core/layout/app-shell';
import { HomePage } from './features/article/pages/home/home';
import { ArticlePage } from './features/article/pages/article/article';
import { EditorPage } from './features/article/pages/editor/editor';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'tag/:tag', element: <HomePage /> },
      {
        element: <RequireGuest />,
        children: [
          { path: 'login', element: <AuthPage /> },
          { path: 'register', element: <AuthPage /> },
        ],
      },
      {
        element: <RequireAuth />,
        children: [
          { path: 'settings', element: null },
          { path: 'editor', element: <EditorPage /> },
          { path: 'editor/:slug', element: <EditorPage /> },
        ],
      },
      { path: 'article/:slug', element: <ArticlePage /> },
      { path: 'profile/:username', element: null },
      { path: 'profile/:username/favorites', element: null },
      { path: '*', element: null },
    ],
  },
]);
