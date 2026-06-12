import { Trophy } from 'lucide-react';
import { formatPrice } from '@/shared/lib/utils';
import type { BarberoStat } from '../cierreTypes';

interface Props {
  barberos: BarberoStat[];
  total: number;
}

export function DesglosePorBarbero({ barberos, total }: Props) {
  if (barberos.length === 0) {
    return (
      <div className="text-center py-8 rounded-2xl border border-dashed border-white/10">
        <p className="text-sm text-[#a1a1aa]">Sin cortes registrados</p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {barberos.map((b, i) => {
        const pct = total > 0 ? Math.round((b.monto / total) * 100) : 0;
        return (
          <div key={b.barbero_id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-semibold shrink-0 ${
                    i === 0 ? 'bg-[#C9A84C] text-[#0a0a0a]' : 'bg-white/10 text-[#a1a1aa]'
                  }`}
                >
                  {i === 0 ? <Trophy className="w-3.5 h-3.5" /> : i + 1}
                </span>
                <span className="font-medium text-white truncate">{b.nombre}</span>
              </div>
              <div className="text-right shrink-0">
                <p className="font-semibold text-white tabular-nums">{formatPrice(b.monto)}</p>
                <p className="text-xs text-[#a1a1aa]">{b.cortes} cortes</p>
              </div>
            </div>
            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
              <div className="h-full rounded-full bg-[#C9A84C]" style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
