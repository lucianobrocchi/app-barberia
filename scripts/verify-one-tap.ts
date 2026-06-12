/**
 * Verifica que CADA barbero entra de un toque (login con la DEMO_PASSWORD compartida)
 * y que su perfil tiene rol 'barber'. El dueño se valida aparte.
 */
import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import { DEMO_USERS, DEMO_PASSWORD } from '../src/features/auth/data/demoUsers';

const url = process.env.VITE_SUPABASE_URL!;
const anon = process.env.VITE_SUPABASE_ANON_KEY!;

async function check(email: string, name: string, expectedRole: string) {
  const sb = createClient(url, anon, { auth: { persistSession: false } });
  const { data: auth, error } = await sb.auth.signInWithPassword({ email, password: DEMO_PASSWORD });
  if (error) return console.log(`❌ ${name.padEnd(16)} login FALLÓ: ${error.message}`);
  const { data: prof } = await sb
    .from('profiles')
    .select('role')
    .eq('id', auth.user!.id)
    .single();
  const ok = prof?.role === expectedRole;
  console.log(`${ok ? '✅' : '⚠️ '} ${name.padEnd(16)} login OK · rol=${prof?.role}`);
}

async function run() {
  console.log('— Barberos (deben entrar de un toque, rol=barber) —\n');
  for (const u of DEMO_USERS.filter((u) => u.role === 'barber')) {
    await check(u.email, u.name, 'barber');
  }
  console.log('\n— Dueño (rol=owner) —\n');
  const owner = DEMO_USERS.find((u) => u.role === 'owner')!;
  await check(owner.email, owner.name, 'owner');
}

run();
