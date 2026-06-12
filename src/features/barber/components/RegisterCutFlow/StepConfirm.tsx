import { Check, AlertCircle, RotateCcw } from 'lucide-react';
import { formatPrice } from '@/shared/lib/utils';
import { PAYMENT_OPTIONS } from './StepPayment';
import type { Service, PaymentMethod } from '@/shared/types';

interface StepConfirmProps {
  service: Service;
  paymentMethod: PaymentMethod;
  isSaving: boolean;
  error: string | null;
  onConfirm: () => void;
}

export function StepConfirm({ service, paymentMethod, isSaving, error, onConfirm }: StepConfirmProps) {
  const paymentLabel = PAYMENT_OPTIONS.find((p) => p.value === paymentMethod)?.label ?? paymentMethod;

  return (
    <div className="space-y-5">
      {/* Resumen */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-[#a1a1aa]">Servicio</span>
          <span className="text-sm font-medium text-white">{service.name}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-[#a1a1aa]">Método de pago</span>
          <span className="text-sm font-medium text-white">{paymentLabel}</span>
        </div>
        <div className="flex items-center justify-between border-t border-white/10 pt-4">
          <span className="text-sm text-[#a1a1aa]">Total</span>
          <span className="text-2xl font-semibold text-[#C9A84C] tabular-nums">
            {formatPrice(Number(service.price))}
          </span>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-red-400">No se pudo registrar el corte</p>
            <p className="text-xs text-red-400/80 mt-0.5 break-words">{error}</p>
          </div>
        </div>
      )}

      <button
        onClick={onConfirm}
        disabled={isSaving}
        className="w-full min-h-[56px] flex items-center justify-center gap-2 bg-[#C9A84C] text-[#0a0a0a] font-semibold rounded-2xl hover:opacity-95 active:scale-95 disabled:opacity-50 transition-all"
      >
        {isSaving ? (
          <>
            <span className="w-5 h-5 border-2 border-[#0a0a0a] border-t-transparent rounded-full animate-spin" />
            Registrando...
          </>
        ) : error ? (
          <>
            <RotateCcw className="w-5 h-5" strokeWidth={2.5} />
            Reintentar
          </>
        ) : (
          <>
            <Check className="w-5 h-5" strokeWidth={2.5} />
            Confirmar corte
          </>
        )}
      </button>
    </div>
  );
}
