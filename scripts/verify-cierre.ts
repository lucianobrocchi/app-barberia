/**
 * Verifica el flujo de cierre bajo RLS real: login dueño -> insertar cierre en
 * cash_register_sessions (notes=JSON) -> leerlo -> BORRARLO (para no bloquear el día).
 */
import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL!;
const anon = process.env.VITE_SUPABASE_ANON_KEY!;
const sb = createClient(url, anon, { auth: { persistSession: false } });

async function main() {
  const { data: auth, error: authErr } = await sb.auth.signInWithPassword({
    email: 'dueno@barberiabacano.com',
    password: 'AdDaApp2024!',
  });
  if (authErr) throw new Error('login: ' + authErr.message);
  const uid = auth.user!.id;
  const { data: prof } = await sb.from('profiles').select('barbershop_id').eq('id', uid).single();
  console.log('✅ Login dueño OK, shop:', prof!.barbershop_id);

  const resumen = {
    fecha: '2099-01-01',
    total_recaudado: 12345,
    total_cortes: 3,
    ticket_promedio: 4115,
    desglose_por_metodo: { cash: { cortes: 2, monto: 8000 }, transfer: { cortes: 1, monto: 4345 } },
    desglose_por_barbero: [{ barbero_id: uid, nombre: 'Test', cortes: 3, monto: 12345 }],
    servicios_top: [{ servicio_id: 'x', nombre: 'Corte', cantidad: 3 }],
  };
  const now = new Date().toISOString();

  const { data: inserted, error: insErr } = await sb
    .from('cash_register_sessions')
    .insert({
      barbershop_id: prof!.barbershop_id,
      opened_by: uid,
      closed_by: uid,
      opened_at: now,
      closed_at: now,
      notes: JSON.stringify(resumen),
    })
    .select()
    .single();
  if (insErr) throw new Error('INSERT (RLS): ' + insErr.message);
  console.log('✅ Insert OK, id:', inserted.id);

  const { data: readBack } = await sb
    .from('cash_register_sessions')
    .select('id, notes')
    .eq('id', inserted.id)
    .single();
  const parsed = JSON.parse(readBack!.notes);
  console.log('✅ Leído de vuelta. total_recaudado:', parsed.total_recaudado);

  const { error: delErr } = await sb.from('cash_register_sessions').delete().eq('id', inserted.id);
  console.log(delErr ? '⚠️  No se pudo borrar: ' + delErr.message : '✅ Registro de prueba borrado (día limpio)');

  console.log('\n✅ FLUJO DE CIERRE VERIFICADO bajo RLS.');
}

main().catch((e) => { console.error('❌', e.message); process.exit(1); });
