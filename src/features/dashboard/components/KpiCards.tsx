import { Wallet, Receipt, Scissors, Users, TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';
import { formatPrice } from '@/shared/lib/utils';
import { AnimatedNumber } from './AnimatedNumber';
import type { Period, PeriodDelta } from '../hooks/usePeriodStats';

interface KpiCardsProps {
  ganancia: number;
  total: number;
  count: number;
  barbersActive: number;
  barbersTotal: number;
  prevDelta: PeriodDelta;
  period: Period;
}

const DELTA_LABEL: Record<Period, string> = {
  today: 'vs ayer',
  week: 'vs sem. pasada',
  month: 'vs mes pasado',
};

function pctChange(current: number, prev: number): number | null {
  if (prev === 0) return current === 0 ? 0 : null;
  return ((current - prev) / prev) * 100;
}

function Delta({ current, prev, period, withLabel = true }: { current: number; prev: number; period: Period; withLabel?: boolean }) {
  const pct = pctChange(current, prev);
  const label = withLabel ? ` ${DELTA_LABEL[period]}` : '';
  if (pct === null) {
    return <span className="text-xs text-green-400 flex items-center gap-1"><TrendingUp className="w-3 h-3" />nuevo</span>;
  }
  if (Math.abs(pct) < 0.5) {
    return <span className="text-xs text-[#a1a1aa] flex items-center gap-1"><Minus className="w-3 h-3" />igual{label}</span>;
  }
  const up = pct > 0;
  return (
    <span className={`text-xs flex items-center gap-1 ${up ? 'text-green-400' : 'text-red-400'}`}>
      {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {up ? '+' : ''}{Math.round(pct)}%{label}
    </span>
  );
}

export function KpiCards({ ganancia, total, count, barbersActive, barbersTotal, prevDelta, period }: KpiCardsProps) {
  const hayInactivos = barbersTotal > 0 && barbersActive < barbersTotal;

  return (
    <div className="space-y-3">
      {/* HERO — Tu ganancia */}
      <div className="relative overflow-hidden rounded-3xl border border-[#C9A84C]/40 bg-gradient-to-br from-[#C9A84C]/[0.20] via-[#C9A84C]/[0.07] to-transparent p-5 shadow-xl shadow-[#C9A84C]/10">
        {/* Glow decorativo */}
        <div className="pointer-events-none absolute -top-10 -right-10 w-40 h-40 rounded-full bg-[#C9A84C]/20 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2 text-[#C9A84C] mb-1.5">
            <Wallet className="w-4.5 h-4.5" />
            <span className="text-sm font-medium tracking-wide">Tu ganancia</span>
          </div>
          <AnimatedNumber
            value={ganancia}
            format={formatPrice}
            className="block text-5xl font-bold text-[#C9A84C] tabular-nums tracking-tight leading-none"
          />
          <div className="mt-3">
            <Delta current={ganancia} prev={prevDelta.ganancia} period={period} />
          </div>
        </div>
      </div>

      {/* Facturado + Cortes */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center gap-2 text-[#a1a1aa] mb-2">
            <Receipt className="w-4 h-4" /><span className="text-xs">Facturado</span>
          </div>
          <AnimatedNumber value={total} format={formatPrice} className="block text-2xl font-semibold text-white tabular-nums" />
          <div className="mt-1.5"><Delta current={total} prev={prevDelta.total} period={period} withLabel={false} /></div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center gap-2 text-[#a1a1aa] mb-2">
            <Scissors className="w-4 h-4" /><span className="text-xs">Cortes</span>
          </div>
          <AnimatedNumber value={count} className="block text-2xl font-semibold text-white tabular-nums" />
          <div className="mt-1.5"><Delta current={count} prev={prevDelta.count} period={period} withLabel={false} /></div>
        </div>
      </div>

      {/* Barberos activos — barra slim */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[#a1a1aa]">
          <Users className="w-4 h-4" /><span className="text-xs">Barberos activos</span>
        </div>
        <div className="flex items-center gap-2">
          {hayInactivos && (
            <span className="text-xs text-red-400 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />{barbersTotal - barbersActive} inactivo{barbersTotal - barbersActive > 1 ? 's' : ''}
            </span>
          )}
          <span className={`text-lg font-semibold tabular-nums ${hayInactivos ? 'text-red-400' : 'text-white'}`}>
            {barbersActive} <span className="text-sm text-[#a1a1aa]">/ {barbersTotal}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
