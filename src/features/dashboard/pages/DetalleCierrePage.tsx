import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useCierreById } from '../hooks/useHistorialCierres';
import { ResumenDiario } from '../components/ResumenDiario';

export function DetalleCierrePage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { cierre, isLoading, notFound } = useCierreById(id);

  const fecha = cierre?.resumen.fecha
    ? new Date(cierre.resumen.fecha + 'T12:00:00')
    : cierre
      ? new Date(cierre.closed_at)
      : null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-16">
      <header className="px-5 py-5 flex items-center gap-3 border-b border-white/10 sticky top-0 bg-[#0a0a0a]/90 backdrop-blur z-20">
        <button
          onClick={() => navigate('/dashboard/historial')}
          className="p-2 -ml-2 rounded-xl text-[#a1a1aa] hover:text-white hover:bg-white/5 transition-colors"
          aria-label="Volver"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-semibold text-white leading-tight">Detalle del cierre</h1>
          {fecha && (
            <p className="text-xs text-[#a1a1aa] capitalize">
              {format(fecha, "EEEE d 'de' MMMM yyyy", { locale: es })}
            </p>
          )}
        </div>
      </header>

      <main className="px-5 pt-6 max-w-2xl mx-auto w-full">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-7 h-7 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notFound || !cierre ? (
          <div className="text-center py-20">
            <p className="text-white font-medium">No se encontró el cierre</p>
            <button
              onClick={() => navigate('/dashboard/historial')}
              className="mt-4 text-sm text-[#C9A84C] hover:underline"
            >
              Volver al historial
            </button>
          </div>
        ) : (
          <ResumenDiario resumen={cierre.resumen} />
        )}
      </main>
    </div>
  );
}
