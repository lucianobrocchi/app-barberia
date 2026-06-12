import { useCallback, useEffect, useState } from 'react';
import { startOfDay, endOfDay } from 'date-fns';
import { supabase } from '@/shared/lib/supabase';
import type { Cut, Service } from '@/shared/types';

export type TodayCut = Cut & {
  service: Pick<Service, 'id' | 'name'> | null;
};

/**
 * Trae los cortes de HOY del barbero autenticado y se suscribe en realtime:
 * cuando se inserta un corte nuevo del barbero, la lista se actualiza sola.
 */
export function useTodayCuts(barberId: string | undefined) {
  const [cuts, setCuts] = useState<TodayCut[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCuts = useCallback(async () => {
    if (!barberId) return;
    setIsLoading(true);
    const now = new Date();

    const { data, error } = await supabase
      .from('cuts')
      .select('*, service:services ( id, name )')
      .eq('barber_id', barberId)
      .gte('performed_at', startOfDay(now).toISOString())
      .lte('performed_at', endOfDay(now).toISOString())
      .order('performed_at', { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setCuts((data ?? []) as unknown as TodayCut[]);
      setError(null);
    }
    setIsLoading(false);
  }, [barberId]);

  // Carga inicial
  useEffect(() => {
    fetchCuts();
  }, [fetchCuts]);

  // Suscripción realtime a inserciones de cortes de este barbero
  useEffect(() => {
    if (!barberId) return;

    const channel = supabase
      .channel(`cuts-today-${barberId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'cuts',
          filter: `barber_id=eq.${barberId}`,
        },
        () => {
          // Re-consultamos para traer el join con el servicio
          fetchCuts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [barberId, fetchCuts]);

  const total = cuts.reduce((sum, c) => sum + Number(c.price), 0);

  return { cuts, total, count: cuts.length, isLoading, error, refetch: fetchCuts };
}
