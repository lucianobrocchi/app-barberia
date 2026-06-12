import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { LocalLoginPage } from '@/features/auth/pages/LocalLoginPage';
import { ProfilePickerPage } from '@/features/auth/pages/ProfilePickerPage';
import { SetupAccountPage } from '@/features/auth/pages/SetupAccountPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { CierreCajaPage } from '@/features/dashboard/pages/CierreCajaPage';
import { HistorialCierresPage } from '@/features/dashboard/pages/HistorialCierresPage';
import { DetalleCierrePage } from '@/features/dashboard/pages/DetalleCierrePage';
import { BarberProfilePage } from '@/features/dashboard/pages/BarberProfilePage';
import { ConfiguracionPage } from '@/features/dashboard/pages/ConfiguracionPage';
import { BarberHomePage } from '@/features/barber/pages/BarberHomePage';
import { RegisterCutFlow } from '@/features/barber/components/RegisterCutFlow/RegisterCutFlow';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';

export const router = createBrowserRouter([
  {
    path: '/local',
    element: <LocalLoginPage />,
  },
  {
    path: '/',
    element: <ProfilePickerPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/setup-account',
    element: <SetupAccountPage />,
  },
  // Rutas del barbero
  {
    element: <ProtectedRoute requiredRole="barber" />,
    children: [
      {
        path: '/barber',
        element: <BarberHomePage />,
      },
      {
        path: '/barber/nuevo-corte',
        element: <RegisterCutFlow />,
      },
    ],
  },
  // Rutas del dueño
  {
    element: <ProtectedRoute requiredRole="owner" />,
    children: [
      {
        path: '/dashboard',
        element: <DashboardPage />,
      },
      {
        path: '/dashboard/nuevo-corte',
        element: <RegisterCutFlow />,
      },
      {
        path: '/dashboard/cierre',
        element: <CierreCajaPage />,
      },
      {
        path: '/dashboard/historial',
        element: <HistorialCierresPage />,
      },
      {
        path: '/dashboard/historial/:id',
        element: <DetalleCierrePage />,
      },
      {
        path: '/dashboard/barbero/:id',
        element: <BarberProfilePage />,
      },
      {
        path: '/dashboard/configuracion',
        element: <ConfiguracionPage />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
