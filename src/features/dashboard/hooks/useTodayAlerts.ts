import { useCallback, useEffect, useState } from 'react';
import { startOfDay, endOfDay } from 'date-fns';
import { supabase } from '@/shared/lib/supabase';

export interface DashboardAlert {
  id: string;
  type: 'no_sales' | 'barber_idle';
  message: string;
}

/**
 * Alertas simples del día:
 * - "no_sales": no hubo ventas hoy en todo el local.
 * - "barber_idle": un barbero activo no registró cortes hoy.
 */
export function useTodayAlerts(barbershopId: string | undefined) {
  const [alerts, setAlerts] = useState<DashboardAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAlerts = useCallback(async () => {
    if (!barbershopId) return;
    setIsLoading(true);
    const now = new Date();

    // Barberos activos del local
    const { data: barbers } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('barbershop_id', barbershopId)
      .eq('role', 'barber')
      .eq('is_active', true);

    // Cortes de hoy (solo barber_id y precio)
    const { data: todayCuts } = await supabase
      .from('cuts')
      .select('barber_id, price')
      .eq('barbershop_id', barbershopId)
      .gte('performed_at', startOfDay(now).toISOString())
      .lte('performed_at', endOfDay(now).toISOString());

    const result: DashboardAlert[] = [];
    const cuts = todayCuts ?? [];

    if (cuts.length === 0) {
      result.push({
        id: 'no_sales',
        type: 'no_sales',
        message: 'Todavía no hay ventas registradas hoy.',
      });
    } else {
      const barbersWithCuts = new Set(cuts.map((c) => c.barber_id));
      for (const b of barbers ?? []) {
        if (!barbersWithCuts.has(b.id)) {
          result.push({
            id: `idle-${b.id}`,
            type: 'barber_idle',
            message: `${b.full_name} no registró cortes hoy.`,
          });
        }
      }
    }

    setAlerts(result);
    setIsLoading(false);
  }, [barbershopId]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  return { alerts, isLoading, refetch: fetchAlerts };
}
