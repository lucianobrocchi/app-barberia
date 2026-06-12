/**
 * Verifica el RPC login_local con las credenciales reales (bacano / bacano2026).
 * Calcula el hash igual que lo hará el frontend (SHA-256 de salt+password).
 */
import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';

const url = process.env.VITE_SUPABASE_URL!;
const anon = process.env.VITE_SUPABASE_ANON_KEY!;
// Usamos la anon key a propósito: así probamos el mismo camino que el cliente.
const supabase = createClient(url, anon, { auth: { persistSession: false } });

const SALT = 'adda-bacano-local-v1';
function hash(pw: string) {
  return createHash('sha256').update(SALT + pw).digest('hex');
}

async function run() {
  // Caso correcto
  const ok = await supabase.rpc('login_local', {
    p_usuario: 'bacano',
    p_password_hash: hash('bacano2026'),
  });
  console.log('✅ Login correcto →', ok.error ? `ERROR: ${ok.error.message}` : ok.data);

  // Caso contraseña incorrecta
  const bad = await supabase.rpc('login_local', {
    p_usuario: 'bacano',
    p_password_hash: hash('claveincorrecta'),
  });
  console.log('🔒 Login con clave mala →', bad.error ? `ERROR: ${bad.error.message}` : bad.data);
}

run();
