import { format, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronRight } from 'lucide-react';
import { formatPrice } from '@/shared/lib/utils';
import type { DayData } from '../hooks/useBarberWeekData';

interface WeekCalendarProps {
  days: DayData[];
  selectedKey: string | null;
  onSelectDay: (key: string) => void;
}

export function WeekCalendar({ days, selectedKey, onSelectDay }: WeekCalendarProps) {
  return (
    <div className="space-y-2">
      {days.map((d) => {
        const worked = d.count > 0;
        const dow = d.date.getDay();
        const closed = dow === 0 || dow === 1; // domingo y lunes cerrado
        const today = isToday(d.date);
        const selected = d.key === selectedKey;

        const base = 'w-full flex items-center gap-3 p-3.5 rounded-2xl border transition-all text-left';
        const stateCls = selected
          ? 'border-[#C9A84C] bg-[#C9A84C]/[0.08]'
          : today
          ? 'border-[#C9A84C]/40 bg-white/[0.03]'
          : 'border-white/10 bg-white/[0.03]';
        const interactive = worked ? 'hover:border-white/25 active:scale-[0.99] cursor-pointer' : 'opacity-60 cursor-default';

        const content = (
          <>
            {/* Día */}
            <div className="w-10 text-center shrink-0">
              <p className="text-[11px] text-[#a1a1aa] capitalize leading-none">{format(d.date, 'EEE', { locale: es })}</p>
              <p className={`text-lg font-semibold leading-tight ${today ? 'text-[#C9A84C]' : 'text-white'}`}>
                {format(d.date, 'd')}
              </p>
            </div>

            {/* Estado */}
            <div className="flex-1 min-w-0">
              {worked ? (
                <>
                  <p className="text-sm font-medium text-[#C9A84C]">{d.count} corte{d.count !== 1 ? 's' : ''}</p>
                  <p className="text-xs text-[#a1a1aa] tabular-nums">{formatPrice(d.total)}</p>
                </>
              ) : closed ? (
                <p className="text-sm text-[#52525b]">Cerrado</p>
              ) : (
                <p className="text-sm text-[#71717a]">Libre</p>
              )}
            </div>

            {today && (
              <span className="text-[10px] font-medium text-[#C9A84C] bg-[#C9A84C]/10 px-2 py-0.5 rounded-full shrink-0">
                hoy
              </span>
            )}
            {worked && <ChevronRight className="w-4 h-4 text-[#a1a1aa] shrink-0" />}
          </>
        );

        if (!worked) {
          return (
            <div key={d.key} className={`${base} ${stateCls} ${interactive}`}>
              {content}
            </div>
          );
        }
        return (
          <button key={d.key} onClick={() => onSelectDay(d.key)} className={`${base} ${stateCls} ${interactive}`}>
            {content}
          </button>
        );
      })}
    </div>
  );
}
