/**
 * Actualiza precios:
 *   - Corte clásico  -> $14.000
 *   - Corte + barba  -> $15.000
 * y recalcula el price de TODOS los cortes existentes para que coincida con el
 * precio actual de su servicio (así las estadísticas reflejan los nuevos números).
 * Barba y Color quedan igual. Usa SERVICE_ROLE_KEY (bypassa RLS).
 */
import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import { startOfDay, endOfDay, subDays } from 'date-fns';

const sb = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});

const NUEVOS: Record<string, number> = {
  'Corte clásico': 14000,
  'Corte + barba': 15000,
};

async function totalDias(dias: number) {
  const now = new Date();
  const { data } = await sb
    .from('cuts')
    .select('price')
    .gte('performed_at', startOfDay(subDays(now, dias - 1)).toISOString())
    .lte('performed_at', endOfDay(now).toISOString());
  return { n: data?.length ?? 0, total: (data ?? []).reduce((s, c) => s + Number(c.price), 0) };
}

async function main() {
  const { data: services } = await sb.from('services').select('id, name, price');

  // 1) Actualizar precios de los servicios indicados
  for (const s of services ?? []) {
    if (NUEVOS[s.name] != null && NUEVOS[s.name] !== s.price) {
      const { error } = await sb.from('services').update({ price: NUEVOS[s.name] }).eq('id', s.id);
      if (error) throw new Error(`servicio ${s.name}: ${error.message}`);
      console.log(`✓ ${s.name}: $${s.price} -> $${NUEVOS[s.name]}`);
    }
  }

  // 2) Re-fetch precios actualizados y alinear los cortes a su servicio
  const { data: updated } = await sb.from('services').select('id, name, price');
  for (const s of updated ?? []) {
    const { error, count } = await sb
      .from('cuts')
      .update({ price: s.price }, { count: 'exact' })
      .eq('service_id', s.id)
      .neq('price', s.price);
    if (error) throw new Error(`cuts de ${s.name}: ${error.message}`);
    if (count) console.log(`  ↳ ${count} cortes de "${s.name}" actualizados a $${s.price}`);
  }

  console.log('\n=== Nuevos totales ===');
  for (const [label, d] of [['Hoy', 1], ['Semana (7d)', 7], ['Mes (30d)', 30]] as [string, number][]) {
    const r = await totalDias(d);
    console.log(`${label.padEnd(14)} ${String(r.n).padStart(4)} cortes   $${r.total.toLocaleString('es-AR')}`);
  }
}

main().catch((e) => { console.error('❌', e.message); process.exit(1); });
