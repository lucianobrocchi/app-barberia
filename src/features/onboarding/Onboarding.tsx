import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Scissors,
  BarChart3,
  DollarSign,
  Users,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Check,
  type LucideIcon,
} from 'lucide-react';
import { markOnboardingSeen } from './onboardingState';

interface Slide {
  icon: LucideIcon;
  tag: string;
  title: string;
  body: string;
  /** Línea de "cómo se hace" opcional, resaltada. */
  steps?: string[];
  ownerOnly?: boolean;
}

const SLIDES: Slide[] = [
  {
    icon: Sparkles,
    tag: 'Bienvenido',
    title: 'Tu barbería, en el celular',
    body:
      'ADDA junta todo en un solo lugar: cada barbero registra sus cortes y vos, como dueño, ves la facturación y las estadísticas en tiempo real.',
  },
  {
    icon: Scissors,
    tag: 'El día a día',
    title: 'Registrar un corte',
    body:
      'Cada barbero entra con su perfil y toca “Registrar mi corte”. En tres toques queda cargado y suma a sus estadísticas y a la caja del día.',
    steps: ['Elegí el servicio', 'Elegí el método de pago', 'Confirmá — listo'],
  },
  {
    icon: BarChart3,
    tag: 'Panel del dueño',
    title: 'Mirá cómo va todo',
    body:
      'Entrás como dueño y ves ganancia, facturado y cortes. Cambiá entre Hoy, Semana y Mes, mirá el ranking por barbero y los métodos de pago.',
    steps: ['Filtrá por Hoy / Semana / Mes', 'Cerrá la caja al terminar la jornada'],
  },
  {
    icon: DollarSign,
    tag: 'Solo el dueño',
    title: 'Editar precios',
    body:
      'En el panel del dueño tocás “Administración”. En Servicios y precios cambiás el monto de cada corte, lo guardás, y podés agregar u ocultar servicios.',
    steps: ['Administración → Servicios y precios', 'Tocá el precio, editalo y Guardá'],
    ownerOnly: true,
  },
  {
    icon: Users,
    tag: 'Solo el dueño',
    title: 'Editar empleados',
    body:
      'En “Administración → Equipo” cambiás el nombre de un barbero, lo activás o desactivás (sin perder su historial) y le ponés un PIN para su perfil.',
    steps: ['Administración → Equipo', 'Editá nombre, PIN o estado'],
    ownerOnly: true,
  },
];

interface OnboardingProps {
  open: boolean;
  onClose: () => void;
}

export function Onboarding({ open, onClose }: OnboardingProps) {
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const slide = SLIDES[index];
  const isLast = index === SLIDES.length - 1;
  const Icon = slide.icon;

  function finish() {
    markOnboardingSeen();
    onClose();
  }

  function next() {
    if (isLast) {
      finish();
      return;
    }
    setDir(1);
    setIndex((i) => i + 1);
  }

  function prev() {
    if (index === 0) return;
    setDir(-1);
    setIndex((i) => i - 1);
  }

  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm px-4 py-6"
    >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#141414] p-6 pb-7 flex flex-col"
          >
            {/* Saltar */}
            <div className="flex justify-end mb-1 min-h-[20px]">
              {!isLast && (
                <button
                  onClick={finish}
                  className="text-xs text-[#71717a] hover:text-[#a1a1aa] transition-colors"
                >
                  Saltar
                </button>
              )}
            </div>

            {/* Contenido por slide. Se anima la entrada re-montando por `key`
                (sin AnimatePresence mode="wait", que se traba en StrictMode). */}
            <div className="overflow-hidden min-h-[300px]">
              <motion.div
                key={index}
                initial={{ opacity: 0, x: dir * 36 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="flex flex-col items-center text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#E0C766] to-[#A8842F] flex items-center justify-center shadow-lg shadow-[#C9A84C]/20 mb-5">
                  <Icon className="w-8 h-8 text-[#0a0a0a]" strokeWidth={2} />
                </div>

                <p className="text-[11px] tracking-[0.25em] uppercase text-[#C9A84C] font-medium mb-2">
                  {slide.tag}
                </p>
                <h2 className="font-display text-2xl text-white leading-tight mb-3">
                  {slide.title}
                </h2>
                <p className="text-sm text-[#a1a1aa] leading-relaxed">{slide.body}</p>

                {slide.steps && (
                  <ul className="mt-5 w-full space-y-2 text-left">
                    {slide.steps.map((s, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-2.5 text-sm text-white/90 bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2.5"
                      >
                        <span className="w-5 h-5 rounded-full bg-[#C9A84C]/15 text-[#C9A84C] text-[11px] font-semibold flex items-center justify-center shrink-0">
                          {i + 1}
                        </span>
                        {s}
                      </li>
                    ))}
                  </ul>
                )}
              </motion.div>
            </div>

            {/* Dots */}
            <div className="flex items-center justify-center gap-1.5 mt-6 mb-5">
              {SLIDES.map((_, i) => (
                <button
                  key={i}
                  aria-label={`Ir al paso ${i + 1}`}
                  onClick={() => {
                    setDir(i > index ? 1 : -1);
                    setIndex(i);
                  }}
                  className={`h-1.5 rounded-full transition-all ${
                    i === index ? 'w-5 bg-[#C9A84C]' : 'w-1.5 bg-white/20 hover:bg-white/40'
                  }`}
                />
              ))}
            </div>

            {/* Navegación */}
            <div className="flex items-center gap-3">
              {index > 0 ? (
                <button
                  onClick={prev}
                  className="min-h-[52px] px-4 flex items-center justify-center gap-1.5 rounded-2xl border border-white/10 text-[#a1a1aa] hover:text-white hover:border-white/20 active:scale-95 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" /> Atrás
                </button>
              ) : null}
              <button
                onClick={next}
                className="flex-1 min-h-[52px] flex items-center justify-center gap-2 bg-gradient-to-br from-[#E0C766] to-[#A8842F] text-[#0a0a0a] font-semibold rounded-2xl shadow-lg shadow-[#C9A84C]/20 hover:opacity-95 active:scale-95 transition-all"
              >
                {isLast ? (
                  <>
                    <Check className="w-5 h-5" /> Empezar
                  </>
                ) : (
                  <>
                    Siguiente <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </motion.div>
    </motion.div>
  );
}
