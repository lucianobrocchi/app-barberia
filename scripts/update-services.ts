/**
 * Ajusta los servicios de Barbería Bacano:
 * - Desactiva "Corte niño" y "Diseño de barba" (no se borran para no perder histórico).
 * - Agrega "Color".
 * También imprime la estructura real de cash_register_sessions (para el Paso 4).
 */
import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(url, key, { auth: { persistSession: false } });

const BARBERSHOP_ID = '8bc02018-0fa4-41a2-b24d-4d6c375caf3d';

async function run() {
  // 1. Desactivar servicios
  for (const nombre of ['Corte niño', 'Diseño de barba']) {
    const { error } = await supabase
      .from('services')
      .update({ is_active: false })
      .eq('barbershop_id', BARBERSHOP_ID)
      .eq('name', nombre);
    console.log(error ? `❌ ${nombre}: ${error.message}` : `✅ Desactivado: ${nombre}`);
  }

  // 2. Agregar "Color" (si no existe)
  const { data: existing } = await supabase
    .from('services')
    .select('id')
    .eq('barbershop_id', BARBERSHOP_ID)
    .eq('name', 'Color')
    .maybeSingle();

  if (existing) {
    await supabase.from('services').update({ is_active: true }).eq('id', existing.id);
    console.log('✅ "Color" ya existía — reactivado');
  } else {
    const { error } = await supabase.from('services').insert({
      barbershop_id: BARBERSHOP_ID,
      name: 'Color',
      price: 8000, // ⚠️ PLACEHOLDER — confirmar precio real
      duration_minutes: 45,
      is_active: true,
      display_order: 6,
    });
    console.log(error ? `❌ Color: ${error.message}` : '✅ Agregado: Color ($8.000 placeholder)');
  }

  // 3. Listar servicios activos resultantes
  const { data: activos } = await supabase
    .from('services')
    .select('name, price, is_active')
    .eq('barbershop_id', BARBERSHOP_ID)
    .eq('is_active', true)
    .order('display_order');
  console.log('\n📋 Servicios activos ahora:');
  activos?.forEach((s) => console.log(`   - ${s.name}: $${s.price}`));

  // 4. Estructura real de cash_register_sessions
  const { data: sample, error: sErr } = await supabase
    .from('cash_register_sessions')
    .select('*')
    .limit(1);
  console.log('\n🔎 cash_register_sessions:');
  if (sErr) console.log('   error:', sErr.message);
  else console.log('   columnas:', sample && sample[0] ? Object.keys(sample[0]).join(', ') : '(vacía — uso las de la migración: id, barbershop_id, opened_at, closed_at, opened_by, closed_by, notes)');
}

run().catch((e) => { console.error('❌', e); process.exit(1); });
