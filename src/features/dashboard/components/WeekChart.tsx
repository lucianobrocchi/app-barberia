import { motion } from 'framer-motion';
import { format, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatPrice } from '@/shared/lib/utils';
import type { DayData } from '../hooks/useBarberWeekData';

interface WeekChartProps {
  days: DayData[];
  selectedKey: string | null;
  onSelectDay: (key: string) => void;
}

/**
 * Vista "gráfico" de la semana: una barra por día (altura = cortes del día).
 * El día con más cortes va en dorado; el día seleccionado se resalta. Los días
 * trabajados son tappables → abren el detalle. Días "Libre" sin barra.
 */
export function WeekChart({ days, selectedKey, onSelectDay }: WeekChartProps) {
  const maxCount = Math.max(...days.map((d) => d.count), 1);
  const peak = Math.max(...days.map((d) => d.count));

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-end justify-between gap-1.5">
        {days.map((d, i) => {
          const worked = d.count > 0;
          const dow = d.date.getDay();
          const closed = dow === 0 || dow === 1; // domingo y lunes cerrado
          const today = isToday(d.date);
          const selected = d.key === selectedKey;
          const isPeak = worked && d.count === peak;
          const heightPct = worked ? Math.max((d.count / maxCount) * 100, 8) : 0;

          const barColor = selected
            ? 'bg-[#C9A84C]'
            : isPeak
            ? 'bg-[#C9A84C]/80'
            : worked
            ? 'bg-white/20'
            : 'bg-transparent';

          const Col = (
            <>
              {/* Cantidad de cortes arriba */}
              <span
                className={`text-[11px] tabular-nums h-4 ${
                  selected ? 'text-[#C9A84C] font-semibold' : worked ? 'text-[#a1a1aa]' : 'text-transparent'
                }`}
              >
                {worked ? d.count : '·'}
              </span>

              {/* Zona de la barra */}
              <div className="w-full h-24 flex items-end justify-center">
                {worked ? (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${heightPct}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut', delay: i * 0.03 }}
                    className={`w-2/3 rounded-t-md ${barColor}`}
                  />
                ) : (
                  <div className="w-2/3 border-b border-dashed border-white/10" />
                )}
              </div>

              {/* Día */}
              <div className="text-center leading-tight">
                <p className={`text-[10px] capitalize ${closed ? 'text-[#52525b]' : 'text-[#a1a1aa]'}`}>{format(d.date, 'EEE', { locale: es })}</p>
                <p className={`text-xs font-semibold ${today ? 'text-[#C9A84C]' : closed ? 'text-[#52525b]' : 'text-white'}`}>{format(d.date, 'd')}</p>
              </div>
            </>
          );

          return worked ? (
            <button
              key={d.key}
              onClick={() => onSelectDay(d.key)}
              className="flex-1 flex flex-col items-center gap-1.5 rounded-lg pt-1 pb-1.5 hover:bg-white/[0.03] active:scale-95 transition-all"
            >
              {Col}
            </button>
          ) : (
            <div key={d.key} className="flex-1 flex flex-col items-center gap-1.5 pt-1 pb-1.5 opacity-60">
              {Col}
            </div>
          );
        })}
      </div>

      {/* Total de la semana */}
      <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
        <span className="text-[#a1a1aa]">Total semana</span>
        <span className="text-white font-medium tabular-nums">
          {days.reduce((s, d) => s + d.count, 0)} cortes · {formatPrice(days.reduce((s, d) => s + d.total, 0))}
        </span>
      </div>
    </div>
  );
}
