/**
 * Seed script: creates a barbershop, an owner user, and example services.
 * Usage: npx tsx scripts/seed.ts
 *
 * Requires a .env.local with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY,
 * plus a SERVICE_ROLE_KEY for admin operations (bypasses RLS).
 *
 * Add to .env.local:
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ...
 */

import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../src/shared/types/database';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌  Faltan variables de entorno: VITE_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Use service role client to bypass RLS during seeding
const supabase = createClient<Database>(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const BARBERSHOP = {
  name: 'Barbería Bacano',
  slug: 'barberia-bacano',
  address: 'Calle 50 1234, La Plata, Buenos Aires',
  phone: '+542214000000',
  timezone: 'America/Argentina/Buenos_Aires',
  currency: 'ARS',
};

const OWNER = {
  email: 'dueno@barberiabacano.com',
  password: 'AdDaApp2024!',
  full_name: 'Dueño Bacano',
};

const SERVICES = [
  { name: 'Corte clásico', price: 5000, duration_minutes: 30, display_order: 1 },
  { name: 'Corte + barba', price: 7500, duration_minutes: 45, display_order: 2 },
  { name: 'Barba', price: 3500, duration_minutes: 20, display_order: 3 },
  { name: 'Corte niño', price: 4000, duration_minutes: 25, display_order: 4 },
  { name: 'Diseño de barba', price: 4500, duration_minutes: 30, display_order: 5 },
];

async function seed() {
  console.log('🌱  Iniciando seed para Barbería Bacano...\n');

  // 1. Create barbershop
  const { data: barbershop, error: bsError } = await supabase
    .from('barbershops')
    .upsert(BARBERSHOP, { onConflict: 'slug' })
    .select()
    .single();

  if (bsError) {
    console.error('❌  Error creando barbershop:', bsError.message);
    process.exit(1);
  }
  console.log(`✅  Barbershop: ${barbershop.name} (${barbershop.id})`);

  // 2. Create auth user for owner
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: OWNER.email,
    password: OWNER.password,
    email_confirm: true,
  });

  if (authError && !authError.message.includes('already registered')) {
    console.error('❌  Error creando usuario:', authError.message);
    process.exit(1);
  }

  const userId = authData?.user?.id ?? (await getExistingUserId(OWNER.email));
  if (!userId) {
    console.error('❌  No se pudo obtener el ID del usuario');
    process.exit(1);
  }
  console.log(`✅  Auth user: ${OWNER.email} (${userId})`);

  // 3. Create owner profile
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      barbershop_id: barbershop.id,
      full_name: OWNER.full_name,
      role: 'owner',
      is_active: true,
    }, { onConflict: 'id' });

  if (profileError) {
    console.error('❌  Error creando perfil:', profileError.message);
    process.exit(1);
  }
  console.log(`✅  Profile: ${OWNER.full_name} (owner)`);

  // 4. Create services
  const servicesWithBarbershop = SERVICES.map((s) => ({
    ...s,
    barbershop_id: barbershop.id,
    is_active: true,
  }));

  const { data: createdServices, error: servicesError } = await supabase
    .from('services')
    .upsert(servicesWithBarbershop, { onConflict: 'id' })
    .select();

  if (servicesError) {
    console.error('❌  Error creando servicios:', servicesError.message);
    process.exit(1);
  }
  console.log(`✅  ${createdServices?.length} servicios creados:`);
  createdServices?.forEach((s) => console.log(`   - ${s.name}: $${s.price}`));

  console.log('\n✅  Seed completado exitosamente!');
  console.log('\nCredenciales del dueño:');
  console.log(`  Email:      ${OWNER.email}`);
  console.log(`  Contraseña: ${OWNER.password}`);
  console.log('\n⚠️   Cambiá la contraseña inmediatamente después del primer login.');
}

async function getExistingUserId(email: string): Promise<string | null> {
  const { data } = await supabase.auth.admin.listUsers();
  const user = data?.users?.find((u) => u.email === email);
  return user?.id ?? null;
}

seed().catch((err) => {
  console.error('❌  Seed fallido:', err);
  process.exit(1);
});
