import { motion } from 'framer-motion';
import type { Period } from '../hooks/usePeriodStats';

interface PeriodSelectorProps {
  value: Period;
  onChange: (period: Period) => void;
}

const OPTIONS: { value: Period; label: string }[] = [
  { value: 'today', label: 'Hoy' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mes' },
];

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  return (
    <div className="flex p-1 rounded-2xl bg-white/[0.04] border border-white/10">
      {OPTIONS.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className="relative flex-1 py-2 text-sm font-medium rounded-xl transition-colors"
          >
            {active && (
              <motion.div
                layoutId="period-pill"
                className="absolute inset-0 bg-[#C9A84C] rounded-xl"
                transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              />
            )}
            <span className={`relative z-10 ${active ? 'text-[#0a0a0a]' : 'text-[#a1a1aa]'}`}>
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
