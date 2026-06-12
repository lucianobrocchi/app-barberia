import { Banknote, ArrowRightLeft, Smartphone, MoreHorizontal } from 'lucide-react';
import { formatPrice } from '@/shared/lib/utils';
import type { CierreResumen } from '../cierreTypes';
import type { PaymentMethod } from '@/shared/types';

interface Props {
  porMetodo: CierreResumen['desglose_por_metodo'];
  total: number;
}

const ROWS: { key: PaymentMethod; label: string; icon: typeof Banknote }[] = [
  { key: 'cash', label: 'Efectivo', icon: Banknote },
  { key: 'transfer', label: 'Transferencia', icon: ArrowRightLeft },
  { key: 'mercadopago', label: 'MercadoPago', icon: Smartphone },
  { key: 'other', label: 'Otro', icon: MoreHorizontal },
];

export function DesglosePorMetodo({ porMetodo, total }: Props) {
  // Mostramos Efectivo y Transferencia siempre; los demás solo si tienen datos.
  const rows = ROWS.filter(
    (r) => r.key === 'cash' || r.key === 'transfer' || (porMetodo[r.key]?.cortes ?? 0) > 0
  );

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] divide-y divide-white/5">
      {rows.map(({ key, label, icon: Icon }) => {
        const stat = porMetodo[key] ?? { cortes: 0, monto: 0 };
        const pct = total > 0 ? Math.round((stat.monto / total) * 100) : 0;
        return (
          <div key={key} className="flex items-center gap-3 p-4">
            <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
              <Icon className="w-4.5 h-4.5 text-[#C9A84C]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-white">{label}</span>
                <span className="text-sm font-semibold text-white tabular-nums">
                  {formatPrice(stat.monto)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 mt-0.5">
                <span className="text-xs text-[#a1a1aa]">{stat.cortes} cortes</span>
                <span className="text-xs text-[#a1a1aa]">{pct}%</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
