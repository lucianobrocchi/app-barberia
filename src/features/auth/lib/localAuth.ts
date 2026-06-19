/**
 * Login del LOCAL (barbería), previo al selector de perfiles.
 *
 * Camino A — sin Supabase Auth: validamos usuario+contraseña contra la tabla
 * `barbershops` vía el RPC `login_local` (security definer, no expone el hash).
 * La contraseña se hashea en el cliente con SHA-256 + salt, EXACTAMENTE igual
 * que en la migración SQL (pgcrypto digest('adda-bacano-local-v1' || pw)).
 * El salt DEBE coincidir en ambos lados o el login nunca valida.
 */
import { supabase } from '@/shared/lib/supabase';

const LOCAL_SALT = 'adda-bacano-local-v1';
const STORAGE_KEY = 'barberia_id';
const SESSION_KEY = 'barberia_session';

/** Sesión del local (multi-tenant): id + clave interna del one-tap + marca. */
export interface LocalSession {
  id: string;
  /** Clave interna para el one-tap (sign-in silencioso). No la ve el usuario. */
  appPassword: string;
  name: string;
  logoUrl: string | null;
}

/** SHA-256 de (salt + password) en hex. Igual al hash guardado en la base. */
async function hashLocalPassword(pw: string): Promise<string> {
  const data = new TextEncoder().encode(LOCAL_SALT + pw);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Valida credenciales del local (multi-tenant). Devuelve la sesión del local
 * (id + clave interna + marca) si son correctas, o null si no.
 */
export async function loginLocal(usuario: string, password: string): Promise<LocalSession | null> {
  const hash = await hashLocalPassword(password);
  const { data, error } = await supabase.rpc('login_local_v2', {
    p_usuario: usuario.trim(),
    p_password_hash: hash,
  });
  if (error) throw error;
  const row = (data as { barbershop_id: string; app_password: string; name: string; logo_url: string | null }[] | null)?.[0];
  if (!row) return null;
  return { id: row.barbershop_id, appPassword: row.app_password, name: row.name, logoUrl: row.logo_url };
}

/** Guarda la sesión del local en este dispositivo. */
export function setLocalSession(session: LocalSession): void {
  localStorage.setItem(STORAGE_KEY, session.id);
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

/** Sesión del local en este dispositivo (o null). */
export function getLocalSession(): LocalSession | null {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as LocalSession;
  } catch {
    return null;
  }
}

/** id de la barbería con sesión iniciada en este dispositivo (o null). */
export function getBarberiaId(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

/** Cierra la sesión del local (vuelve a pedir usuario/contraseña). */
export function clearBarberiaId(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(SESSION_KEY);
}
