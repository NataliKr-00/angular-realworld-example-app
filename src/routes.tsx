import { createBrowserRouter } from 'react-router';
import { AppShell } from './core/layout/app-shell';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: null },
      { path: '*', element: null },
    ],
  },
]);
