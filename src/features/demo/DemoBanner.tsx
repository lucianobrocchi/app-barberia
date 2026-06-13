import { FlaskConical, ChevronRight } from 'lucide-react';

interface DemoBannerProps {
  count: number;
  onClick: () => void;
}

/**
 * Aviso de MODO DEMO. Aparece cuando hay cortes de demostración cargados, para
 * que nadie confunda los números de ejemplo con los reales. Tap → Administración.
 */
export function DemoBanner({ count, onClick }: DemoBannerProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border border-amber-400/30 bg-amber-400/[0.07] text-left hover:bg-amber-400/[0.12] active:scale-[0.99] transition-all"
    >
      <span className="w-9 h-9 rounded-xl bg-amber-400/15 flex items-center justify-center shrink-0">
        <FlaskConical className="w-5 h-5 text-amber-300" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-amber-200 leading-tight">Modo demo</p>
        <p className="text-xs text-amber-200/70 leading-tight">
          Estás viendo {count.toLocaleString('es-AR')} cortes de ejemplo. Tocá para limpiar y arrancar.
        </p>
      </div>
      <ChevronRight className="w-4 h-4 text-amber-300/70 shrink-0" />
    </button>
  );
}
