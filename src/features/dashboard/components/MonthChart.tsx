import { useState } from 'react';
import { motion } from 'framer-motion';
import { subDays, startOfDay, eachDayOfInterval, format, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatPrice } from '@/shared/lib/utils';
import type { PaymentMethod } from '@/shared/types';
import { ShopDayDetailPanel } from './ShopDayDetailPanel';
import type { ShopDayData, DayBarberStat } from '../hooks/useShopWeekData';

interface MonthCut {
  performed_at: string;
  price: number | string;
  payment_method: PaymentMethod;
  barber: { id: string; full_name: string } | null;
  barber_id: string;
}

interface MonthChartProps {
  /** Cortes del período (últimos 30 días). */
  cuts: MonthCut[];
}

interface DayPoint {
  date: Date;
  key: string;
  total: number;
  count: number;
}

function emptyByPayment(): Record<PaymentMethod, number> {
  return { cash: 0, transfer: 0, mercadopago: 0, other: 0 };
}

/** Arma el detalle (formato de la semana) de un día puntual desde los cortes. */
function buildDayDetail(date: Date, cuts: MonthCut[]): ShopDayData {
  const dayCuts = cuts.filter((c) => isSameDay(new Date(c.performed_at), date));
  const byPayment = emptyByPayment();
  const barberMap = new Map<string, DayBarberStat>();
  let total = 0;
  for (const c of dayCuts) {
    const price = Number(c.price);
    total += price;
    byPayment[c.payment_method] += price;
    const id = c.barber?.id ?? c.barber_id;
    const name = c.barber?.full_name ?? 'Sin nombre';
    const cur = barberMap.get(id) ?? { id, name, count: 0, total: 0 };
    cur.count += 1;
    cur.total += price;
    barberMap.set(id, cur);
  }
  return {
    date,
    key: format(date, 'yyyy-MM-dd'),
    count: dayCuts.length,
    total,
    byPayment,
    cuts: [],
    byBarber: [...barberMap.values()].sort((a, b) => b.total - a.total),
  };
}

/**
 * Facturación día por día de los últimos 30 días (una barra fina por día).
 * El mejor día va en dorado. Tocá un día para ver el detalle (mismo panel que
 * la vista de la semana). Días cerrados (dom/lun) quedan tenues.
 */
export function MonthChart({ cuts }: MonthChartProps) {
  const today = startOfDay(new Date());
  const days: DayPoint[] = eachDayOfInterval({ start: subDays(today, 29), end: today }).map((date) => ({
    date,
    key: format(date, 'yyyy-MM-dd'),
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

  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const selectedPoint = days.find((d) => d.key === selectedKey && d.count > 0) ?? null;
  const selectedDetail = selectedPoint ? buildDayDetail(selectedPoint.date, cuts) : null;

  function toggleDay(key: string) {
    setSelectedKey((cur) => (cur === key ? null : key));
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        {/* Barras */}
        <div className="flex items-end justify-between gap-px h-32">
          {days.map((d, i) => {
            const dow = d.date.getDay();
            const closed = dow === 0 || dow === 1;
            const worked = d.total > 0;
            const isSelected = d.key === selectedKey;
            const isBest = bestDay !== null && isSameDay(d.date, bestDay.date);
            const heightPct = worked ? Math.max((d.total / maxTotal) * 100, 4) : 0;
            const color = isSelected
              ? 'bg-[#E0C766]'
              : isBest
              ? 'bg-[#C9A84C]'
              : worked
              ? 'bg-white/20'
              : 'bg-transparent';

            const inner = worked ? (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${heightPct}%` }}
                transition={{ duration: 0.5, ease: 'easeOut', delay: i * 0.012 }}
                className={`w-full rounded-t-[3px] ${color} ${isSelected ? 'ring-1 ring-[#E0C766]' : ''}`}
              />
            ) : (
              <div className={`w-full ${closed ? '' : 'border-b border-dashed border-white/10'}`} />
            );

            return worked ? (
              <button
                key={d.key}
                onClick={() => toggleDay(d.key)}
                aria-label={`${format(d.date, "d 'de' MMMM", { locale: es })}: ${formatPrice(d.total)}`}
                className="flex-1 h-full flex items-end justify-center hover:bg-white/[0.04] rounded-t transition-colors"
              >
                {inner}
              </button>
            ) : (
              <div key={d.key} className="flex-1 h-full flex items-end justify-center">
                {inner}
              </div>
            );
          })}
        </div>

        {/* Ticks de fecha (cada ~7 días) */}
        <div className="flex items-center justify-between gap-px mt-2">
          {days.map((d, i) => (
            <div key={d.key} className="flex-1 text-center">
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

        {!selectedDetail && (
          <p className="text-center text-[11px] text-[#71717a] mt-3">Tocá un día para ver el detalle</p>
        )}
      </div>

      {/* Detalle del día seleccionado (re-monta por key → re-anima, sin AnimatePresence) */}
      {selectedDetail && <ShopDayDetailPanel key={selectedDetail.key} day={selectedDetail} />}
    </div>
  );
}
