/**
 * Genera un día ficticio de HOY para que corran las estadísticas del dashboard.
 * - Lucas: 12-14 cortes; resto de barberos: 8-10 cortes.
 * - Cortes repartidos desde las 9hs hasta la hora actual (día "en curso").
 *
 * Idempotente para hoy: borra SOLO los cortes de hoy (marcados seed-hoy) antes
 * de generar, así se puede re-correr sin duplicar. NO toca el histórico.
 * Usa SERVICE_ROLE_KEY (bypassa RLS).
 *
 * Correr: npx tsx scripts/seed-hoy.ts
 */
import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import { startOfDay, endOfDay, setHours, setMinutes } from 'date-fns';

const url = process.env.VITE_SUPABASE_URL!;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const sb = createClient(url, service, { auth: { persistSession: false } });

const MARKER = 'seed-hoy';
const rnd = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
function weighted<T>(items: [T, number][]): T {
  const total = items.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [v, w] of items) { if ((r -= w) <= 0) return v; }
  return items[0][0];
}

async function main() {
  const { data: shop } = await sb.from('barbershops').select('id').limit(1).single();
  const { data: barbers } = await sb
    .from('profiles')
    .select('id, full_name')
    .eq('barbershop_id', shop!.id)
    .eq('role', 'barber')
    .eq('is_active', true);
  const { data: services } = await sb
    .from('services')
    .select('id, name, price')
    .eq('barbershop_id', shop!.id)
    .eq('is_active', true);

  const WEIGHT_BY_NAME: Record<string, number> = {
    'Corte clásico': 45, 'Corte + barba': 30, 'Barba': 15, 'Color': 10,
  };
  const serviceWeights: [string, number][] = services!.map((s) => [s.id, WEIGHT_BY_NAME[s.name] ?? 10]);
  const priceOf = Object.fromEntries(services!.map((s) => [s.id, s.price]));

  const now = new Date();
  // Borrar SOLO los cortes de hoy generados por este script (idempotente).
  await sb
    .from('cuts')
    .delete()
    .eq('barbershop_id', shop!.id)
    .eq('notes', MARKER)
    .gte('performed_at', startOfDay(now).toISOString())
    .lte('performed_at', endOfDay(now).toISOString());

  // Hora tope: la actual (mínimo 12 para que siempre haya un rango decente).
  const horaTope = Math.max(12, now.getHours());

  const rows: Record<string, unknown>[] = [];
  for (const b of barbers!) {
    const esLucas = b.full_name.toLowerCase().includes('lucas');
    const nCuts = esLucas ? rnd(12, 14) : rnd(8, 10);
    for (let i = 0; i < nCuts; i++) {
      const serviceId = weighted(serviceWeights);
      const performedAt = setMinutes(setHours(now, rnd(9, horaTope)), pick([0, 10, 15, 20, 30, 40, 45, 50]));
      rows.push({
        barbershop_id: shop!.id,
        barber_id: b.id,
        service_id: serviceId,
        price: priceOf[serviceId],
        payment_method: weighted<'cash' | 'transfer'>([['cash', 52], ['transfer', 48]]),
        performed_at: performedAt.toISOString(),
        notes: MARKER,
      });
    }
  }

  const { error } = await sb.from('cuts').insert(rows);
  if (error) throw new Error(error.message);
  const totalRev = rows.reduce((s, r) => s + (r.price as number), 0);
  console.log(`✅ ${rows.length} cortes de HOY (${barbers!.length} barberos). Facturado hoy: $${totalRev.toLocaleString('es-AR')}`);
}

main().catch((e) => { console.error('❌', e.message); process.exit(1); });
