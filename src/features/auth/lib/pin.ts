/**
 * PIN de 4 dígitos por barbero.
 *
 * ⚠️ Seguridad: hasheamos con SHA-256 en el cliente (crypto.subtle). NO es
 * bcrypt — es un gate suave para el piloto, no protección criptográfica fuerte.
 * Supabase no expone bcrypt en el cliente y no hay Edge Functions configuradas,
 * así que SHA-256 + salt de app es lo elegido para no bloquear el desarrollo.
 * Para producción real: mover a una Edge Function con bcrypt.
 */

const PIN_SALT = 'adda-bacano-pin-v1';

/** true si es exactamente 4 dígitos numéricos. */
export function isValidPinFormat(pin: string): boolean {
  return /^\d{4}$/.test(pin);
}

/** Hashea el PIN (salt + pin) con SHA-256 y devuelve hex. */
export async function hashPin(pin: string): Promise<string> {
  const data = new TextEncoder().encode(PIN_SALT + pin);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Compara un PIN ingresado contra el hash guardado. */
export async function verifyPin(pin: string, hash: string | null | undefined): Promise<boolean> {
  if (!hash) return false;
  const computed = await hashPin(pin);
  return computed === hash;
}
