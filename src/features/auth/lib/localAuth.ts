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

/** SHA-256 de (salt + password) en hex. Igual al hash guardado en la base. */
async function hashLocalPassword(pw: string): Promise<string> {
  const data = new TextEncoder().encode(LOCAL_SALT + pw);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Valida credenciales del local. Devuelve el id de la barbería si son
 * correctas, o null si no. Lanza si hay error de red/RPC.
 */
export async function loginLocal(usuario: string, password: string): Promise<string | null> {
  const hash = await hashLocalPassword(password);
  const { data, error } = await supabase.rpc('login_local', {
    p_usuario: usuario.trim(),
    p_password_hash: hash,
  });
  if (error) throw error;
  return (data as string | null) ?? null;
}

/** id de la barbería con sesión iniciada en este dispositivo (o null). */
export function getBarberiaId(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

/** Guarda la sesión del local en este dispositivo. */
export function setBarberiaId(id: string): void {
  localStorage.setItem(STORAGE_KEY, id);
}

/** Cierra la sesión del local (vuelve a pedir usuario/contraseña). */
export function clearBarberiaId(): void {
  localStorage.removeItem(STORAGE_KEY);
}
