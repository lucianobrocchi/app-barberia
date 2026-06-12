import { Banknote, ArrowRightLeft } from 'lucide-react';
import type { PaymentMethod } from '@/shared/types';

interface StepPaymentProps {
  selected: PaymentMethod | null;
  onSelect: (method: PaymentMethod) => void;
}

export const PAYMENT_OPTIONS: {
  value: PaymentMethod;
  label: string;
  icon: typeof Banknote;
}[] = [
  { value: 'cash', label: 'Efectivo', icon: Banknote },
  { value: 'transfer', label: 'Transferencia', icon: ArrowRightLeft },
];

export function StepPayment({ selected, onSelect }: StepPaymentProps) {
  return (
    <div className="space-y-3">
      {PAYMENT_OPTIONS.map(({ value, label, icon: Icon }) => {
        const isSelected = value === selected;
        return (
          <button
            key={value}
            onClick={() => onSelect(value)}
            className={`w-full min-h-[88px] flex items-center gap-4 px-5 rounded-2xl border active:scale-95 transition-all ${
              isSelected
                ? 'border-[#C9A84C] bg-[#C9A84C]/10'
                : 'border-white/10 bg-white/[0.03] hover:border-white/20'
            }`}
          >
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                isSelected ? 'bg-[#C9A84C]' : 'bg-white/5'
              }`}
            >
              <Icon className={`w-7 h-7 ${isSelected ? 'text-[#0a0a0a]' : 'text-[#C9A84C]'}`} />
            </div>
            <span className="text-lg font-semibold text-white">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
