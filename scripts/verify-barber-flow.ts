/**
 * Verifica el flujo del barbero usando la MISMA ruta que la app:
 * login con anon key (respeta RLS) -> leer servicios -> insertar corte -> leer cortes de hoy con join.
 */
import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import { startOfDay, endOfDay } from 'date-fns';

const url = process.env.VITE_SUPABASE_URL!;
const anon = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(url, anon);

const EMAIL = 'barbero@barberiabacano.com';
const PASSWORD = 'AdDaApp2024!';

async function main() {
  // 1. Login como barbero (igual que la app)
  const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
    email: EMAIL,
    password: PASSWORD,
  });
  if (authErr) throw new Error('Login: ' + authErr.message);
  const uid = auth.user!.id;
  console.log('✅ Login OK como barbero:', uid);

  // 2. Leer perfil (rol + barbershop)
  const { data: profile, error: pErr } = await supabase
    .from('profiles')
    .select('full_name, role, barbershop_id')
    .eq('id', uid)
    .single();
  if (pErr) throw new Error('Perfil: ' + pErr.message);
  console.log(`✅ Perfil: ${profile.full_name} | rol=${profile.role} | shop=${profile.barbershop_id}`);

  // 3. Leer servicios activos (igual que StepService)
  const { data: services, error: sErr } = await supabase
    .from('services')
    .select('*')
    .eq('barbershop_id', profile.barbershop_id)
    .eq('is_active', true)
    .order('display_order');
  if (sErr) throw new Error('Servicios: ' + sErr.message);
  console.log(`✅ Servicios activos: ${services.length}`);
  services.forEach((s) => console.log(`   - ${s.name}: $${s.price}`));

  // 4. Insertar un corte (igual que useRegisterCut)
  const svc = services[0];
  const now = new Date().toISOString();
  const { error: cErr } = await supabase.from('cuts').insert({
    barbershop_id: profile.barbershop_id,
    barber_id: uid,
    service_id: svc.id,
    price: svc.price,
    payment_method: 'cash',
    performed_at: now,
    created_at: now,
  });
  if (cErr) throw new Error('Insert corte: ' + cErr.message);
  console.log(`✅ Corte insertado: ${svc.name} / efectivo / $${svc.price}`);

  // 5. Leer cortes de hoy con join (igual que useTodayCuts)
  const d = new Date();
  const { data: cuts, error: tErr } = await supabase
    .from('cuts')
    .select('*, service:services ( id, name )')
    .eq('barber_id', uid)
    .gte('performed_at', startOfDay(d).toISOString())
    .lte('performed_at', endOfDay(d).toISOString())
    .order('performed_at', { ascending: false });
  if (tErr) throw new Error('Leer cortes: ' + tErr.message);

  const total = cuts!.reduce((s, c) => s + Number(c.price), 0);
  console.log(`✅ Cortes de hoy: ${cuts!.length} | total $${total}`);
  cuts!.forEach((c: any) => console.log(`   - ${c.service?.name} | ${c.payment_method} | $${c.price}`));

  console.log('\n✅ FLUJO COMPLETO VERIFICADO bajo RLS real.');
}

main().catch((e) => {
  console.error('❌', e.message);
  process.exit(1);
});
