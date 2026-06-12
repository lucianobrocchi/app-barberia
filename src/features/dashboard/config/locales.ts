/**
 * Configuración de locales (multi-local).
 *
 * Hoy hay UNA sola barbería real (decisión del usuario: multi-local diferido).
 * El local principal del dueño se toma de su `profile.barbershop_id` en runtime
 * — no se hardcodea acá. Para sumar un 2º local en el futuro:
 *   1. Crear la barbería en Supabase.
 *   2. Ajustar RLS para que el dueño pueda leer ambos locales (hoy filtra por uno).
 *   3. Agregar su barbershopId a EXTRA_LOCALES con nombre/corto.
 * El selector de la UI ya está cableado para mostrar "Ambos" + cada local.
 */

export interface LocalDef {
  barbershopId: string;
  nombre: string;
  /** Etiqueta corta para el tab (ej: dirección). */
  corto: string;
}

/** Locales adicionales al principal del dueño. Vacío por ahora. */
export const EXTRA_LOCALES: LocalDef[] = [
  // { barbershopId: '...', nombre: 'Bacano Local 2', corto: '13 y 42' },
];

/** 'all' = ambos locales sumados. Si no, un barbershopId puntual. */
export type LocalValue = 'all' | string;
