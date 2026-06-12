import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronRight, Scissors } from 'lucide-react';
import { formatPrice } from '@/shared/lib/utils';
import type { CierreGuardado } from '../cierreTypes';

interface Props {
  cierre: CierreGuardado;
  onClick: () => void;
}

export function CierreItem({ cierre, onClick }: Props) {
  // Preferimos la fecha guardada en el resumen; si no, la de closed_at.
  const fecha = cierre.resumen.fecha
    ? new Date(cierre.resumen.fecha + 'T12:00:00')
    : new Date(cierre.closed_at);
  const fechaLabel = format(fecha, "EEEE d 'de' MMMM", { locale: es });

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between gap-3 p-4 rounded-2xl border border-white/10 bg-white/[0.03] hover:border-white/20 active:scale-[0.99] transition-all text-left"
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-white capitalize truncate">{fechaLabel}</p>
        <p className="text-xs text-[#a1a1aa] mt-0.5 flex items-center gap-1">
          <Scissors className="w-3 h-3" />
          {cierre.resumen.total_cortes} cortes
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="font-semibold text-[#C9A84C] tabular-nums">
          {formatPrice(cierre.resumen.total_recaudado)}
        </span>
        <ChevronRight className="w-4 h-4 text-[#a1a1aa]" />
      </div>
    </button>
  );
}
