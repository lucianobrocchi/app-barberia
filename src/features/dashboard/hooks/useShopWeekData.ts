import { useCallback, useEffect, useState } from 'react';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, eachDayOfInterval, format } from 'date-fns';
import { supabase } from '@/shared/lib/supabase';
import type { PaymentMethod } from '@/shared/types';
import type { DayData } from './useBarberWeekData';

export interface DayBarberStat {
  id: string;
  name: string;
  count: number;
  total: number;
}

/** Día del local: igual que DayData (lo usa WeekCalendar) + desglose por barbero. */
export type ShopDayData = DayData & { byBarber: DayBarberStat[] };

function emptyByPayment(): Record<PaymentMethod, number> {
  return { cash: 0, transfer: 0, mercadopago: 0, other: 0 };
}

/** Cortes del LOCAL (todos los barberos) por semana, agrupados por día + por barbero. */
export function useShopWeekData(shopIds: string[], weekStart: Date) {
  const [days, setDays] = useState<ShopDayData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const key = shopIds.join(',');

  const fetchData = useCallback(async () => {
    if (shopIds.length === 0) return;
    setIsLoading(true);
    const ws = startOfWeek(weekStart, { weekStartsOn: 1 });
    const we = endOfWeek(weekStart, { weekStartsOn: 1 });

    const { data } = await supabase
      .from('cuts')
      .select('price, payment_method, performed_at, barber_id, barber:profiles ( id, full_name )')
      .in('barbershop_id', shopIds)
      .gte('performed_at', startOfDay(ws).toISOString())
      .lte('performed_at', endOfDay(we).toISOString());

    const map = new Map<string, ShopDayData>();
    for (const d of eachDayOfInterval({ start: ws, end: we })) {
      const k = format(d, 'yyyy-MM-dd');
      map.set(k, { date: d, key: k, count: 0, total: 0, byPayment: emptyByPayment(), cuts: [], byBarber: [] });
    }

    const barberMaps = new Map<string, Map<string, DayBarberStat>>();
    for (const c of (data ?? []) as unknown as {
      price: number;
      payment_method: PaymentMethod;
      performed_at: string;
      barber_id: string;
      barber: { id: string; full_name: string } | null;
    }[]) {
      const dk = format(new Date(c.performed_at), 'yyyy-MM-dd');
      const dd = map.get(dk);
      if (!dd) continue;
      const price = Number(c.price);
      dd.count += 1;
      dd.total += price;
      dd.byPayment[c.payment_method] += price;

      if (!barberMaps.has(dk)) barberMaps.set(dk, new Map());
      const bm = barberMaps.get(dk)!;
      const id = c.barber?.id ?? c.barber_id;
      const name = c.barber?.full_name ?? 'Sin nombre';
      const cur = bm.get(id) ?? { id, name, count: 0, total: 0 };
      cur.count += 1;
      cur.total += price;
      bm.set(id, cur);
    }

    for (const [dk, bm] of barberMaps) {
      const dd = map.get(dk);
      if (dd) dd.byBarber = [...bm.values()].sort((a, b) => b.total - a.total);
    }

    setDays([...map.values()]);
    setIsLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, weekStart]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { days, isLoading };
}
