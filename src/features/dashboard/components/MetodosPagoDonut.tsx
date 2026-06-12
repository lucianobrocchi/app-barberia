import { formatPrice } from '@/shared/lib/utils';
import type { PaymentBreakdown as Breakdown } from '../hooks/usePeriodStats';
import type { PaymentMethod } from '@/shared/types';

interface MetodosPagoDonutProps {
  byPayment: Breakdown;
  total: number;
}

const META: { key: PaymentMethod; label: string; color: string }[] = [
  { key: 'cash', label: 'Efectivo', color: '#C9A84C' },
  { key: 'transfer', label: 'Transferencia', color: '#22c55e' },
  { key: 'mercadopago', label: 'MercadoPago', color: '#3b82f6' },
  { key: 'other', label: 'Otro', color: '#71717a' },
];

export function MetodosPagoDonut({ byPayment, total }: MetodosPagoDonutProps) {
  const rows = META.filter((m) => byPayment[m.key].count > 0).map((m) => ({
    ...m,
    amount: byPayment[m.key].total,
    count: byPayment[m.key].count,
    pct: total > 0 ? (byPayment[m.key].total / total) * 100 : 0,
  }));

  if (rows.length === 0 || total === 0) {
    return (
      <div className="text-center py-8 rounded-2xl border border-dashed border-white/10">
        <p className="text-sm text-[#a1a1aa]">Sin pagos en este período</p>
      </div>
    );
  }

  // Construir el conic-gradient acumulando porcentajes.
  let acc = 0;
  const stops = rows
    .map((r) => {
      const start = acc;
      acc += r.pct;
      return `${r.color} ${start}% ${acc}%`;
    })
    .join(', ');

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 flex flex-col items-center gap-5">
      {/* Donut */}
      <div className="relative w-40 h-40">
        <div className="w-full h-full rounded-full" style={{ background: `conic-gradient(${stops})` }} />
        {/* Agujero central */}
        <div className="absolute inset-[18%] rounded-full bg-[#0f0f0f] flex flex-col items-center justify-center">
          <span className="text-[10px] text-[#a1a1aa]">Recaudado</span>
          <span className="text-lg font-semibold text-white tabular-nums">{formatPrice(total)}</span>
        </div>
      </div>

      {/* Leyenda */}
      <div className="w-full space-y-2.5">
        {rows.map((r) => (
          <div key={r.key} className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: r.color }} />
            <span className="text-sm text-white flex-1">{r.label}</span>
            <span className="text-sm text-[#a1a1aa] tabular-nums">{Math.round(r.pct)}%</span>
            <span className="text-sm font-medium text-white tabular-nums w-20 text-right">{formatPrice(r.amount)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
