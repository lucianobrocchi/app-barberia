import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { startOfWeek } from 'date-fns';
import { LogOut, Plus, Trophy, CalendarDays, Flame, Scissors } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { BrandLogo } from '@/shared/components/BrandLogo';
import { useTodayCuts } from '../hooks/useTodayCuts';
import { useBarberRanking } from '../hooks/useBarberRanking';
import { DaySummaryCards } from '../components/DaySummaryCards';
import { CutsList } from '../components/CutsList';
import { BarberRankCard } from '../components/BarberRankCard';
import { useBarberWeekData } from '@/features/dashboard/hooks/useBarberWeekData';
import { WeekChart } from '@/features/dashboard/components/WeekChart';
import { DayDetailPanel } from '@/features/dashboard/components/DayDetailPanel';
import { RecordsPanel } from '@/features/dashboard/components/RecordsPanel';
import { useRecords } from '@/features/dashboard/hooks/useRecords';

function SectionTitle({ icon: Icon, children }: { icon: typeof Trophy; children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 text-sm font-medium text-[#a1a1aa] mb-3">
      <Icon className="w-4 h-4" />
      {children}
    </h2>
  );
}

export function BarberHomePage() {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const { cuts, total, count, isLoading } = useTodayCuts(profile?.id);

  const ranking = useBarberRanking(profile?.barbershop_id, profile?.id);

  const weekStart = useMemo(() => startOfWeek(new Date(), { weekStartsOn: 1 }), []);
  const week = useBarberWeekData(profile?.id, weekStart);
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
  const selectedDay = week.days.find((d) => d.key === selectedDayKey && d.count > 0) ?? null;

  const records = useRecords(profile?.barbershop_id ? [profile.barbershop_id] : [], profile?.id);

  async function handleSignOut() {
    await signOut();
    navigate('/', { replace: true });
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-32">
      {/* Header */}
      <header className="px-5 pt-6 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BrandLogo className="w-10 h-10" />
          <div>
            <p className="text-[10px] tracking-[0.18em] uppercase text-[#a1a1aa] font-medium">
              <span className="text-[#C9A84C]">Bacano</span>
            </p>
            <p className="font-semibold text-white leading-tight">
              Hola, {profile.full_name.split(' ')[0]}
            </p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="p-2.5 rounded-xl text-[#a1a1aa] hover:text-white hover:bg-white/5 active:scale-95 transition-all"
          aria-label="Cerrar sesión"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      <main className="px-5 pt-4 max-w-md mx-auto w-full space-y-8">
        {/* Hoy */}
        <section className="space-y-3">
          <DaySummaryCards count={count} total={total} />
          {!ranking.isLoading && <BarberRankCard ranking={ranking} />}
        </section>

        {/* Tu semana */}
        <section>
          <SectionTitle icon={CalendarDays}>Tu semana</SectionTitle>
          {week.isLoading ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-3">
              <WeekChart days={week.days} selectedKey={selectedDayKey} onSelectDay={setSelectedDayKey} />
              {!selectedDay && (
                <p className="text-center text-[11px] text-[#71717a]">Tocá un día para ver el detalle</p>
              )}
              {selectedDay && <DayDetailPanel key={selectedDay.key} day={selectedDay} />}
            </div>
          )}
        </section>

        {/* Tus récords */}
        {!records.isLoading && (
          <section>
            <SectionTitle icon={Flame}>Tus récords</SectionTitle>
            <RecordsPanel records={records} />
          </section>
        )}

        {/* Cortes de hoy */}
        <section>
          <SectionTitle icon={Scissors}>Cortes de hoy</SectionTitle>
          <CutsList cuts={cuts} isLoading={isLoading} />
        </section>
      </main>

      {/* Botón principal flotante */}
      <div className="fixed bottom-0 inset-x-0 px-5 pb-6 pt-10 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a] to-transparent">
        <motion.button
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 260, damping: 22 }}
          onClick={() => navigate('/barber/nuevo-corte')}
          className="w-full max-w-md mx-auto flex items-center justify-center gap-2 h-14 bg-gradient-to-br from-[#E0C766] to-[#A8842F] text-[#0a0a0a] font-semibold rounded-2xl shadow-lg shadow-[#C9A84C]/25 hover:opacity-95 active:scale-95 transition-all"
        >
          <Plus className="w-5 h-5" strokeWidth={2.5} />
          Registrar corte
        </motion.button>
      </div>
    </div>
  );
}
