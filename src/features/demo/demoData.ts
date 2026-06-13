import { subDays, startOfDay, addHours, addMinutes } from 'date-fns';
import { supabase } from '@/shared/lib/supabase';
import type { PaymentMethod } from '@/shared/types';

/**
 * Datos de DEMOSTRACIÓN.
 *
 * Genera cortes de ejemplo realistas (últimos meses) para mostrar la app
 * funcionando, y permite borrarlos para "arrancar de verdad". Todos los cortes
 * de demo se marcan con notes = DEMO_NOTE, así la limpieza nunca toca los reales
 * (los cortes reales se crean con notes = null).
 *
 * Funciona desde el cliente porque la policy `owners_full_access_cuts` le da al
 * dueño acceso total a los cuts de su barbería (insert/delete).
 */
export const DEMO_NOTE = 'demo';

/** Cuántos días hacia atrás generamos. ~3 meses. */
const DEMO_DAYS = 90;

interface DemoService {
  id: string;
  price: number;
}
interface DemoBarber {
  id: string;
  /** Peso de "popularidad": cuántos cortes tiende a hacer (para que el ranking sea interesante). */
  weight: number;
}
interface DemoCutRow {
  barbershop_id: string;
  barber_id: string;
  service_id: string;
  price: number;
  payment_method: PaymentMethod;
  notes: string;
  performed_at: string;
  created_at: string;
}

function weightedPick<T>(items: { v: T; w: number }[]): T {
  const total = items.reduce((s, i) => s + i.w, 0);
  let r = Math.random() * total;
  for (const it of items) {
    r -= it.w;
    if (r <= 0) return it.v;
  }
  return items[items.length - 1].v;
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Distribución de métodos de pago (efectivo manda, después MP).
const PAYMENT_WEIGHTS: { v: PaymentMethod; w: number }[] = [
  { v: 'cash', w: 45 },
  { v: 'mercadopago', w: 30 },
  { v: 'transfer', w: 18 },
  { v: 'other', w: 7 },
];

// Hora del corte: pico a la tarde/noche (10–20 h).
const HOUR_WEIGHTS: { v: number; w: number }[] = [
  { v: 10, w: 1 }, { v: 11, w: 2 }, { v: 12, w: 2 }, { v: 13, w: 1 },
  { v: 14, w: 2 }, { v: 15, w: 3 }, { v: 16, w: 4 }, { v: 17, w: 5 },
  { v: 18, w: 5 }, { v: 19, w: 4 }, { v: 20, w: 2 },
];

/** Construye las filas de cortes de demo en memoria (sin tocar la base). */
function generateRows(
  barbershopId: string,
  services: DemoService[],
  barbers: DemoBarber[],
): DemoCutRow[] {
  const rows: DemoCutRow[] = [];
  // Servicios más frecuentes: los primeros pesan más (suele ser "Corte").
  const serviceWeights = services.map((s, i) => ({ v: s, w: services.length - i }));
  const barberWeights = barbers.map((b) => ({ v: b, w: b.weight }));

  for (let d = DEMO_DAYS - 1; d >= 0; d--) {
    const day = startOfDay(subDays(new Date(), d));
    const dow = day.getDay();
    if (dow === 0 || dow === 1) continue; // domingo y lunes: cerrado

    // Volumen del día (fin de semana más cargado).
    let volume = randInt(14, 30);
    if (dow === 5) volume = Math.round(volume * 1.4); // viernes
    if (dow === 6) volume = Math.round(volume * 1.6); // sábado

    for (let i = 0; i < volume; i++) {
      const service = weightedPick(serviceWeights);
      const barber = weightedPick(barberWeights);
      const hour = weightedPick(HOUR_WEIGHTS);
      const performedAt = addMinutes(addHours(day, hour), randInt(0, 59));
      const iso = performedAt.toISOString();
      rows.push({
        barbershop_id: barbershopId,
        barber_id: barber.id,
        service_id: service.id,
        price: service.price,
        payment_method: weightedPick(PAYMENT_WEIGHTS),
        notes: DEMO_NOTE,
        performed_at: iso,
        created_at: iso,
      });
    }
  }
  return rows;
}

/** Cantidad de cortes de demo cargados en esta barbería. */
export async function countDemoCuts(barbershopId: string): Promise<number> {
  const { count } = await supabase
    .from('cuts')
    .select('id', { count: 'exact', head: true })
    .eq('barbershop_id', barbershopId)
    .eq('notes', DEMO_NOTE);
  return count ?? 0;
}

/**
 * Carga datos de demo. Trae servicios y barberos activos (+ el dueño, que
 * también corta), genera cortes y los inserta por lotes.
 * Devuelve cuántos cortes se cargaron.
 */
export async function seedDemoData(
  barbershopId: string,
  ownerId: string,
  onProgress?: (done: number, total: number) => void,
): Promise<number> {
  const [svcRes, barbersRes] = await Promise.all([
    supabase
      .from('services')
      .select('id, price')
      .eq('barbershop_id', barbershopId)
      .eq('is_active', true),
    supabase
      .from('profiles')
      .select('id')
      .eq('barbershop_id', barbershopId)
      .eq('role', 'barber')
      .eq('is_active', true),
  ]);

  const services = (svcRes.data ?? []) as DemoService[];
  const barberIds = [...(barbersRes.data ?? []).map((b) => b.id as string), ownerId];

  if (services.length === 0) {
    throw new Error('No hay servicios activos para generar la demo.');
  }
  if (barberIds.length === 0) {
    throw new Error('No hay barberos activos para generar la demo.');
  }

  // Peso de popularidad aleatorio por barbero → ranking variado.
  const barbers: DemoBarber[] = barberIds.map((id) => ({ id, weight: randInt(6, 14) }));

  const rows = generateRows(barbershopId, services, barbers);

  const BATCH = 400;
  for (let i = 0; i < rows.length; i += BATCH) {
    const { error } = await supabase.from('cuts').insert(rows.slice(i, i + BATCH));
    if (error) throw new Error(error.message);
    onProgress?.(Math.min(i + BATCH, rows.length), rows.length);
  }

  return rows.length;
}

/** Borra SOLO los cortes de demo de esta barbería. Devuelve cuántos borró. */
export async function clearDemoData(barbershopId: string): Promise<number> {
  const before = await countDemoCuts(barbershopId);
  const { error } = await supabase
    .from('cuts')
    .delete()
    .eq('barbershop_id', barbershopId)
    .eq('notes', DEMO_NOTE);
  if (error) throw new Error(error.message);
  return before;
}
