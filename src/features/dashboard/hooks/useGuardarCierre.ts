import { useState } from 'react';
import { supabase } from '@/shared/lib/supabase';
import type { CierreResumen } from '../cierreTypes';

export function useGuardarCierre() {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Guarda el cierre del día en cash_register_sessions.
   * El resumen completo va como JSON en la columna `notes` (la tabla real no
   * tiene columnas para totales/desgloses).
   */
  async function guardarCierre(
    barbershopId: string,
    closedBy: string,
    resumen: CierreResumen
  ): Promise<boolean> {
    setIsSaving(true);
    setError(null);
    const now = new Date().toISOString();

    const { error } = await supabase.from('cash_register_sessions').insert({
      barbershop_id: barbershopId,
      opened_by: closedBy,
      closed_by: closedBy,
      opened_at: now,
      closed_at: now,
      notes: JSON.stringify(resumen),
    });

    setIsSaving(false);
    if (error) {
      setError(error.message);
      return false;
    }
    return true;
  }

  return { guardarCierre, isSaving, error };
}
