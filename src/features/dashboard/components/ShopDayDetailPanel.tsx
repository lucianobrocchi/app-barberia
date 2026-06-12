import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarDays, Banknote, ArrowRightLeft, Users } from 'lucide-react';
import { formatPrice } from '@/shared/lib/utils';
import { DEMO_USERS, initials } from '@/features/auth/data/demoUsers';
import type { ShopDayData } from '../hooks/useShopWeekData';

function colorForName(name: string): string {
  return DEMO_USERS.find((u) => u.name === name)?.color ?? '#C9A84C';
}

export function ShopDayDetailPanel({ day }: { day: ShopDayData }) {
  const raw = format(day.date, "EEEE d 'de' MMMM", { locale: es });
  const title = raw.charAt(0).toUpperCase() + raw.slice(1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.22 }}
      className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-4"
    >
      <div className="flex items-center gap-2">
        <CalendarDays className="w-4 h-4 text-[#C9A84C]" />
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>

      {/* Resumen del día */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="rounded-xl bg-white/[0.03] border border-white/10 p-3">
          <p className="text-xs text-[#a1a1aa]">Facturado</p>
          <p className="text-lg font-semibold text-[#C9A84C] tabular-nums">{formatPrice(day.total)}</p>
        </div>
        <div className="rounded-xl bg-white/[0.03] border border-white/10 p-3">
          <p className="text-xs text-[#a1a1aa]">Cortes</p>
          <p className="text-lg font-semibold text-white tabular-nums">{day.count}</p>
        </div>
      </div>

      {/* Métodos de pago */}
      <div className="flex items-center gap-4 text-sm">
        <span className="flex items-center gap-1.5 text-[#a1a1aa]">
          <Banknote className="w-4 h-4" /> Efectivo <span className="text-white font-medium tabular-nums">{formatPrice(day.byPayment.cash)}</span>
        </span>
        <span className="flex items-center gap-1.5 text-[#a1a1aa]">
          <ArrowRightLeft className="w-4 h-4" /> Transf. <span className="text-white font-medium tabular-nums">{formatPrice(day.byPayment.transfer)}</span>
        </span>
      </div>

      {/* Por barbero */}
      <div>
        <p className="text-xs text-[#a1a1aa] mb-2 flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Por barbero</p>
        <div className="rounded-xl border border-white/10 divide-y divide-white/5">
          {day.byBarber.map((b) => (
            <div key={b.id} className="flex items-center gap-3 p-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 text-white" style={{ backgroundColor: colorForName(b.name) }}>
                {initials(b.name)}
              </div>
              <span className="text-sm text-white flex-1 truncate">{b.name}</span>
              <span className="text-xs text-[#a1a1aa]">{b.count} cortes</span>
              <span className="text-sm font-medium text-white tabular-nums w-20 text-right">{formatPrice(b.total)}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
