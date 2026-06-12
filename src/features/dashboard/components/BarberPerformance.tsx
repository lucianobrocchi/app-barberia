import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, ChevronRight } from 'lucide-react';
import { formatPrice } from '@/shared/lib/utils';
import type { BarberStat } from '../hooks/usePeriodStats';

interface BarberPerformanceProps {
  barbers: BarberStat[];
  /** id del dueño: sus cortes son 100% suyos (no se le muestra comisión). */
  ownerId?: string;
}

export function BarberPerformance({ barbers, ownerId }: BarberPerformanceProps) {
  const navigate = useNavigate();

  if (barbers.length === 0) {
    return (
      <div className="text-center py-8 rounded-2xl border border-dashed border-white/10">
        <p className="text-sm text-[#a1a1aa]">Sin datos de barberos en este período</p>
      </div>
    );
  }

  const topTotal = barbers[0]?.total ?? 0;

  return (
    <div className="space-y-2.5">
      {barbers.map((b, i) => {
        // Barra relativa al barbero #1 (ranking).
        const pct = topTotal > 0 ? Math.round((b.total / topTotal) * 100) : 0;
        return (
          <motion.button
            key={b.barberId}
            whileTap={{ scale: 0.99 }}
            onClick={() => navigate(`/dashboard/barbero/${b.barberId}`)}
            className="w-full text-left rounded-2xl border border-white/10 bg-white/[0.03] p-4 hover:border-white/20 transition-colors"
          >
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-semibold shrink-0 ${
                    i === 0 ? 'bg-[#C9A84C] text-[#0a0a0a]' : 'bg-white/10 text-[#a1a1aa]'
                  }`}
                >
                  {i === 0 ? <Trophy className="w-3.5 h-3.5" /> : i + 1}
                </span>
                <span className="font-medium text-white truncate">{b.name}</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <div className="text-right">
                  <p className="font-semibold text-white tabular-nums">{formatPrice(b.total)}</p>
                  <p className="text-xs text-[#a1a1aa]">{b.count} cortes</p>
                </div>
                <ChevronRight className="w-4 h-4 text-[#a1a1aa]" />
              </div>
            </div>

            {/* Barra de proporción animada */}
            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden mb-2.5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
                className="h-full rounded-full bg-[#C9A84C]"
              />
            </div>

            {/* Ticket promedio + comisión (el dueño no cobra comisión: 100% suyo) */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#a1a1aa]">
                Ticket prom. <span className="text-white font-medium tabular-nums">{formatPrice(b.avgTicket)}</span>
              </span>
              {b.barberId === ownerId ? (
                <span className="text-[#C9A84C] font-medium">Dueño · 100% tuyo</span>
              ) : (
                <span className="text-[#a1a1aa]">
                  Le debés <span className="text-[#C9A84C] font-medium tabular-nums">{formatPrice(b.commission)}</span>
                </span>
              )}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
