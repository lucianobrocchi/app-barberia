import { format } from 'date-fns';
import type { TodayCut } from '../hooks/useTodayCuts';
import { formatPrice, PAYMENT_METHOD_LABELS } from '@/shared/lib/utils';

interface CutItemProps {
  cut: TodayCut;
}

export function CutItem({ cut }: CutItemProps) {
  return (
    <div className="flex items-center justify-between gap-3 p-4 rounded-2xl border border-white/10 bg-white/[0.03]">
      <div className="min-w-0">
        <p className="text-sm font-medium text-white truncate">
          {cut.service?.name ?? 'Servicio'}
        </p>
        <p className="text-xs text-[#a1a1aa] mt-0.5">
          {format(new Date(cut.performed_at), 'HH:mm')}
          {' · '}
          {PAYMENT_METHOD_LABELS[cut.payment_method]}
        </p>
      </div>
      <span className="font-semibold text-white shrink-0 tabular-nums">
        {formatPrice(Number(cut.price))}
      </span>
    </div>
  );
}
