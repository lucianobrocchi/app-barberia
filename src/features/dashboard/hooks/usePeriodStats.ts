import { useCallback, useEffect, useState } from 'react';
import { startOfDay, endOfDay, subDays } from 'date-fns';
import { supabase } from '@/shared/lib/supabase';
import type { Cut, Service, Profile, PaymentMethod } from '@/shared/types';
import type { ServicioTop } from '../cierreTypes';

export type Period = 'today' | 'week' | 'month';

export type DashboardCut = Cut & {
  service: Pick<Service, 'id' | 'name'> | null;
  barber: Pick<Profile, 'id' | 'full_name'> | null;
};

export interface BarberStat {
  barberId: string;
  name: string;
  count: number;
  total: number;
  avgTicket: number;
  /** Comisión a pagar al barbero (50% de su total). */
  commission: number;
}

export type PaymentBreakdown = Record<PaymentMethod, { count: number; total: number }>;

/** Comparativo vs el período anterior equivalente. */
export interface PeriodDelta {
  total: number;
  count: number;
  ganancia: number;
}

/** Largo de la ventana en días para cada período. */
const WINDOW_DAYS: Record<Period, number> = { today: 1, week: 7, month: 30 };

/**
 * Rango del período como VENTANA MÓVIL que siempre termina hoy e incluye los
 * días previos (hoy / últimos 7 días / últimos 30 días). Así "Semana" suma
 * ayer + hoy y no depende del día de la semana en que estés.
 */
function rangeFor(period: Period, now: Date): { from: Date; to: Date } {
  const days = WINDOW_DAYS[period];
  return { from: startOfDay(subDays(now, days - 1)), to: endOfDay(now) };
}

/** Período inmediatamente anterior, de la misma longitud (para el comparativo). */
function prevRangeFor(period: Period, now: Date): { from: Date; to: Date } {
  const days = WINDOW_DAYS[period];
  const cur = rangeFor(period, now);
  return { from: subDays(cur.from, days), to: subDays(cur.to, days) };
}

const EMPTY_PAYMENT: PaymentBreakdown = {
  cash: { count: 0, total: 0 },
  transfer: { count: 0, total: 0 },
  mercadopago: { count: 0, total: 0 },
  other: { count: 0, total: 0 },
};

function asArray(ids: string | string[] | undefined): string[] {
  if (!ids) return [];
  return Array.isArray(ids) ? ids : [ids];
}

/** Ganancia neta del dueño: 100% de sus cortes + 50% de los de los demás. */
function gananciaNeta(cuts: { barber_id: string; price: number | string }[], ownerId?: string): number {
  return cuts.reduce((s, c) => {
    const p = Number(c.price);
    return s + (ownerId && c.barber_id === ownerId ? p : p * 0.5);
  }, 0);
}

export function usePeriodStats(
  barbershopId: string | string[] | undefined,
  period: Period,
  ownerId?: string,
) {
  const [cuts, setCuts] = useState<DashboardCut[]>([]);
  const [prevDelta, setPrevDelta] = useState<PeriodDelta>({ total: 0, count: 0, ganancia: 0 });
  const [barbersActive, setBarbersActive] = useState(0);
  const [barbersTotal, setBarbersTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const ids = asArray(barbershopId);
    if (ids.length === 0) return;
    setIsLoading(true);
    const now = new Date();
    const cur = rangeFor(period, now);
    const prev = prevRangeFor(period, now);

    const [curRes, prevRes, barbersRes] = await Promise.all([
      supabase
        .from('cuts')
        .select('*, service:services ( id, name ), barber:profiles ( id, full_name )')
        .in('barbershop_id', ids)
        .gte('performed_at', cur.from.toISOString())
        .lte('performed_at', cur.to.toISOString())
        .order('performed_at', { ascending: false }),
      supabase
        .from('cuts')
        .select('barber_id, price')
        .in('barbershop_id', ids)
        .gte('performed_at', prev.from.toISOString())
        .lte('performed_at', prev.to.toISOString()),
      supabase
        .from('profiles')
        .select('id, is_active')
        .in('barbershop_id', ids)
        .eq('role', 'barber'),
    ]);

    if (curRes.error) {
      setError(curRes.error.message);
      setIsLoading(false);
      return;
    }
    setCuts((curRes.data ?? []) as unknown as DashboardCut[]);

    const prevCuts = (prevRes.data ?? []) as { barber_id: string; price: number }[];
    setPrevDelta({
      total: prevCuts.reduce((s, c) => s + Number(c.price), 0),
      count: prevCuts.length,
      ganancia: gananciaNeta(prevCuts, ownerId),
    });

    const barbers = (barbersRes.data ?? []) as { id: string; is_active: boolean }[];
    setBarbersTotal(barbers.length);
    setBarbersActive(barbers.filter((b) => b.is_active).length);

    setError(null);
    setIsLoading(false);
  }, [barbershopId, period, ownerId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Agregaciones del período actual
  const total = cuts.reduce((s, c) => s + Number(c.price), 0);
  const count = cuts.length;
  const avgTicket = count > 0 ? total / count : 0;
  const ganancia = gananciaNeta(cuts, ownerId);

  const byBarberMap = new Map<string, BarberStat>();
  for (const c of cuts) {
    const id = c.barber?.id ?? c.barber_id;
    const name = c.barber?.full_name ?? 'Sin nombre';
    const cur = byBarberMap.get(id) ?? { barberId: id, name, count: 0, total: 0, avgTicket: 0, commission: 0 };
    cur.count += 1;
    cur.total += Number(c.price);
    byBarberMap.set(id, cur);
  }
  const byBarber = [...byBarberMap.values()]
    .map((b) => ({ ...b, avgTicket: b.count > 0 ? b.total / b.count : 0, commission: b.total * 0.5 }))
    .sort((a, b) => b.total - a.total);

  const byPayment: PaymentBreakdown = {
    cash: { count: 0, total: 0 },
    transfer: { count: 0, total: 0 },
    mercadopago: { count: 0, total: 0 },
    other: { count: 0, total: 0 },
  };
  for (const c of cuts) {
    const m = c.payment_method;
    byPayment[m].count += 1;
    byPayment[m].total += Number(c.price);
  }

  // Servicios más hechos en el período (para ServiciosTop).
  const byServiceMap = new Map<string, ServicioTop>();
  for (const c of cuts) {
    const id = c.service?.id ?? c.service_id;
    const nombre = c.service?.name ?? 'Sin servicio';
    const curS = byServiceMap.get(id) ?? { servicio_id: id, nombre, cantidad: 0 };
    curS.cantidad += 1;
    byServiceMap.set(id, curS);
  }
  const byService = [...byServiceMap.values()].sort((a, b) => b.cantidad - a.cantidad);

  return {
    cuts,
    total,
    count,
    avgTicket,
    ganancia,
    byBarber,
    byPayment,
    byService,
    barbersActive,
    barbersTotal,
    prevDelta,
    isLoading,
    error,
    refetch: fetchData,
  };
}

export { EMPTY_PAYMENT };
