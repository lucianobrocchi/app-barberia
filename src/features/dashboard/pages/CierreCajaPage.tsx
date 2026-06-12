import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, AlertCircle, Lock } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useCierreDia } from '../hooks/useCierreDia';
import { useGuardarCierre } from '../hooks/useGuardarCierre';
import { ResumenDiario } from '../components/ResumenDiario';
import { useState } from 'react';

export function CierreCajaPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { resumen, existing, isLoading, refetch } = useCierreDia(profile?.barbershop_id);
  const { guardarCierre, isSaving, error } = useGuardarCierre();
  const [done, setDone] = useState(false);

  async function handleConfirm() {
    if (!profile || !resumen) return;
    const ok = await guardarCierre(profile.barbershop_id, profile.id, resumen);
    if (ok) {
      setDone(true);
      refetch();
    }
  }

  if (!profile) return null;

  // Pantalla de éxito
  if (done) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 16 }}
          className="w-24 h-24 rounded-full bg-[#C9A84C] flex items-center justify-center mb-6"
        >
          <Check className="w-12 h-12 text-[#0a0a0a]" strokeWidth={3} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <h2 className="text-2xl font-semibold text-white">Caja cerrada</h2>
          <p className="text-[#a1a1aa] mt-2">Buen trabajo hoy. 👏</p>
        </motion.div>
        <button
          onClick={() => navigate('/dashboard', { replace: true })}
          className="mt-10 w-full max-w-xs min-h-[52px] bg-[#C9A84C] text-[#0a0a0a] font-semibold rounded-2xl hover:opacity-95 active:scale-95 transition-all"
        >
          Volver al dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-32">
      <header className="px-5 py-5 flex items-center gap-3 border-b border-white/10 sticky top-0 bg-[#0a0a0a]/90 backdrop-blur z-20">
        <button
          onClick={() => navigate('/dashboard')}
          className="p-2 -ml-2 rounded-xl text-[#a1a1aa] hover:text-white hover:bg-white/5 transition-colors"
          aria-label="Volver"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-semibold text-white leading-tight">Cierre de caja</h1>
          <p className="text-xs text-[#a1a1aa] capitalize">
            {format(new Date(), "EEEE d 'de' MMMM", { locale: es })}
          </p>
        </div>
      </header>

      <main className="px-5 pt-6 max-w-2xl mx-auto w-full">
        {isLoading || !resumen ? (
          <div className="flex justify-center py-20">
            <div className="w-7 h-7 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : existing ? (
          // Ya hay cierre hoy → bloquear
          <div className="flex flex-col items-center text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-5">
              <Lock className="w-8 h-8 text-[#C9A84C]" />
            </div>
            <h2 className="text-lg font-semibold text-white">La caja de hoy ya está cerrada</h2>
            <p className="text-[#a1a1aa] text-sm mt-1">No se puede hacer otro cierre el mismo día.</p>
            <button
              onClick={() => navigate(`/dashboard/historial/${existing.id}`)}
              className="mt-6 px-5 min-h-[48px] bg-[#C9A84C] text-[#0a0a0a] font-semibold rounded-2xl hover:opacity-95 active:scale-95 transition-all"
            >
              Ver cierre de hoy
            </button>
          </div>
        ) : (
          <>
            <p className="text-sm text-[#a1a1aa] mb-6">
              Revisá el resumen del día antes de confirmar el cierre.
            </p>

            <ResumenDiario resumen={resumen} />

            {error && (
              <div className="mt-6 flex items-start gap-2 p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            {/* Acciones */}
            <div className="mt-8 space-y-3">
              <button
                onClick={handleConfirm}
                disabled={isSaving}
                className="w-full min-h-[56px] flex items-center justify-center gap-2 bg-[#C9A84C] text-[#0a0a0a] font-semibold rounded-2xl hover:opacity-95 active:scale-95 disabled:opacity-50 transition-all"
              >
                {isSaving ? (
                  <span className="w-5 h-5 border-2 border-[#0a0a0a] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Check className="w-5 h-5" strokeWidth={2.5} />
                    Confirmar cierre de caja
                  </>
                )}
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full min-h-[52px] border border-white/10 text-[#a1a1aa] font-medium rounded-2xl hover:text-white hover:bg-white/5 transition-colors"
              >
                Volver al dashboard
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
