import { motion } from 'framer-motion';
import { Trophy, TrendingUp } from 'lucide-react';
import { formatPrice } from '@/shared/lib/utils';
import type { BarberRanking } from '../hooks/useBarberRanking';

const ORDINAL = ['', '1º', '2º', '3º', '4º', '5º', '6º', '7º', '8º', '9º', '10º'];

/** Color del puesto: oro / plata / bronce para el podio. */
function podiumColor(rank: number): string {
  if (rank === 1) return '#C9A84C';
  if (rank === 2) return '#C0C7D0';
  if (rank === 3) return '#CD8B5B';
  return '#71717a';
}

export function BarberRankCard({ ranking }: { ranking: BarberRanking }) {
  const { rank, totalBarbers, toNext } = ranking;

  if (rank === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
          <Trophy className="w-5 h-5 text-[#71717a]" />
        </div>
        <div>
          <p className="text-sm font-medium text-white">Tu puesto esta semana</p>
          <p className="text-xs text-[#a1a1aa]">Registrá tu primer corte para entrar al ranking</p>
        </div>
      </div>
    );
  }

  const color = podiumColor(rank);
  const isLeader = rank === 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="rounded-2xl border p-4 flex items-center gap-3"
      style={{ borderColor: `${color}55`, background: `linear-gradient(135deg, ${color}1f, ${color}05)` }}
    >
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 font-display text-xl font-semibold text-[#0a0a0a]"
        style={{ backgroundColor: color }}
      >
        {ORDINAL[rank] ?? `${rank}º`}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] uppercase tracking-[0.18em] font-medium" style={{ color }}>
          Tu puesto esta semana
        </p>
        <p className="text-lg font-semibold text-white leading-tight">
          Vas {ORDINAL[rank] ?? `${rank}º`} de {totalBarbers}
        </p>
        <p className="text-xs text-[#a1a1aa] mt-0.5 flex items-center gap-1">
          {isLeader ? (
            <>
              <Trophy className="w-3.5 h-3.5" style={{ color }} /> ¡Estás liderando! 🔥
            </>
          ) : (
            <>
              <TrendingUp className="w-3.5 h-3.5" /> Te faltan{' '}
              <span className="text-white font-medium tabular-nums">{formatPrice(toNext)}</span> para subir
            </>
          )}
        </p>
      </div>
    </motion.div>
  );
}
