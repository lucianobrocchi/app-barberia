import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FlaskConical, Sparkles, Trash2, AlertTriangle, X, Check } from 'lucide-react';
import { seedDemoData, clearDemoData } from './demoData';
import { useDemoStatus } from './useDemoStatus';

interface DemoSectionProps {
  barbershopId: string;
  ownerId: string;
}

/**
 * Sección de Administración para cargar/limpiar datos de demostración.
 * - Sin demo: explica y ofrece "Cargar datos de demo".
 * - Con demo: muestra cuántos hay y permite "Limpiar y arrancar de verdad".
 */
export function DemoSection({ barbershopId, ownerId }: DemoSectionProps) {
  const { hasDemo, count, isLoading, refetch } = useDemoStatus(barbershopId);
  const [working, setWorking] = useState<null | 'seed' | 'clear'>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  async function handleSeed() {
    setWorking('seed');
    setError(null);
    setProgress(0);
    try {
      await seedDemoData(barbershopId, ownerId, (done, total) => {
        setProgress(Math.round((done / total) * 100));
      });
      await refetch();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cargar la demo.');
    } finally {
      setWorking(null);
    }
  }

  async function handleClear() {
    setConfirmClear(false);
    setWorking('clear');
    setError(null);
    try {
      await clearDemoData(barbershopId);
      await refetch();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo limpiar la demo.');
    } finally {
      setWorking(null);
    }
  }

  return (
    <section className="space-y-2.5">
      <h2 className="flex items-center gap-2 text-sm font-medium text-[#a1a1aa]">
        <FlaskConical className="w-4 h-4" /> Datos de demostración
      </h2>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <div className="w-5 h-5 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : hasDemo ? (
          <>
            <div className="flex items-start gap-3">
              <span className="w-9 h-9 rounded-xl bg-amber-400/15 flex items-center justify-center shrink-0">
                <FlaskConical className="w-5 h-5 text-amber-300" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white">Modo demo activo</p>
                <p className="text-xs text-[#a1a1aa] mt-0.5">
                  Hay <span className="text-amber-200 font-medium tabular-nums">{count.toLocaleString('es-AR')}</span> cortes
                  de ejemplo cargados. Cuando quieras arrancar de verdad, limpialos: tus cortes reales no se tocan.
                </p>
              </div>
            </div>
            <button
              onClick={() => setConfirmClear(true)}
              disabled={working !== null}
              className="w-full min-h-[48px] flex items-center justify-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/[0.08] text-red-300 font-medium hover:bg-red-500/[0.14] active:scale-[0.99] disabled:opacity-50 transition-all"
            >
              {working === 'clear' ? (
                <span className="w-5 h-5 border-2 border-red-300 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Trash2 className="w-4 h-4" /> Limpiar demo y arrancar de verdad
                </>
              )}
            </button>
          </>
        ) : (
          <>
            <div className="flex items-start gap-3">
              <span className="w-9 h-9 rounded-xl bg-[#C9A84C]/12 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-[#C9A84C]" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white">Mostrá la app funcionando</p>
                <p className="text-xs text-[#a1a1aa] mt-0.5">
                  Cargá ~3 meses de cortes de ejemplo (repartidos por barbero, día y método de pago) para ver los
                  paneles y gráficos con datos. Se marcan como demo y los borrás cuando quieras.
                </p>
              </div>
            </div>
            <button
              onClick={handleSeed}
              disabled={working !== null}
              className="w-full min-h-[48px] flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-[#E0C766] to-[#A8842F] text-[#0a0a0a] font-semibold shadow-lg shadow-[#C9A84C]/20 hover:opacity-95 active:scale-[0.99] disabled:opacity-60 transition-all"
            >
              {working === 'seed' ? (
                <>
                  <span className="w-5 h-5 border-2 border-[#0a0a0a] border-t-transparent rounded-full animate-spin" />
                  Cargando… {progress}%
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" strokeWidth={2.5} /> Cargar datos de demo
                </>
              )}
            </button>
          </>
        )}

        {error && (
          <p className="text-xs text-red-400 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {error}
          </p>
        )}
      </div>

      {/* Confirmación de limpieza */}
      <AnimatePresence>
        {confirmClear && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-4"
            onClick={() => setConfirmClear(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#1a1a1a] p-6 mb-4 sm:mb-0"
            >
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-medium text-white flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-red-400" /> Limpiar demo
                </h3>
                <button
                  onClick={() => setConfirmClear(false)}
                  className="p-2 rounded-xl text-[#a1a1aa] hover:text-white hover:bg-white/5 transition-colors"
                  aria-label="Cerrar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-[#a1a1aa] mb-5">
                Se borran los <span className="text-white font-medium">{count.toLocaleString('es-AR')}</span> cortes de
                demo. Tus cortes reales quedan intactos. Esto no se puede deshacer.
              </p>
              <button
                onClick={handleClear}
                className="w-full min-h-[48px] flex items-center justify-center gap-2 rounded-2xl bg-red-500 text-white font-semibold hover:bg-red-600 active:scale-95 transition-all"
              >
                <Check className="w-5 h-5" /> Sí, limpiar y arrancar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
