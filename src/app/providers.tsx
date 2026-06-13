import { RouterProvider } from 'react-router-dom';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { router } from './router';

export function AppProviders() {
  return (
    <>
      <RouterProvider router={router} />
      <SpeedInsights />
    </>
  );
}
