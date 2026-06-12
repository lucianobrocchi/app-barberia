import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { startOfWeek, subWeeks } from 'date-fns';
import { ArrowLeft, Clock, Activity, HandCoins, Scissors, Receipt } from 'lucide-react';
import { formatPrice } from '@/shared/lib/utils';
import { DEMO_USERS, initials } from '@/features/auth/data/demoUsers';
import { useBarberProfile } from '../hooks/useBarberProfile';
import { useBarberWeekData } from '../hooks/useBarberWeekData';
import type { Period } from '../hooks/usePeriodStats';
import { PeriodSelector } from '../components/PeriodSelector';
import { RecentActivity } from '../components/RecentActivity';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { DaySelector } from '../components/DaySelector';
import { WeekCalendar } from '../components/WeekCalendar';
import { WeekChart } from '../components/WeekChart';
import { DayDetailPanel } from '../components/DayDetailPanel';

const SHARE_COLORS = ['#C9A84C', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#71717a'];

function colorForName(name: string): string {
  return DEMO_USERS.find((u) => u.name === name)?.color ?? '#C9A84C';
}

function SectionTitle({ icon: Icon, children }: { icon: typeof Clock; children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 text-sm font-medium text-[#a1a1aa] mb-3">
      <Icon className="w-4 h-4" />
      {children}
    </h2>
  );
}

export function BarberProfilePage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [period, setPeriod] = useState<Period>('today');
  const p = useBarberProfile(id, period);

  // Estado de la vista "Semana" (calendario navegable).
  const [weekOffset, setWeekOffset] = useState(0); // 0 = semana actual
  const [dir, setDir] = useState(0); // -1 atrás, +1 adelante (para el slide)
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
  const [weekView, setWeekView] = useState<'chart' | 'list'>('chart');
  const weekStart = useMemo(
    () => startOfWeek(subWeeks(new Date(), weekOffset), { weekStartsOn: 1 }),
    [weekOffset],
  );
  const week = useBarberWeekData(period === 'week' ? id : undefined, weekStart);
  const selectedDay = week.days.find((d) => d.key === selectedDayKey && d.count > 0) ?? null;

  function goPrevWeek() {
    setDir(-1);
    setSelectedDayKey(null);
    setWeekOffset((o) => o + 1);
  }
  function goNextWeek() {
    if (weekOffset === 0) return;
    setDir(1);
    setSelectedDayKey(null);
    setWeekOffset((o) => Math.max(0, o - 1));
  }

  if (p.isLoading && !p.barber) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex justify-center pt-24">
        <div className="w-7 h-7 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!p.barber) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center gap-4 px-5">
        <p className="text-[#a1a1aa]">No se encontró el barbero.</p>
        <button onClick={() => navigate('/dashboard')} className="text-[#C9A84C] font-medium">Volver</button>
      </div>
    );
  }

  const name = p.barber.full_name;
  const color = colorForName(name);

  // Top servicios + agrupar el resto en "Otros".
  const topShare = p.serviceShare.slice(0, 4);
  const restPct = p.serviceShare.slice(4).reduce((s, x) => s + x.pct, 0);
  const restCount = p.serviceShare.slice(4).reduce((s, x) => s + x.count, 0);
  const shareRows = restPct > 0 ? [...topShare, { serviceId: 'otros', name: 'Otros', count: restCount, pct: restPct }] : topShare;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-16">
      {/* Header */}
      <header className="px-5 py-5 border-b border-white/10 sticky top-0 bg-[#0a0a0a]/90 backdrop-blur z-20">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-1.5 text-sm text-[#a1a1aa] hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>
        <div className="flex items-center gap-3">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center font-semibold text-lg shrink-0 text-white"
            style={{ backgroundColor: color }}
          >
            {initials(name)}
          </div>
          <div>
            <p className="font-display text-2xl text-white leading-tight">{name}</p>
            <p className="text-xs text-[#a1a1aa]">{p.barber.role === 'owner' ? 'Dueño' : 'Barbero'} · Barbería Bacano</p>
            <span className={`text-xs font-medium ${p.activeToday ? 'text-green-400' : 'text-[#71717a]'}`}>
              {p.activeToday ? '● Activo hoy' : '○ Sin cortes hoy'}
            </span>
          </div>
        </div>
      </header>

      <main className="px-5 pt-5 max-w-2xl mx-auto w-full space-y-6">
        <PeriodSelector value={period} onChange={setPeriod} />

        {period === 'week' ? (
          /* ───────── Vista SEMANA: calendario navegable ───────── */
          <motion.div key="week" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-4">
            <DaySelector weekStart={weekStart} onPrev={goPrevWeek} onNext={goNextWeek} canGoNext={weekOffset > 0} />

            {/* Toggle Gráfico / Lista */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/10 w-fit mx-auto">
              {(['chart', 'list'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setWeekView(v)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    weekView === v ? 'bg-[#C9A84C] text-[#0a0a0a]' : 'text-[#a1a1aa] hover:text-white'
                  }`}
                >
                  {v === 'chart' ? 'Gráfico' : 'Lista'}
                </button>
              ))}
            </div>

            <motion.div
              key={weekOffset}
              initial={{ opacity: 0, x: dir * 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              {week.isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="w-6 h-6 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : weekView === 'chart' ? (
                <WeekChart days={week.days} selectedKey={selectedDayKey} onSelectDay={setSelectedDayKey} />
              ) : (
                <WeekCalendar days={week.days} selectedKey={selectedDayKey} onSelectDay={setSelectedDayKey} />
              )}
            </motion.div>

            <p className="text-xs text-[#71717a] text-center">Tocá un día trabajado para ver el detalle</p>

            <AnimatePresence mode="wait">
              {selectedDay && <DayDetailPanel key={selectedDay.key} day={selectedDay} />}
            </AnimatePresence>
          </motion.div>
        ) : (
          /* ───────── Vista HOY / MES: KPIs ───────── */
          <motion.div key={period} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-8">
            <section className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center gap-2 text-[#a1a1aa] mb-2"><Receipt className="w-4 h-4" /><span className="text-xs">Recaudado</span></div>
                <AnimatedNumber value={p.total} format={formatPrice} className="block text-2xl font-semibold text-white tabular-nums" />
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center gap-2 text-[#a1a1aa] mb-2"><Scissors className="w-4 h-4" /><span className="text-xs">Cortes</span></div>
                <AnimatedNumber value={p.count} className="block text-2xl font-semibold text-white tabular-nums" />
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center gap-2 text-[#a1a1aa] mb-2"><Receipt className="w-4 h-4" /><span className="text-xs">Ticket promedio</span></div>
                <AnimatedNumber value={p.avgTicket} format={formatPrice} className="block text-2xl font-semibold text-white tabular-nums" />
              </div>
              <div className="rounded-2xl border border-[#C9A84C]/40 bg-gradient-to-br from-[#C9A84C]/[0.15] to-[#C9A84C]/[0.03] p-4 shadow-lg shadow-black/20">
                {p.barber.role === 'owner' ? (
                  <>
                    <div className="flex items-center gap-2 text-[#C9A84C] mb-2"><HandCoins className="w-4 h-4" /><span className="text-xs font-medium">Tus cortes (100%)</span></div>
                    <AnimatedNumber value={p.total} format={formatPrice} className="block text-2xl font-semibold text-[#C9A84C] tabular-nums" />
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 text-[#C9A84C] mb-2"><HandCoins className="w-4 h-4" /><span className="text-xs font-medium">Le debés (50%)</span></div>
                    <AnimatedNumber value={p.commission} format={formatPrice} className="block text-2xl font-semibold text-[#C9A84C] tabular-nums" />
                  </>
                )}
              </div>
            </section>

            <section>
              <SectionTitle icon={Scissors}>Proporción de servicios</SectionTitle>
              {shareRows.length === 0 ? (
                <div className="text-center py-8 rounded-2xl border border-dashed border-white/10">
                  <p className="text-sm text-[#a1a1aa]">Sin servicios en este período</p>
                </div>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex h-3 rounded-full overflow-hidden mb-4">
                    {shareRows.map((s, i) => (
                      <div key={s.serviceId} style={{ width: `${s.pct}%`, backgroundColor: SHARE_COLORS[i % SHARE_COLORS.length] }} />
                    ))}
                  </div>
                  <div className="space-y-2">
                    {shareRows.map((s, i) => (
                      <div key={s.serviceId} className="flex items-center gap-2.5 text-sm">
                        <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: SHARE_COLORS[i % SHARE_COLORS.length] }} />
                        <span className="text-white flex-1 truncate">{s.name}</span>
                        <span className="text-[#a1a1aa] tabular-nums">{s.count} · {Math.round(s.pct)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <section>
              <SectionTitle icon={Activity}>Actividad reciente</SectionTitle>
              <RecentActivity cuts={p.cuts.map((c) => ({ ...c, barber: null }))} />
            </section>
          </motion.div>
        )}
      </main>
    </div>
  );
}
