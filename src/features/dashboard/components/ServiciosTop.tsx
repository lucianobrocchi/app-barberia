import { Scissors } from 'lucide-react';
import type { ServicioTop as ServicioTopType } from '../cierreTypes';

interface Props {
  servicios: ServicioTopType[];
}

export function ServiciosTop({ servicios }: Props) {
  if (servicios.length === 0) {
    return (
      <div className="text-center py-8 rounded-2xl border border-dashed border-white/10">
        <p className="text-sm text-[#a1a1aa]">Sin datos</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] divide-y divide-white/5">
      {servicios.map((s, i) => (
        <div key={s.servicio_id} className="flex items-center gap-3 p-4">
          <span className="w-6 h-6 rounded-lg bg-white/10 text-[#a1a1aa] flex items-center justify-center text-xs font-semibold shrink-0">
            {i + 1}
          </span>
          <Scissors className="w-4 h-4 text-[#C9A84C] shrink-0" />
          <span className="flex-1 text-sm font-medium text-white truncate">{s.nombre}</span>
          <span className="text-sm text-[#a1a1aa] tabular-nums">
            {s.cantidad} {s.cantidad === 1 ? 'vez' : 'veces'}
          </span>
        </div>
      ))}
    </div>
  );
}
