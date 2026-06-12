import { Wallet, Scissors, Receipt, CreditCard, Users, TrendingUp } from 'lucide-react';
import { formatPrice } from '@/shared/lib/utils';
import { DesglosePorMetodo } from './DesglosePorMetodo';
import { DesglosePorBarbero } from './DesglosePorBarbero';
import { ServiciosTop } from './ServiciosTop';
import type { CierreResumen } from '../cierreTypes';

function SectionTitle({ icon: Icon, children }: { icon: typeof Users; children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 text-sm font-medium text-[#a1a1aa] mb-3">
      <Icon className="w-4 h-4" />
      {children}
    </h2>
  );
}

export function ResumenDiario({ resumen }: { resumen: CierreResumen }) {
  return (
    <div className="space-y-8">
      {/* KPIs */}
      <section>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 rounded-2xl border border-[#C9A84C]/30 bg-[#C9A84C]/[0.06] p-5">
            <div className="flex items-center gap-2 text-[#C9A84C] mb-2">
              <Wallet className="w-4 h-4" />
              <span className="text-xs font-medium">Total recaudado</span>
            </div>
            <p className="text-4xl font-semibold text-[#C9A84C] tabular-nums">
              {formatPrice(resumen.total_recaudado)}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center gap-2 text-[#a1a1aa] mb-2">
              <Scissors className="w-4 h-4" />
              <span className="text-xs">Cortes</span>
            </div>
            <p className="text-2xl font-semibold text-white tabular-nums">{resumen.total_cortes}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center gap-2 text-[#a1a1aa] mb-2">
              <Receipt className="w-4 h-4" />
              <span className="text-xs">Ticket promedio</span>
            </div>
            <p className="text-2xl font-semibold text-white tabular-nums">
              {formatPrice(resumen.ticket_promedio)}
            </p>
          </div>
        </div>
      </section>

      <section>
        <SectionTitle icon={CreditCard}>Por método de pago</SectionTitle>
        <DesglosePorMetodo porMetodo={resumen.desglose_por_metodo} total={resumen.total_recaudado} />
      </section>

      <section>
        <SectionTitle icon={Users}>Por barbero</SectionTitle>
        <DesglosePorBarbero barberos={resumen.desglose_por_barbero} total={resumen.total_recaudado} />
      </section>

      <section>
        <SectionTitle icon={TrendingUp}>Servicios más vendidos</SectionTitle>
        <ServiciosTop servicios={resumen.servicios_top} />
      </section>
    </div>
  );
}
