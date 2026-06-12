import { format } from 'date-fns';
import { Banknote, ArrowRightLeft, Smartphone, MoreHorizontal } from 'lucide-react';
import { formatPrice } from '@/shared/lib/utils';
import type { PaymentMethod } from '@/shared/types';
import type { DayCut } from '../hooks/useBarberWeekData';

const PAYMENT_ICON: Record<PaymentMethod, typeof Banknote> = {
  cash: Banknote,
  transfer: ArrowRightLeft,
  mercadopago: Smartphone,
  other: MoreHorizontal,
};

export function CutItemRow({ cut }: { cut: DayCut }) {
  const Icon = PAYMENT_ICON[cut.payment_method];
  return (
    <div className="flex items-center gap-3 p-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-white truncate">{cut.serviceName}</p>
        <p className="text-xs text-[#a1a1aa] mt-0.5">{format(new Date(cut.performed_at), 'HH:mm')} hs</p>
      </div>
      <span className="text-sm font-semibold text-white tabular-nums shrink-0">{formatPrice(cut.price)}</span>
      <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-[#C9A84C]" />
      </div>
    </div>
  );
}
