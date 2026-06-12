import { startOfWeek, endOfWeek, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DaySelectorProps {
  /** Cualquier fecha dentro de la semana a mostrar. */
  weekStart: Date;
  onPrev: () => void;
  onNext: () => void;
  /** Si false, deshabilita la flecha derecha (no se muestran semanas futuras). */
  canGoNext: boolean;
}

export function DaySelector({ weekStart, onPrev, onNext, canGoNext }: DaySelectorProps) {
  const ws = startOfWeek(weekStart, { weekStartsOn: 1 });
  const we = endOfWeek(weekStart, { weekStartsOn: 1 });
  // "Lun 2 — Dom 8 jun"
  const label = `${format(ws, 'EEE d', { locale: es })} — ${format(we, "EEE d MMM", { locale: es })}`;

  return (
    <div className="flex items-center justify-between gap-2">
      <button
        onClick={onPrev}
        className="w-10 h-10 rounded-xl border border-white/10 bg-white/[0.03] flex items-center justify-center text-white hover:border-white/20 active:scale-95 transition-all"
        aria-label="Semana anterior"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <p className="text-sm font-medium text-white capitalize tabular-nums">{label}</p>

      <button
        onClick={onNext}
        disabled={!canGoNext}
        className="w-10 h-10 rounded-xl border border-white/10 bg-white/[0.03] flex items-center justify-center text-white hover:border-white/20 active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none"
        aria-label="Semana siguiente"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}
