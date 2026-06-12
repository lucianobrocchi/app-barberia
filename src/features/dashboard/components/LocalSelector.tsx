import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import type { LocalDef, LocalValue } from '../config/locales';

interface LocalSelectorProps {
  locales: LocalDef[];
  value: LocalValue;
  onChange: (v: LocalValue) => void;
}

/**
 * Selector de local (tabs). Con un solo local muestra ese chip; cuando haya
 * más de uno aparece automáticamente la opción "Ambos locales".
 */
export function LocalSelector({ locales, value, onChange }: LocalSelectorProps) {
  const tabs: { value: LocalValue; label: string }[] =
    locales.length > 1
      ? [{ value: 'all', label: 'Ambos' }, ...locales.map((l) => ({ value: l.barbershopId, label: l.corto }))]
      : locales.map((l) => ({ value: l.barbershopId, label: l.nombre }));

  return (
    <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/[0.04] border border-white/10">
      {tabs.map((t) => {
        const active = value === t.value;
        return (
          <button
            key={t.value}
            onClick={() => onChange(t.value)}
            className={`relative flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
              active ? 'text-[#0a0a0a]' : 'text-[#a1a1aa] hover:text-white'
            }`}
          >
            {active && (
              <motion.div
                layoutId="local-tab"
                className="absolute inset-0 rounded-xl bg-[#C9A84C]"
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              />
            )}
            <span className="relative flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              {t.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
