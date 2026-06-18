import { useEffect, useState } from 'react';
import { supabase } from '@/shared/lib/supabase';

export interface Barbershop {
  id: string;
  name: string;
  slug: string;
}

/**
 * Datos de la barbería actual (la del usuario logueado). Post-login, la policy
 * `owners_read_own_barbershop` deja leer la propia fila de `barbershops`, así
 * que la marca (nombre) sale de la base y no se hardcodea "Bacano".
 *
 * Devuelve un fallback "Bacano" mientras carga / si no hay id, para no romper
 * la UI existente.
 */
export function useBarbershop(barbershopId: string | undefined): Barbershop | null {
  const [barbershop, setBarbershop] = useState<Barbershop | null>(null);

  useEffect(() => {
    if (!barbershopId) return;
    let cancelled = false;
    supabase
      .from('barbershops')
      .select('id, name, slug')
      .eq('id', barbershopId)
      .single()
      .then(({ data }) => {
        if (!cancelled && data) setBarbershop(data as Barbershop);
      });
    return () => {
      cancelled = true;
    };
  }, [barbershopId]);

  return barbershop;
}

/** Nombre corto para chips/headers: saca el prefijo "Barbería " si lo tiene. */
export function shortName(name: string | undefined, fallback = 'Bacano'): string {
  if (!name) return fallback;
  return name.replace(/^barber[ií]a\s+/i, '').trim() || name;
}
