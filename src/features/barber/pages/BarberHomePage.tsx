import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, Plus } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { BrandLogo } from '@/shared/components/BrandLogo';
import { useTodayCuts } from '../hooks/useTodayCuts';
import { DaySummaryCards } from '../components/DaySummaryCards';
import { CutsList } from '../components/CutsList';

export function BarberHomePage() {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const { cuts, total, count, isLoading } = useTodayCuts(profile?.id);

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

      <main className="px-5 pt-4 max-w-md mx-auto w-full space-y-6">
        <DaySummaryCards count={count} total={total} />

        <section>
          <h2 className="text-sm font-medium text-[#a1a1aa] mb-3">Cortes de hoy</h2>
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
