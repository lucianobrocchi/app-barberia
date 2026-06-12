import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarDays, Banknote, ArrowRightLeft, Smartphone, MoreHorizontal } from 'lucide-react';
import { formatPrice } from '@/shared/lib/utils';
import type { PaymentMethod } from '@/shared/types';
import type { DayData } from '../hooks/useBarberWeekData';
import { CutItemRow } from './CutItemRow';

const PAYMENT_META: { key: PaymentMethod; label: string; icon: typeof Banknote }[] = [
  { key: 'cash', label: 'Efectivo', icon: Banknote },
  { key: 'transfer', label: 'Transferencia', icon: ArrowRightLeft },
  { key: 'mercadopago', label: 'MercadoPago', icon: Smartphone },
  { key: 'other', label: 'Otro', icon: MoreHorizontal },
];

export function DayDetailPanel({ day }: { day: DayData }) {
  const raw = format(day.date, "EEEE d 'de' MMMM", { locale: es }); // "miércoles 3 de junio"
  const title = raw.charAt(0).toUpperCase() + raw.slice(1);
  const methods = PAYMENT_META.filter((m) => day.byPayment[m.key] > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.22 }}
      className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-4"
    >
      {/* Header del día */}
      <div className="flex items-center gap-2">
        <CalendarDays className="w-4 h-4 text-[#C9A84C]" />
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>

      {/* Resumen */}
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

      {/* Por método de pago */}
      {methods.length > 0 && (
        <div className="space-y-1.5">
          {methods.map(({ key, label, icon: Icon }) => (
            <div key={key} className="flex items-center gap-2 text-sm">
              <Icon className="w-4 h-4 text-[#a1a1aa]" />
              <span className="text-[#a1a1aa] flex-1">{label}</span>
              <span className="text-white font-medium tabular-nums">{formatPrice(day.byPayment[key])}</span>
            </div>
          ))}
        </div>
      )}

      {/* Lista de cortes */}
      <div>
        <p className="text-xs text-[#a1a1aa] mb-1.5">Lista de cortes</p>
        <div className="rounded-xl border border-white/10 divide-y divide-white/5">
          {day.cuts.map((c) => (
            <CutItemRow key={c.id} cut={c} />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
