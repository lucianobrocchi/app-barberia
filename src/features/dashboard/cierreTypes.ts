import type { PaymentMethod } from '@/shared/types';

export interface MetodoStat {
  cortes: number;
  monto: number;
}

export interface BarberoStat {
  barbero_id: string;
  nombre: string;
  cortes: number;
  monto: number;
}

export interface ServicioTop {
  servicio_id: string;
  nombre: string;
  cantidad: number;
}

/** Resumen completo de un día. Es lo que se guarda como JSON en cash_register_sessions.notes */
export interface CierreResumen {
  fecha: string; // 'yyyy-MM-dd'
  total_recaudado: number;
  total_cortes: number;
  ticket_promedio: number;
  desglose_por_metodo: Partial<Record<PaymentMethod, MetodoStat>>;
  desglose_por_barbero: BarberoStat[];
  servicios_top: ServicioTop[];
}

/** Un cierre guardado (fila de cash_register_sessions ya parseada). */
export interface CierreGuardado {
  id: string;
  closed_at: string;
  closed_by: string | null;
  resumen: CierreResumen;
}
