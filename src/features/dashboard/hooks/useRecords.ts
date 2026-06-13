import { useCallback, useEffect, useState } from 'react';
import { startOfDay, subDays, format, startOfWeek, isAfter } from 'date-fns';
import { supabase } from '@/shared/lib/supabase';

/** Ventana de historia que miramos para calcular récords y rachas. */
const HISTORY_DAYS = 180;

export interface DayAgg {
  date: Date;
  total: number;
  count: number;
}

export interface Records {
  bestDay: DayAgg | null;
  bestWeek: { start: Date; total: number } | null;
  recordCutsDay: { date: Date; count: number } | null;
  /** Días abiertos seguidos con ventas, terminando hoy (o el último día abierto). */
  currentStreak: number;
  /** La racha más larga de la historia reciente. */
  bestStreak: number;
  isLoading: boolean;
}

/** Domingo y lunes el local cierra: no cuentan y no cortan la racha. */
function isClosed(d: Date): boolean {
  const dow = d.getDay();
  return dow === 0 || dow === 1;
}

const EMPTY: Records = {
  bestDay: null,
  bestWeek: null,
  recordCutsDay: null,
  currentStreak: 0,
  bestStreak: 0,
  isLoading: true,
};

export function useRecords(shopIds: string[]): Records {
  const [records, setRecords] = useState<Records>(EMPTY);
  const key = shopIds.join(',');

  const fetchData = useCallback(async () => {
    if (shopIds.length === 0) return;
    setRecords((r) => ({ ...r, isLoading: true }));

    const from = startOfDay(subDays(new Date(), HISTORY_DAYS - 1));
    const { data } = await supabase
      .from('cuts')
      .select('price, performed_at')
      .in('barbershop_id', shopIds)
      .gte('performed_at', from.toISOString());

    // Agregamos por día.
    const byDay = new Map<string, DayAgg>();
    for (const c of (data ?? []) as { price: number; performed_at: string }[]) {
      const d = startOfDay(new Date(c.performed_at));
      const k = format(d, 'yyyy-MM-dd');
      const cur = byDay.get(k) ?? { date: d, total: 0, count: 0 };
      cur.total += Number(c.price);
      cur.count += 1;
      byDay.set(k, cur);
    }
    const dayHasSales = (d: Date) => (byDay.get(format(d, 'yyyy-MM-dd'))?.count ?? 0) > 0;

    // Mejor día y récord de cortes.
    let bestDay: DayAgg | null = null;
    let recordCutsDay: { date: Date; count: number } | null = null;
    for (const agg of byDay.values()) {
      if (!bestDay || agg.total > bestDay.total) bestDay = agg;
      if (!recordCutsDay || agg.count > recordCutsDay.count) {
        recordCutsDay = { date: agg.date, count: agg.count };
      }
    }

    // Mejor semana (lunes a domingo).
    const byWeek = new Map<string, { start: Date; total: number }>();
    for (const agg of byDay.values()) {
      const ws = startOfWeek(agg.date, { weekStartsOn: 1 });
      const wk = format(ws, 'yyyy-MM-dd');
      const cur = byWeek.get(wk) ?? { start: ws, total: 0 };
      cur.total += agg.total;
      byWeek.set(wk, cur);
    }
    let bestWeek: { start: Date; total: number } | null = null;
    for (const w of byWeek.values()) {
      if (!bestWeek || w.total > bestWeek.total) bestWeek = w;
    }

    // Racha actual: desde hoy hacia atrás, contando días abiertos con ventas.
    const today = startOfDay(new Date());
    let cursor = today;
    // Si hoy está abierto pero todavía no facturó, arrancamos desde ayer.
    if (!isClosed(today) && !dayHasSales(today)) cursor = subDays(today, 1);
    let currentStreak = 0;
    for (let i = 0; i < HISTORY_DAYS; i++) {
      if (isClosed(cursor)) {
        cursor = subDays(cursor, 1);
        continue;
      }
      if (dayHasSales(cursor)) {
        currentStreak += 1;
        cursor = subDays(cursor, 1);
      } else {
        break;
      }
    }

    // Mejor racha: recorremos cronológicamente todos los días abiertos.
    let bestStreak = 0;
    let run = 0;
    const start = startOfDay(subDays(new Date(), HISTORY_DAYS - 1));
    for (let i = 0; i < HISTORY_DAYS; i++) {
      const d = subDays(today, HISTORY_DAYS - 1 - i);
      if (isAfter(start, d)) continue;
      if (isClosed(d)) continue;
      if (dayHasSales(d)) {
        run += 1;
        if (run > bestStreak) bestStreak = run;
      } else {
        run = 0;
      }
    }

    setRecords({
      bestDay,
      bestWeek,
      recordCutsDay,
      currentStreak,
      bestStreak: Math.max(bestStreak, currentStreak),
      isLoading: false,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return records;
}
