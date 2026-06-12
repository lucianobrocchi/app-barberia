/**
 * Crea un barbero de prueba para Barbería Bacano.
 * Uso: npx tsx scripts/seed-barber.ts
 */
import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(url, key, { auth: { persistSession: false } });

const BARBERSHOP_ID = '8bc02018-0fa4-41a2-b24d-4d6c375caf3d';
const BARBER = {
  email: 'barbero@barberiabacano.com',
  password: 'AdDaApp2024!',
  full_name: 'Lucas Barbero',
};

async function run() {
  // 1. Crear usuario auth (o reusar si ya existe)
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: BARBER.email,
    password: BARBER.password,
    email_confirm: true,
  });

  let userId = authData?.user?.id;
  if (authError && authError.message.includes('already')) {
    const { data } = await supabase.auth.admin.listUsers();
    userId = data?.users?.find((u) => u.email === BARBER.email)?.id;
  } else if (authError) {
    console.error('❌ Error creando usuario:', authError.message);
    process.exit(1);
  }

  if (!userId) {
    console.error('❌ No se obtuvo el ID del barbero');
    process.exit(1);
  }
  console.log(`✅ Auth user: ${BARBER.email} (${userId})`);

  // 2. Crear/actualizar su perfil como barbero
  const { error: profileError } = await supabase.from('profiles').upsert(
    {
      id: userId,
      barbershop_id: BARBERSHOP_ID,
      full_name: BARBER.full_name,
      role: 'barber',
      is_active: true,
    },
    { onConflict: 'id' }
  );

  if (profileError) {
    console.error('❌ Error creando perfil:', profileError.message);
    process.exit(1);
  }
  console.log(`✅ Perfil: ${BARBER.full_name} (barber)`);

  console.log('\n✅ Barbero de prueba listo!');
  console.log('\nCredenciales del barbero:');
  console.log(`  Email:      ${BARBER.email}`);
  console.log(`  Contraseña: ${BARBER.password}`);
}

run().catch((e) => {
  console.error('❌', e);
  process.exit(1);
});
