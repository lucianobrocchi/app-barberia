/**
 * Perfiles demo de Barbería Bacano para el selector "¿Quién sos?".
 *
 * ⚠️ SOLO PARA DEMO/PILOTO: todos comparten una contraseña interna y el
 * selector permite entrar de un toque. En producción real, cada persona
 * debería loguearse con su propia contraseña vía /login.
 *
 * Esta lista es la única fuente de verdad: la usa el frontend (selector)
 * y el script scripts/seed-demo-users.ts (crear las cuentas).
 */

export type DemoRole = 'owner' | 'barber';

export interface DemoUser {
  /** id del perfil en Supabase (para leer su nombre/estado actual de la base). */
  id: string;
  email: string;
  name: string;
  role: DemoRole;
  /** Color del avatar (initiales). */
  color: string;
}

export const DEMO_PASSWORD = 'AdDaApp2024!';

export const DEMO_USERS: DemoUser[] = [
  { id: '8c00c074-728c-444a-8fef-dd80a66eda3f', email: 'dueno@barberiabacano.com', name: 'Juani Bacano', role: 'owner', color: '#C9A84C' },
  { id: 'e6149a40-92e1-4b12-b76c-d876069d72ca', email: 'barbero@barberiabacano.com', name: 'Lucas Barbero', role: 'barber', color: '#6366f1' },
  { id: '842a45f3-9a09-4881-a3a4-407039691872', email: 'mateo@barberiabacano.com', name: 'Mateo Giménez', role: 'barber', color: '#ec4899' },
  { id: 'c9479849-03da-43dc-af94-5bc5ab8545f1', email: 'tomas@barberiabacano.com', name: 'Tomás Ríos', role: 'barber', color: '#14b8a6' },
  { id: '860ef673-d0b9-41bc-86c3-3149f0bdb471', email: 'nahuel@barberiabacano.com', name: 'Nahuel Sosa', role: 'barber', color: '#f59e0b' },
  { id: '7a7096fe-581e-4ae5-92b1-25e25a7e84cd', email: 'bruno@barberiabacano.com', name: 'Bruno Vega', role: 'barber', color: '#3b82f6' },
  { id: '3e19e70e-b0ee-4ffc-85e1-027560789930', email: 'ivan@barberiabacano.com', name: 'Iván Torres', role: 'barber', color: '#a855f7' },
];

/** Devuelve las iniciales (máx 2) de un nombre. */
export function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}
