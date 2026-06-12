/**
 * Seed de ~6 meses de cortes con volúmenes REALISTAS por barbero:
 *   - Lucas Barbero: 12-14 cortes/día
 *   - Resto de barberos: 8-10 cortes/día
 * Lunes cerrado. Cubre desde hace 6 meses hasta HOY (inclusive).
 *
 * CLEAN SLATE: borra todos los cortes del local y regenera (todo era data de
 * prueba). Cada corte queda marcado notes='seed-demo-6m' (reversible con
 * limpiar-seed-demo.ts). Usa SERVICE_ROLE_KEY (bypassa RLS).
 */
import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import { subMonths, eachDayOfInterval, startOfDay, setHours, setMinutes } from 'date-fns';

const url = process.env.VITE_SUPABASE_URL!;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const sb = createClient(url, service, { auth: { persistSession: false } });

const MARKER = 'seed-demo-6m';
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
  const { data: barbers } = await sb.from('profiles').select('id, full_name').eq('barbershop_id', shop!.id).eq('role', 'barber');
  const { data: services } = await sb.from('services').select('id, name, price').eq('barbershop_id', shop!.id).eq('is_active', true);

  const WEIGHT_BY_NAME: Record<string, number> = {
    'Corte clásico': 45, 'Corte + barba': 30, 'Barba': 15, 'Color': 10,
  };
  const serviceWeights: [string, number][] = services!.map((s) => [s.id, WEIGHT_BY_NAME[s.name] ?? 10]);
  const priceOf = Object.fromEntries(services!.map((s) => [s.id, s.price]));

  // CLEAN SLATE
  await sb.from('cuts').delete().eq('barbershop_id', shop!.id);
  console.log(`Clean slate OK. ${barbers!.length} barberos · ${services!.length} servicios`);

  const today = new Date();
  const from = startOfDay(subMonths(today, 6));
  const allDays = eachDayOfInterval({ start: from, end: startOfDay(today) });

  const rows: Record<string, unknown>[] = [];
  for (const day of allDays) {
    const dow = day.getDay(); // 0 dom, 1 lun ... 6 sáb
    if (dow === 0 || dow === 1) continue; // cerrado domingo y lunes (abre mar-sáb)
    for (const b of barbers!) {
      const esLucas = b.full_name.toLowerCase().includes('lucas');
      const nCuts = esLucas ? rnd(12, 14) : rnd(8, 10);
      for (let i = 0; i < nCuts; i++) {
        const serviceId = weighted(serviceWeights);
        const performedAt = setMinutes(setHours(day, rnd(9, 20)), pick([0, 10, 15, 20, 30, 40, 45, 50]));
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
  }

  console.log(`Generados ${rows.length} cortes (${allDays.length} días). Insertando...`);
  let inserted = 0;
  for (let i = 0; i < rows.length; i += 500) {
    const batch = rows.slice(i, i + 500);
    const { error } = await sb.from('cuts').insert(batch);
    if (error) throw new Error(`batch ${i}: ${error.message}`);
    inserted += batch.length;
    process.stdout.write(`\r  ${inserted}/${rows.length}`);
  }
  const totalRev = rows.reduce((s, r) => s + (r.price as number), 0);
  console.log(`\n✅ ${inserted} cortes. Facturación simulada: $${totalRev.toLocaleString('es-AR')}`);
}

main().catch((e) => { console.error('\n❌', e.message); process.exit(1); });
