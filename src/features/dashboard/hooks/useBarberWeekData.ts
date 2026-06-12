import { useCallback, useEffect, useState } from 'react';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, eachDayOfInterval, format } from 'date-fns';
import { supabase } from '@/shared/lib/supabase';
import type { PaymentMethod } from '@/shared/types';

export interface DayCut {
  id: string;
  price: number;
  payment_method: PaymentMethod;
  performed_at: string;
  serviceName: string;
}

export interface DayData {
  date: Date;
  /** yyyy-MM-dd */
  key: string;
  count: number;
  total: number;
  byPayment: Record<PaymentMethod, number>;
  cuts: DayCut[];
}

function emptyByPayment(): Record<PaymentMethod, number> {
  return { cash: 0, transfer: 0, mercadopago: 0, other: 0 };
}

/**
 * Trae los cortes de UN barbero para la semana (lun-dom) que contiene `weekStart`
 * y los agrupa por día. `weekStart` debe venir memoizado (estable) del padre.
 */
export function useBarberWeekData(barberId: string | undefined, weekStart: Date) {
  const [days, setDays] = useState<DayData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!barberId) return;
    setIsLoading(true);
    const ws = startOfWeek(weekStart, { weekStartsOn: 1 });
    const we = endOfWeek(weekStart, { weekStartsOn: 1 });

    const { data, error } = await supabase
      .from('cuts')
      .select('id, price, payment_method, performed_at, service:services ( name )')
      .eq('barber_id', barberId)
      .gte('performed_at', startOfDay(ws).toISOString())
      .lte('performed_at', endOfDay(we).toISOString())
      .order('performed_at', { ascending: true });

    // Inicializamos los 7 días (así los días sin cortes quedan como "Libre").
    const map = new Map<string, DayData>();
    for (const d of eachDayOfInterval({ start: ws, end: we })) {
      const key = format(d, 'yyyy-MM-dd');
      map.set(key, { date: d, key, count: 0, total: 0, byPayment: emptyByPayment(), cuts: [] });
    }

    if (error) {
      setError(error.message);
    } else {
      for (const c of (data ?? []) as unknown as {
        id: string;
        price: number;
        payment_method: PaymentMethod;
        performed_at: string;
        service: { name: string } | null;
      }[]) {
        const dd = map.get(format(new Date(c.performed_at), 'yyyy-MM-dd'));
        if (!dd) continue;
        const price = Number(c.price);
        dd.count += 1;
        dd.total += price;
        dd.byPayment[c.payment_method] += price;
        dd.cuts.push({
          id: c.id,
          price,
          payment_method: c.payment_method,
          performed_at: c.performed_at,
          serviceName: c.service?.name ?? 'Servicio',
        });
      }
      setError(null);
    }

    setDays([...map.values()]);
    setIsLoading(false);
  }, [barberId, weekStart]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { days, isLoading, error };
}
