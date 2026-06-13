import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { startOfWeek, subWeeks } from 'date-fns';
import { LogOut, Users, CreditCard, Activity, Bell, Lock, Archive, ChevronRight, Settings, Plus, CalendarDays, Clock, Scissors, BarChart3, Flame } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { BrandLogo } from '@/shared/components/BrandLogo';
import { usePeriodStats, type Period } from './hooks/usePeriodStats';
import { useTodayAlerts } from './hooks/useTodayAlerts';
import { useCierreDia } from './hooks/useCierreDia';
import { useShopWeekData } from './hooks/useShopWeekData';
import { EXTRA_LOCALES, type LocalDef, type LocalValue } from './config/locales';
import { PeriodSelector } from './components/PeriodSelector';
import { LocalSelector } from './components/LocalSelector';
import { KpiCards } from './components/KpiCards';
import { BarberPerformance } from './components/BarberPerformance';
import { MetodosPagoDonut } from './components/MetodosPagoDonut';
import { RecentActivity } from './components/RecentActivity';
import { AlertsPanel } from './components/AlertsPanel';
import { DaySelector } from './components/DaySelector';
import { WeekChart } from './components/WeekChart';
import { ShopDayDetailPanel } from './components/ShopDayDetailPanel';
import { DemoBanner } from '@/features/demo/DemoBanner';
import { useDemoStatus } from '@/features/demo/useDemoStatus';
import { MonthProjection } from './components/MonthProjection';
import { MonthChart } from './components/MonthChart';
import { HoraPicoChart } from './components/HoraPicoChart';
import { ServiciosTop } from './components/ServiciosTop';
import { RecordsPanel } from './components/RecordsPanel';
import { useRecords } from './hooks/useRecords';

const PERIOD_LABEL: Record<Period, string> = {
  today: 'hoy',
  week: 'los últimos 7 días',
  month: 'los últimos 30 días',
};

function SectionTitle({ icon: Icon, children }: { icon: typeof Users; children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 text-sm font-medium text-[#a1a1aa] mb-3">
      <Icon className="w-4 h-4" />
      {children}
    </h2>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const [period, setPeriod] = useState<Period>('today');
  const [local, setLocal] = useState<LocalValue>('all');

  // Locales del dueño: su local principal (del perfil) + extras configurados.
  const locales = useMemo<LocalDef[]>(() => {
    if (!profile?.barbershop_id) return [];
    return [
      { barbershopId: profile.barbershop_id, nombre: 'Barbería Bacano', corto: 'Bacano' },
      ...EXTRA_LOCALES,
    ];
  }, [profile?.barbershop_id]);

  const shopIds = useMemo(
    () => (local === 'all' ? locales.map((l) => l.barbershopId) : [local]),
    [local, locales],
  );

  const stats = usePeriodStats(shopIds, period, profile?.id);

  // Vista semanal día-por-día del local (independiente del selector de período)
  const [shopWeekOffset, setShopWeekOffset] = useState(0);
  const [shopDir, setShopDir] = useState(0);
  const [shopDayKey, setShopDayKey] = useState<string | null>(null);
  const shopWeekStart = useMemo(
    () => startOfWeek(subWeeks(new Date(), shopWeekOffset), { weekStartsOn: 1 }),
    [shopWeekOffset],
  );
  const shopWeek = useShopWeekData(shopIds, shopWeekStart);
  const shopSelectedDay = shopWeek.days.find((d) => d.key === shopDayKey && d.count > 0) ?? null;
  function shopPrevWeek() { setShopDir(-1); setShopDayKey(null); setShopWeekOffset((o) => o + 1); }
  function shopNextWeek() { if (shopWeekOffset === 0) return; setShopDir(1); setShopDayKey(null); setShopWeekOffset((o) => Math.max(0, o - 1)); }

  const { alerts, isLoading: alertsLoading } = useTodayAlerts(profile?.barbershop_id);
  const { existing: cierreHoy } = useCierreDia(profile?.barbershop_id);
  const { hasDemo, count: demoCount } = useDemoStatus(profile?.barbershop_id);
  // Récords/rachas: solo se consultan en la pestaña Mes (histórico de 180 días).
  const records = useRecords(period === 'month' ? shopIds : []);

  async function handleSignOut() {
    await signOut();
    navigate('/', { replace: true });
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-16">
      {/* Header */}
      <header className="px-5 py-5 flex items-center justify-between border-b border-white/10 sticky top-0 bg-[#0a0a0a]/90 backdrop-blur z-20">
        <div className="flex items-center gap-3">
          <BrandLogo className="w-10 h-10" />
          <div>
            <p className="text-[10px] tracking-[0.18em] uppercase text-[#a1a1aa] font-medium">
              <span className="text-[#C9A84C]">Bacano</span> · Dueño
            </p>
            <p className="font-semibold text-white leading-tight">
              {profile.full_name.split(' ')[0]}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate('/dashboard/configuracion')}
            className="p-2.5 rounded-xl text-[#a1a1aa] hover:text-white hover:bg-white/5 active:scale-95 transition-all"
            aria-label="Administración"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            onClick={handleSignOut}
            className="p-2.5 rounded-xl text-[#a1a1aa] hover:text-white hover:bg-white/5 active:scale-95 transition-all"
            aria-label="Cerrar sesión"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="px-5 pt-5 max-w-2xl mx-auto w-full space-y-8">
        {/* Aviso de modo demo */}
        {hasDemo && (
          <DemoBanner count={demoCount} onClick={() => navigate('/dashboard/configuracion')} />
        )}

        {/* Registrar mi corte (el dueño también corta) */}
        <button
          onClick={() => navigate('/dashboard/nuevo-corte')}
          className="w-full min-h-[52px] flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-[#E0C766] to-[#A8842F] text-[#0a0a0a] font-semibold shadow-lg shadow-[#C9A84C]/20 hover:opacity-95 active:scale-[0.99] transition-all"
        >
          <Plus className="w-4 h-4" strokeWidth={2.75} /> Registrar mi corte
        </button>

        {/* Selector de local */}
        <LocalSelector locales={locales} value={local} onChange={setLocal} />

        {/* Selector de período */}
        <PeriodSelector value={period} onChange={setPeriod} />

        {/* 1) Resumen del período */}
        {stats.isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-7 h-7 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <motion.section
            key={`resumen-${period}-${local}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <p className="text-xs text-[#a1a1aa] mb-3">Resumen de {PERIOD_LABEL[period]}</p>
            <KpiCards
              ganancia={stats.ganancia}
              total={stats.total}
              count={stats.count}
              barbersActive={stats.barbersActive}
              barbersTotal={stats.barbersTotal}
              prevDelta={stats.prevDelta}
              period={period}
            />
          </motion.section>
        )}

        {/* 2) Semana día por día (local) — SOLO en la pestaña Semana */}
        {period === 'week' && (
          <section className="space-y-3">
            <h2 className="flex items-center gap-2 text-sm font-medium text-[#a1a1aa]">
              <CalendarDays className="w-4 h-4" /> Semana — día por día
            </h2>
            <DaySelector weekStart={shopWeekStart} onPrev={shopPrevWeek} onNext={shopNextWeek} canGoNext={shopWeekOffset > 0} />
            <motion.div key={shopWeekOffset} initial={{ opacity: 0, x: shopDir * 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
              {shopWeek.isLoading ? (
                <div className="flex justify-center py-10">
                  <div className="w-6 h-6 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <WeekChart days={shopWeek.days} selectedKey={shopDayKey} onSelectDay={setShopDayKey} />
              )}
            </motion.div>
            <AnimatePresence mode="wait">
              {shopSelectedDay && <ShopDayDetailPanel key={shopSelectedDay.key} day={shopSelectedDay} />}
            </AnimatePresence>
          </section>
        )}

        {/* 2b) Mes — proyección + facturación día por día (SOLO en la pestaña Mes) */}
        {period === 'month' && !stats.isLoading && (
          <motion.section
            key={`mes-${local}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-3"
          >
            <SectionTitle icon={BarChart3}>Tu mes</SectionTitle>
            <MonthProjection cuts={stats.cuts} />
            <MonthChart cuts={stats.cuts} />
          </motion.section>
        )}

        {/* 2c) Récords y rachas — histórico (SOLO en la pestaña Mes) */}
        {period === 'month' && !stats.isLoading && !records.isLoading && (
          <motion.section
            key={`records-${local}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-3"
          >
            <SectionTitle icon={Flame}>Récords y rachas</SectionTitle>
            <RecordsPanel records={records} />
          </motion.section>
        )}

        {/* 3) Resto del período (hora pico más abajo, lejos del calendario) */}
        {!stats.isLoading && (
          <motion.div
            key={`resto-${period}-${local}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-8"
          >
            {/* Alertas (siempre del día) */}
            <section>
              <SectionTitle icon={Bell}>Alertas</SectionTitle>
              <AlertsPanel alerts={alerts} isLoading={alertsLoading} />
            </section>

            {/* Rendimiento por barbero */}
            <section>
              <SectionTitle icon={Users}>Rendimiento por barbero</SectionTitle>
              <BarberPerformance barbers={stats.byBarber} ownerId={profile.id} />
            </section>

            {/* Desglose por método de pago */}
            <section>
              <SectionTitle icon={CreditCard}>Métodos de pago</SectionTitle>
              <MetodosPagoDonut byPayment={stats.byPayment} total={stats.total} />
            </section>

            {/* Hora pico y servicios top — enriquecen el mes */}
            {period === 'month' && (
              <>
                <section>
                  <SectionTitle icon={Clock}>Hora pico</SectionTitle>
                  <HoraPicoChart cuts={stats.cuts} />
                </section>
                <section>
                  <SectionTitle icon={Scissors}>Servicios más pedidos</SectionTitle>
                  <ServiciosTop servicios={stats.byService.slice(0, 5)} />
                </section>
              </>
            )}

            {/* Actividad reciente */}
            <section>
              <SectionTitle icon={Activity}>Actividad reciente</SectionTitle>
              <RecentActivity cuts={stats.cuts} />
            </section>
          </motion.div>
        )}

        {/* Cierre de caja + configuración */}
        <section className="pt-2 space-y-3">
          {cierreHoy ? (
            <button
              onClick={() => navigate(`/dashboard/historial/${cierreHoy.id}`)}
              className="w-full min-h-[52px] flex items-center justify-center gap-2 rounded-2xl border border-[#C9A84C]/30 bg-[#C9A84C]/[0.06] text-[#C9A84C] font-medium hover:bg-[#C9A84C]/10 active:scale-[0.99] transition-all"
            >
              <Lock className="w-4 h-4" />
              Ver cierre de hoy
            </button>
          ) : (
            <button
              onClick={() => navigate('/dashboard/cierre')}
              className="w-full min-h-[52px] flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-[#E0C766] to-[#A8842F] text-[#0a0a0a] font-semibold shadow-lg shadow-[#C9A84C]/20 hover:opacity-95 active:scale-[0.99] transition-all"
            >
              <Lock className="w-4 h-4" strokeWidth={2.5} />
              Cerrar caja del día
            </button>
          )}

          <button
            onClick={() => navigate('/dashboard/historial')}
            className="w-full min-h-[52px] flex items-center justify-between px-4 rounded-2xl border border-white/10 bg-white/[0.03] text-white hover:border-white/20 active:scale-[0.99] transition-all"
          >
            <span className="flex items-center gap-2 text-sm font-medium">
              <Archive className="w-4 h-4 text-[#a1a1aa]" />
              Historial de cierres
            </span>
            <ChevronRight className="w-4 h-4 text-[#a1a1aa]" />
          </button>
        </section>
      </main>
    </div>
  );
}
