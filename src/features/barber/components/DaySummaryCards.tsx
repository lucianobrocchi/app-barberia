import { Scissors, Wallet } from 'lucide-react';
import { formatPrice } from '@/shared/lib/utils';

interface DaySummaryCardsProps {
  count: number;
  total: number;
}

export function DaySummaryCards({ count, total }: DaySummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center gap-2 text-[#a1a1aa] mb-2">
          <Scissors className="w-4 h-4" />
          <span className="text-xs">Cortes hoy</span>
        </div>
        <p className="text-3xl font-semibold text-white tabular-nums">{count}</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center gap-2 text-[#a1a1aa] mb-2">
          <Wallet className="w-4 h-4" />
          <span className="text-xs">Recaudado</span>
        </div>
        <p className="text-3xl font-semibold text-[#C9A84C] tabular-nums">
          {formatPrice(total)}
        </p>
      </div>
    </div>
  );
}
