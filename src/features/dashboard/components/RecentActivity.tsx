import { format } from 'date-fns';
import { Scissors } from 'lucide-react';
import { formatPrice, PAYMENT_METHOD_LABELS } from '@/shared/lib/utils';
import type { DashboardCut } from '../hooks/usePeriodStats';

interface RecentActivityProps {
  cuts: DashboardCut[];
  limit?: number;
}

export function RecentActivity({ cuts, limit = 10 }: RecentActivityProps) {
  const items = cuts.slice(0, limit);

  if (items.length === 0) {
    return (
      <div className="text-center py-8 rounded-2xl border border-dashed border-white/10">
        <Scissors className="w-6 h-6 text-[#a1a1aa] mx-auto mb-2" />
        <p className="text-sm text-[#a1a1aa]">Sin cortes en este período</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((cut) => (
        <div
          key={cut.id}
          className="flex items-center justify-between gap-3 p-4 rounded-2xl border border-white/10 bg-white/[0.03]"
        >
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {cut.service?.name ?? 'Servicio'}
              {cut.barber?.full_name && (
                <span className="text-[#a1a1aa] font-normal"> · {cut.barber.full_name}</span>
              )}
            </p>
            <p className="text-xs text-[#a1a1aa] mt-0.5">
              {format(new Date(cut.performed_at), 'dd/MM HH:mm')}
              {' · '}
              {PAYMENT_METHOD_LABELS[cut.payment_method]}
            </p>
          </div>
          <span className="font-semibold text-white shrink-0 tabular-nums">
            {formatPrice(Number(cut.price))}
          </span>
        </div>
      ))}
    </div>
  );
}
