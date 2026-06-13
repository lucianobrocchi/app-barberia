import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Flame, Crown, CalendarRange, Scissors } from 'lucide-react';
import { formatPrice } from '@/shared/lib/utils';
import type { Records } from '../hooks/useRecords';

interface RecordsPanelProps {
  records: Records;
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function RecordsPanel({ records }: RecordsPanelProps) {
  const { bestDay, bestWeek, recordCutsDay, currentStreak, bestStreak } = records;

  const items = [
    {
      icon: Crown,
      label: 'Mejor día',
      value: bestDay ? formatPrice(bestDay.total) : '—',
      sub: bestDay ? capitalize(format(bestDay.date, "EEE d 'de' MMM", { locale: es })) : '',
    },
    {
      icon: CalendarRange,
      label: 'Mejor semana',
      value: bestWeek ? formatPrice(bestWeek.total) : '—',
      sub: bestWeek ? `Semana del ${format(bestWeek.start, 'd/M', { locale: es })}` : '',
    },
    {
      icon: Scissors,
      label: 'Más cortes en un día',
      value: recordCutsDay ? String(recordCutsDay.count) : '—',
      sub: recordCutsDay ? capitalize(format(recordCutsDay.date, "EEE d 'de' MMM", { locale: es })) : '',
    },
  ];

  return (
    <div className="space-y-3">
      {/* Racha actual (hero) */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="rounded-2xl border border-orange-400/25 bg-gradient-to-br from-orange-500/[0.12] to-orange-500/[0.02] p-5"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/15 flex items-center justify-center shrink-0">
            <Flame className="w-6 h-6 text-orange-400" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.18em] text-orange-300/90 font-medium">Racha actual</p>
            <p className="text-2xl font-semibold text-white leading-tight">
              {currentStreak} {currentStreak === 1 ? 'día' : 'días'} seguidos
            </p>
            <p className="text-xs text-[#a1a1aa] mt-0.5">
              {currentStreak > 0 ? 'con ventas, sin parar' : 'Empezá una racha hoy'}
              {bestStreak > 0 && (
                <>
                  {' · '}récord <span className="text-orange-300 font-medium">{bestStreak}</span>
                </>
              )}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Récords */}
      <div className="grid grid-cols-3 gap-2.5">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <div
              key={it.label}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 flex flex-col items-center text-center"
            >
              <Icon className="w-4 h-4 text-[#C9A84C] mb-1.5" />
              <p className="text-[10px] uppercase tracking-wide text-[#71717a] leading-tight">{it.label}</p>
              <p className="text-sm font-semibold text-white tabular-nums mt-1">{it.value}</p>
              {it.sub && <p className="text-[10px] text-[#a1a1aa] capitalize leading-tight mt-0.5">{it.sub}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
