import { QueryClientProvider } from '@tanstack/react-query';
import { MotionConfig } from 'framer-motion';
import { useState } from 'react';
import { BrowserRouter } from 'react-router';

import { AppRoutes } from './AppRoutes';
import { AuthProvider } from './contexts/AuthProvider';
import { ToastProvider } from './contexts/ToastProvider';
import { createQueryClient } from './services/query-client';

export function App() {
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      {/* reducedMotion="user": with prefers-reduced-motion, movement (transforms,
          layout) is dropped and only opacity changes remain */}
      <MotionConfig reducedMotion="user">
        <ToastProvider>
          <BrowserRouter>
            <AuthProvider>
              <AppRoutes />
            </AuthProvider>
          </BrowserRouter>
        </ToastProvider>
      </MotionConfig>
    </QueryClientProvider>
  );
}
