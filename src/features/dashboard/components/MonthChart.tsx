import { motion } from 'framer-motion';
import { subDays, startOfDay, eachDayOfInterval, format, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatPrice } from '@/shared/lib/utils';

interface MonthChartProps {
  /** Cortes del período (últimos 30 días). */
  cuts: { performed_at: string; price: number | string }[];
}

interface DayPoint {
  date: Date;
  total: number;
  count: number;
}

/**
 * Facturación día por día de los últimos 30 días (una barra fina por día).
 * El mejor día va en dorado. Días cerrados (dom/lun) quedan tenues.
 */
export function MonthChart({ cuts }: MonthChartProps) {
  const today = startOfDay(new Date());
  const days: DayPoint[] = eachDayOfInterval({ start: subDays(today, 29), end: today }).map((date) => ({
    date,
    total: 0,
    count: 0,
  }));

  for (const c of cuts) {
    const d = startOfDay(new Date(c.performed_at));
    const point = days.find((p) => isSameDay(p.date, d));
    if (point) {
      point.total += Number(c.price);
      point.count += 1;
    }
  }

  const maxTotal = Math.max(...days.map((d) => d.total), 1);
  const peakTotal = Math.max(...days.map((d) => d.total));
  const bestDay = days.find((d) => d.total === peakTotal && d.total > 0) ?? null;
  const openDays = days.filter((d) => d.count > 0).length;
  const total = days.reduce((s, d) => s + d.total, 0);
  const avgPerOpenDay = openDays > 0 ? total / openDays : 0;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      {/* Barras */}
      <div className="flex items-end justify-between gap-px h-32">
        {days.map((d, i) => {
          const dow = d.date.getDay();
          const closed = dow === 0 || dow === 1;
          const worked = d.total > 0;
          const isBest = bestDay !== null && isSameDay(d.date, bestDay.date);
          const heightPct = worked ? Math.max((d.total / maxTotal) * 100, 4) : 0;
          const color = isBest ? 'bg-[#C9A84C]' : worked ? 'bg-white/20' : 'bg-transparent';
          return (
            <div key={i} className="flex-1 h-full flex items-end justify-center">
              {worked ? (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${heightPct}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut', delay: i * 0.012 }}
                  className={`w-full rounded-t-[3px] ${color}`}
                  title={`${format(d.date, "EEE d 'de' MMM", { locale: es })} · ${formatPrice(d.total)}`}
                />
              ) : (
                <div className={`w-full ${closed ? '' : 'border-b border-dashed border-white/10'}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Ticks de fecha (cada ~7 días) */}
      <div className="flex items-center justify-between gap-px mt-2">
        {days.map((d, i) => (
          <div key={i} className="flex-1 text-center">
            <span className="text-[9px] text-[#71717a] tabular-nums">
              {i % 7 === 0 ? format(d.date, 'd/M') : ''}
            </span>
          </div>
        ))}
      </div>

      {/* Resumen */}
      <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-[#71717a]">Total 30 días</p>
          <p className="text-sm font-semibold text-white tabular-nums mt-0.5">{formatPrice(total)}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-[#71717a]">Prom. por día</p>
          <p className="text-sm font-semibold text-white tabular-nums mt-0.5">{formatPrice(avgPerOpenDay)}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-[#71717a]">Mejor día</p>
          <p className="text-sm font-semibold text-[#C9A84C] tabular-nums mt-0.5">
            {bestDay ? formatPrice(bestDay.total) : '—'}
          </p>
          {bestDay && (
            <p className="text-[10px] text-[#a1a1aa] capitalize leading-tight">
              {format(bestDay.date, 'EEE d', { locale: es })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
