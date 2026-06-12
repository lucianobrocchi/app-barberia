import { useCallback, useEffect, useState } from 'react';
import { startOfDay, endOfDay, format } from 'date-fns';
import { supabase } from '@/shared/lib/supabase';
import type { PaymentMethod } from '@/shared/types';
import type { CierreResumen, MetodoStat, BarberoStat, ServicioTop } from '../cierreTypes';

interface ExistingCierre {
  id: string;
}

/**
 * Calcula el resumen del día de HOY desde los cortes,
 * y verifica si ya existe un cierre guardado para hoy.
 */
export function useCierreDia(barbershopId: string | undefined) {
  const [resumen, setResumen] = useState<CierreResumen | null>(null);
  const [existing, setExisting] = useState<ExistingCierre | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!barbershopId) return;
    setIsLoading(true);
    const now = new Date();
    const fromISO = startOfDay(now).toISOString();
    const toISO = endOfDay(now).toISOString();

    // Cortes de hoy con joins
    const { data: cuts } = await supabase
      .from('cuts')
      .select('price, payment_method, service:services ( id, name ), barber:profiles ( id, full_name )')
      .eq('barbershop_id', barbershopId)
      .gte('performed_at', fromISO)
      .lte('performed_at', toISO);

    // ¿Ya hay cierre hoy?
    const { data: cierres } = await supabase
      .from('cash_register_sessions')
      .select('id')
      .eq('barbershop_id', barbershopId)
      .not('closed_at', 'is', null)
      .gte('closed_at', fromISO)
      .lte('closed_at', toISO)
      .limit(1);

    setExisting(cierres && cierres.length > 0 ? { id: cierres[0].id } : null);

    const rows = (cuts ?? []) as unknown as {
      price: number;
      payment_method: PaymentMethod;
      service: { id: string; name: string } | null;
      barber: { id: string; full_name: string } | null;
    }[];

    const total = rows.reduce((s, c) => s + Number(c.price), 0);
    const count = rows.length;

    // Por método
    const porMetodo: Partial<Record<PaymentMethod, MetodoStat>> = {};
    for (const c of rows) {
      const m = c.payment_method;
      porMetodo[m] = porMetodo[m] ?? { cortes: 0, monto: 0 };
      porMetodo[m]!.cortes += 1;
      porMetodo[m]!.monto += Number(c.price);
    }

    // Por barbero
    const barberoMap = new Map<string, BarberoStat>();
    for (const c of rows) {
      const id = c.barber?.id ?? 'sin-id';
      const nombre = c.barber?.full_name ?? 'Sin nombre';
      const cur = barberoMap.get(id) ?? { barbero_id: id, nombre, cortes: 0, monto: 0 };
      cur.cortes += 1;
      cur.monto += Number(c.price);
      barberoMap.set(id, cur);
    }
    const porBarbero = [...barberoMap.values()].sort((a, b) => b.monto - a.monto);

    // Servicios top
    const servicioMap = new Map<string, ServicioTop>();
    for (const c of rows) {
      const id = c.service?.id ?? 'sin-id';
      const nombre = c.service?.name ?? 'Servicio';
      const cur = servicioMap.get(id) ?? { servicio_id: id, nombre, cantidad: 0 };
      cur.cantidad += 1;
      servicioMap.set(id, cur);
    }
    const serviciosTop = [...servicioMap.values()]
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 3);

    setResumen({
      fecha: format(now, 'yyyy-MM-dd'),
      total_recaudado: total,
      total_cortes: count,
      ticket_promedio: count > 0 ? total / count : 0,
      desglose_por_metodo: porMetodo,
      desglose_por_barbero: porBarbero,
      servicios_top: serviciosTop,
    });
    setIsLoading(false);
  }, [barbershopId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { resumen, existing, isLoading, refetch: fetchData };
}
