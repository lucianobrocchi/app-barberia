import { motion } from 'framer-motion';

interface HoraPicoChartProps {
  cuts: { performed_at: string }[];
  /** Horario que se muestra (inclusive). */
  fromHour?: number;
  toHour?: number;
}

/**
 * Distribución de cortes por hora del día (barras verticales en SVG/CSS).
 * La barra más alta (hora pico) se resalta en dorado.
 */
export function HoraPicoChart({ cuts, fromHour = 8, toHour = 21 }: HoraPicoChartProps) {
  const hours = Array.from({ length: toHour - fromHour + 1 }, (_, i) => fromHour + i);
  const counts = hours.map((h) => cuts.filter((c) => new Date(c.performed_at).getHours() === h).length);
  const max = Math.max(...counts, 1);
  const peak = Math.max(...counts);
  const hasData = peak > 0;

  if (!hasData) {
    return (
      <div className="text-center py-8 rounded-2xl border border-dashed border-white/10">
        <p className="text-sm text-[#a1a1aa]">Sin cortes para mostrar hora pico</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-end justify-between gap-1 h-28">
        {hours.map((h, i) => {
          const isPeak = counts[i] === peak && counts[i] > 0;
          const heightPct = (counts[i] / max) * 100;
          return (
            <div key={h} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
              {counts[i] > 0 && (
                <span className={`text-[10px] tabular-nums ${isPeak ? 'text-[#C9A84C] font-semibold' : 'text-[#a1a1aa]'}`}>
                  {counts[i]}
                </span>
              )}
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(heightPct, counts[i] > 0 ? 6 : 0)}%` }}
                transition={{ duration: 0.6, ease: 'easeOut', delay: i * 0.02 }}
                className={`w-full rounded-t-md ${isPeak ? 'bg-[#C9A84C]' : 'bg-white/15'}`}
              />
            </div>
          );
        })}
      </div>
      {/* Etiquetas de hora (cada 3 para no saturar) */}
      <div className="flex items-center justify-between gap-1 mt-2">
        {hours.map((h) => (
          <div key={h} className="flex-1 text-center">
            <span className="text-[9px] text-[#a1a1aa] tabular-nums">{(h - fromHour) % 3 === 0 ? `${h}h` : ''}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
