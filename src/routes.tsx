import { createBrowserRouter } from 'react-router';
import { AuthPage } from './core/auth/auth-page';
import { RequireAuth, RequireGuest } from './core/auth/auth-guards';
import { AppShell } from './core/layout/app-shell';
import { HomePage } from './features/article/pages/home/home';

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
          { path: 'editor', element: null },
          { path: 'editor/:slug', element: null },
        ],
      },
      { path: 'article/:slug', element: null },
      { path: 'profile/:username', element: null },
      { path: 'profile/:username/favorites', element: null },
      { path: '*', element: null },
    ],
  },
]);
