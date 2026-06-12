/**
 * Crea/asegura todas las cuentas demo de Barbería Bacano.
 * Uso: npx tsx scripts/seed-demo-users.ts
 */
import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import { DEMO_USERS, DEMO_PASSWORD } from '../src/features/auth/data/demoUsers';

const url = process.env.VITE_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(url, key, { auth: { persistSession: false } });

const BARBERSHOP_ID = '8bc02018-0fa4-41a2-b24d-4d6c375caf3d';

async function ensureUser(email: string, name: string, role: 'owner' | 'barber') {
  // Crear o reusar usuario auth
  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email,
    password: DEMO_PASSWORD,
    email_confirm: true,
  });

  let userId = created?.user?.id;
  if (createErr) {
    if (createErr.message.includes('already') || createErr.message.includes('registered')) {
      const { data } = await supabase.auth.admin.listUsers();
      userId = data?.users?.find((u) => u.email === email)?.id;
    } else {
      throw new Error(`${email}: ${createErr.message}`);
    }
  }
  if (!userId) throw new Error(`${email}: no se obtuvo userId`);

  // Asegurar contraseña (por si el usuario ya existía con otra)
  await supabase.auth.admin.updateUserById(userId, { password: DEMO_PASSWORD });

  // Crear/actualizar perfil
  const { error: profErr } = await supabase.from('profiles').upsert(
    {
      id: userId,
      barbershop_id: BARBERSHOP_ID,
      full_name: name,
      role,
      is_active: true,
    },
    { onConflict: 'id' }
  );
  if (profErr) throw new Error(`${email} perfil: ${profErr.message}`);

  console.log(`✅ ${name.padEnd(18)} ${role.padEnd(6)} ${email}`);
}

async function run() {
  console.log('🌱 Asegurando cuentas demo...\n');
  for (const u of DEMO_USERS) {
    await ensureUser(u.email, u.name, u.role);
  }
  console.log(`\n✅ Listo. ${DEMO_USERS.length} perfiles. Contraseña compartida: ${DEMO_PASSWORD}`);
}

run().catch((e) => {
  console.error('❌', e.message);
  process.exit(1);
});
