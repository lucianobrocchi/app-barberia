import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/shared/lib/supabase';
import type { CierreGuardado, CierreResumen } from '../cierreTypes';

function parseRow(row: {
  id: string;
  closed_at: string | null;
  closed_by: string | null;
  notes: string | null;
}): CierreGuardado | null {
  if (!row.notes || !row.closed_at) return null;
  try {
    const resumen = JSON.parse(row.notes) as CierreResumen;
    if (!resumen || typeof resumen.total_recaudado !== 'number') return null;
    return { id: row.id, closed_at: row.closed_at, closed_by: row.closed_by, resumen };
  } catch {
    return null;
  }
}

/** Lista todos los cierres guardados del local, del más reciente al más antiguo. */
export function useHistorialCierres(barbershopId: string | undefined) {
  const [cierres, setCierres] = useState<CierreGuardado[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!barbershopId) return;
    setIsLoading(true);
    const { data } = await supabase
      .from('cash_register_sessions')
      .select('id, closed_at, closed_by, notes')
      .eq('barbershop_id', barbershopId)
      .not('closed_at', 'is', null)
      .order('closed_at', { ascending: false });

    const parsed = (data ?? [])
      .map(parseRow)
      .filter((c): c is CierreGuardado => c !== null);
    setCierres(parsed);
    setIsLoading(false);
  }, [barbershopId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { cierres, isLoading, refetch: fetchData };
}

/** Trae un cierre puntual por id. */
export function useCierreById(id: string | undefined) {
  const [cierre, setCierre] = useState<CierreGuardado | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setIsLoading(true);
    supabase
      .from('cash_register_sessions')
      .select('id, closed_at, closed_by, notes')
      .eq('id', id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        const parsed = data ? parseRow(data) : null;
        setCierre(parsed);
        setNotFound(!parsed);
        setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return { cierre, isLoading, notFound };
}
