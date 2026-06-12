import { useState } from 'react';
import { supabase } from '@/shared/lib/supabase';
import type { PaymentMethod } from '@/shared/types';

export interface RegisterCutInput {
  barbershopId: string;
  barberId: string;
  serviceId: string;
  price: number;
  paymentMethod: PaymentMethod;
}

export function useRegisterCut() {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function registerCut(input: RegisterCutInput): Promise<boolean> {
    setIsSaving(true);
    setError(null);
    const now = new Date().toISOString();

    const { error } = await supabase.from('cuts').insert({
      barbershop_id: input.barbershopId,
      barber_id: input.barberId,
      service_id: input.serviceId,
      price: input.price,
      payment_method: input.paymentMethod,
      performed_at: now,
      created_at: now,
    });

    setIsSaving(false);
    if (error) {
      setError(error.message);
      return false;
    }
    return true;
  }

  return { registerCut, isSaving, error };
}
