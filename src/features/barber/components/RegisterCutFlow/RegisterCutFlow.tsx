import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Check, X } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useRegisterCut } from '../../hooks/useRegisterCut';
import { StepService } from './StepService';
import { StepPayment } from './StepPayment';
import { StepConfirm } from './StepConfirm';
import { formatPrice } from '@/shared/lib/utils';
import type { Service, PaymentMethod } from '@/shared/types';

type Step = 'service' | 'payment' | 'confirm' | 'success';

const STEP_ORDER: Step[] = ['service', 'payment', 'confirm'];

export function RegisterCutFlow() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { registerCut, isSaving, error } = useRegisterCut();

  const [step, setStep] = useState<Step>('service');
  const [direction, setDirection] = useState(1);
  const [service, setService] = useState<Service | null>(null);
  const [payment, setPayment] = useState<PaymentMethod | null>(null);

  // Adónde volver según el rol (el dueño también registra sus cortes).
  const home = profile?.role === 'owner' ? '/dashboard' : '/barber';

  function goTo(next: Step, dir: number) {
    setDirection(dir);
    setStep(next);
  }

  function handleSelectService(s: Service) {
    setService(s);
    goTo('payment', 1);
  }

  function handleSelectPayment(p: PaymentMethod) {
    setPayment(p);
    goTo('confirm', 1);
  }

  function handleBack() {
    if (step === 'service') {
      navigate(home);
    } else if (step === 'payment') {
      goTo('service', -1);
    } else if (step === 'confirm') {
      goTo('payment', -1);
    }
  }

  async function handleConfirm() {
    if (!profile || !service || !payment) return;
    const ok = await registerCut({
      barbershopId: profile.barbershop_id,
      barberId: profile.id,
      serviceId: service.id,
      price: Number(service.price),
      paymentMethod: payment,
    });
    if (ok) {
      setDirection(1);
      setStep('success');
    }
  }

  // Al llegar a éxito, volver al home después de 1.5s
  useEffect(() => {
    if (step !== 'success') return;
    const t = setTimeout(() => navigate(home, { replace: true }), 1500);
    return () => clearTimeout(t);
  }, [step, navigate, home]);

  if (!profile) return null;

  const titles: Record<Step, string> = {
    service: 'Elegí el servicio',
    payment: 'Método de pago',
    confirm: 'Confirmar',
    success: '',
  };

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 100 : -100, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -100 : 100, opacity: 0 }),
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      {/* Header */}
      {step !== 'success' && (
        <header className="px-5 pt-6 pb-2 flex items-center gap-3">
          <button
            onClick={handleBack}
            className="p-2 -ml-2 rounded-xl text-[#a1a1aa] hover:text-white hover:bg-white/5 active:scale-95 transition-all"
            aria-label="Volver"
          >
            {step === 'service' ? <X className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
          </button>
          <h1 className="font-semibold text-white">{titles[step]}</h1>
        </header>
      )}

      {/* Progreso */}
      {step !== 'success' && (
        <div className="flex items-center justify-center gap-2 py-3">
          {STEP_ORDER.map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all ${
                step === s ? 'w-6 bg-[#C9A84C]' : 'w-1.5 bg-white/15'
              }`}
            />
          ))}
        </div>
      )}

      <main className="flex-1 px-5 pb-8 max-w-md mx-auto w-full overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="pt-2"
          >
            {step === 'service' && (
              <StepService
                barbershopId={profile.barbershop_id}
                selectedId={service?.id ?? null}
                onSelect={handleSelectService}
              />
            )}

            {step === 'payment' && (
              <StepPayment selected={payment} onSelect={handleSelectPayment} />
            )}

            {step === 'confirm' && service && payment && (
              <StepConfirm
                service={service}
                paymentMethod={payment}
                isSaving={isSaving}
                error={error}
                onConfirm={handleConfirm}
              />
            )}

            {step === 'success' && (
              <div className="flex flex-col items-center justify-center pt-24 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 16 }}
                  className="w-24 h-24 rounded-full bg-[#C9A84C] flex items-center justify-center mb-6"
                >
                  <Check className="w-12 h-12 text-[#0a0a0a]" strokeWidth={3} />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <h2 className="text-2xl font-semibold text-white">¡Corte registrado!</h2>
                  {service && (
                    <p className="text-[#a1a1aa] mt-2">
                      {service.name} · {formatPrice(Number(service.price))}
                    </p>
                  )}
                </motion.div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
