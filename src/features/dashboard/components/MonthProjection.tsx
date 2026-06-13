import { startOfMonth, endOfMonth, startOfDay, eachDayOfInterval, isAfter, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { TrendingUp } from 'lucide-react';
import { formatPrice } from '@/shared/lib/utils';

interface MonthProjectionProps {
  /** Cortes del período (últimos 30 días) — alcanza para cubrir el mes en curso. */
  cuts: { performed_at: string; price: number | string }[];
}

/** Días "abiertos" en un rango (excluye domingo y lunes, que el local cierra). */
function countOpenDays(from: Date, to: Date): number {
  if (isAfter(from, to)) return 0;
  return eachDayOfInterval({ start: from, end: to }).filter((d) => {
    const dow = d.getDay();
    return dow !== 0 && dow !== 1;
  }).length;
}

/**
 * "Mes en curso": cuánto va facturado este mes calendario y proyección a fin de
 * mes según el ritmo de los días abiertos transcurridos. La parte divertida: ver
 * a dónde llega el mes si se sigue al mismo ritmo.
 */
export function MonthProjection({ cuts }: MonthProjectionProps) {
  const now = new Date();
  const today = startOfDay(now);
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const mtdTotal = cuts
    .filter((c) => !isAfter(monthStart, new Date(c.performed_at)))
    .reduce((s, c) => s + Number(c.price), 0);

  const openSoFar = countOpenDays(monthStart, today);
  const openTotal = countOpenDays(monthStart, monthEnd);
  const projection = openSoFar > 0 ? (mtdTotal / openSoFar) * openTotal : mtdTotal;
  const pct = projection > 0 ? Math.min(mtdTotal / projection, 1) : 0;

  const monthName = format(now, 'MMMM', { locale: es });

  return (
    <div className="rounded-2xl border border-[#C9A84C]/25 bg-gradient-to-br from-[#C9A84C]/[0.10] to-[#C9A84C]/[0.02] p-5">
      <div className="flex items-center gap-1.5 mb-3">
        <TrendingUp className="w-4 h-4 text-[#C9A84C]" />
        <p className="text-[11px] uppercase tracking-[0.18em] text-[#C9A84C] font-medium">
          Mes en curso · <span className="capitalize">{monthName}</span>
        </p>
      </div>

      <p className="text-3xl font-semibold text-white tabular-nums leading-none">{formatPrice(mtdTotal)}</p>
      <p className="text-xs text-[#a1a1aa] mt-1.5">facturado en lo que va del mes</p>

      {/* Barra de progreso hacia la proyección */}
      <div className="mt-4 h-2 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#E0C766] to-[#A8842F] transition-all duration-700"
          style={{ width: `${Math.round(pct * 100)}%` }}
        />
      </div>

      <div className="flex items-center justify-between mt-2.5">
        <p className="text-xs text-[#a1a1aa]">
          {openSoFar} de {openTotal} días abiertos
        </p>
        <p className="text-xs text-white">
          Proyectado <span className="text-[#C9A84C] font-semibold tabular-nums">{formatPrice(projection)}</span>
        </p>
      </div>
    </div>
  );
}
