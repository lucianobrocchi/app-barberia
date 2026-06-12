import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Archive } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useHistorialCierres } from '../hooks/useHistorialCierres';
import { CierreItem } from '../components/CierreItem';

export function HistorialCierresPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { cierres, isLoading } = useHistorialCierres(profile?.barbershop_id);

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-16">
      <header className="px-5 py-5 flex items-center gap-3 border-b border-white/10 sticky top-0 bg-[#0a0a0a]/90 backdrop-blur z-20">
        <button
          onClick={() => navigate('/dashboard')}
          className="p-2 -ml-2 rounded-xl text-[#a1a1aa] hover:text-white hover:bg-white/5 transition-colors"
          aria-label="Volver"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-semibold text-white">Historial de cierres</h1>
      </header>

      <main className="px-5 pt-6 max-w-2xl mx-auto w-full">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-7 h-7 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : cierres.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-5">
              <Archive className="w-8 h-8 text-[#a1a1aa]" />
            </div>
            <p className="text-white font-medium">Todavía no hay cierres guardados</p>
            <p className="text-sm text-[#a1a1aa] mt-1">
              Cuando cierres la caja, los cierres van a aparecer acá.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {cierres.map((c) => (
              <CierreItem
                key={c.id}
                cierre={c}
                onClick={() => navigate(`/dashboard/historial/${c.id}`)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
