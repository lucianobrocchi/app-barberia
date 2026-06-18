import { useCallback, useEffect, useState } from 'react';
import { startOfWeek, endOfWeek, startOfDay, endOfDay } from 'date-fns';
import { supabase } from '@/shared/lib/supabase';

export interface BarberRanking {
  /** Posición del barbero (1 = primero). 0 si no hizo cortes esta semana. */
  rank: number;
  totalBarbers: number;
  myTotal: number;
  /** Cuánto le falta para pasar al de arriba (0 si ya es primero). */
  toNext: number;
  isLoading: boolean;
}

const EMPTY: BarberRanking = { rank: 0, totalBarbers: 0, myTotal: 0, toNext: 0, isLoading: true };

/**
 * Ranking del barbero dentro de su local en la SEMANA actual (lun–dom).
 * No expone los montos ni nombres de los demás: solo posición y la diferencia
 * para subir un puesto (motivación sin invadir privacidad).
 */
export function useBarberRanking(barbershopId: string | undefined, barberId: string | undefined): BarberRanking {
  const [ranking, setRanking] = useState<BarberRanking>(EMPTY);

  const fetchData = useCallback(async () => {
    if (!barbershopId || !barberId) return;
    setRanking((r) => ({ ...r, isLoading: true }));

    const now = new Date();
    const ws = startOfDay(startOfWeek(now, { weekStartsOn: 1 }));
    const we = endOfDay(endOfWeek(now, { weekStartsOn: 1 }));

    const { data } = await supabase
      .from('cuts')
      .select('barber_id, price')
      .eq('barbershop_id', barbershopId)
      .gte('performed_at', ws.toISOString())
      .lte('performed_at', we.toISOString());

    const totals = new Map<string, number>();
    for (const c of (data ?? []) as { barber_id: string; price: number }[]) {
      totals.set(c.barber_id, (totals.get(c.barber_id) ?? 0) + Number(c.price));
    }

    const sorted = [...totals.entries()].sort((a, b) => b[1] - a[1]);
    const myTotal = totals.get(barberId) ?? 0;
    const myIndex = sorted.findIndex(([id]) => id === barberId);
    const rank = myIndex === -1 ? 0 : myIndex + 1;
    const toNext = myIndex > 0 ? sorted[myIndex - 1][1] - myTotal : 0;

    setRanking({
      rank,
      totalBarbers: sorted.length,
      myTotal,
      toNext,
      isLoading: false,
    });
  }, [barbershopId, barberId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return ranking;
}
