import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router';
import { AuthProvider } from './core/auth/auth-context';
import { bindDebugInterface } from './core/auth/conduit-debug';
import { initAuth } from './core/auth/auth-session';
import { router } from './routes';
import '../realworld/assets/theme/styles.css';

const queryClient = new QueryClient();

bindDebugInterface();
initAuth();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
