import { useEffect, useState } from 'react';
import { Scissors } from 'lucide-react';
import { supabase } from '@/shared/lib/supabase';
import { formatPrice } from '@/shared/lib/utils';
import type { Service } from '@/shared/types';

interface StepServiceProps {
  barbershopId: string;
  selectedId: string | null;
  onSelect: (service: Service) => void;
}

export function StepService({ barbershopId, selectedId, onSelect }: StepServiceProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('services')
      .select('*')
      .eq('barbershop_id', barbershopId)
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .then(({ data }) => {
        if (cancelled) return;
        setServices(data ?? []);
        setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [barbershopId]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-6 h-6 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {services.map((s) => {
        const selected = s.id === selectedId;
        return (
          <button
            key={s.id}
            onClick={() => onSelect(s)}
            className={`w-full min-h-[56px] flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl border text-left active:scale-95 transition-all ${
              selected
                ? 'border-[#C9A84C] bg-[#C9A84C]/10'
                : 'border-white/10 bg-white/[0.03] hover:border-white/20'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  selected ? 'bg-[#C9A84C]' : 'bg-white/5'
                }`}
              >
                <Scissors className={`w-5 h-5 ${selected ? 'text-[#0a0a0a]' : 'text-[#C9A84C]'}`} />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-white truncate">{s.name}</p>
                <p className="text-xs text-[#a1a1aa]">{s.duration_minutes} min</p>
              </div>
            </div>
            <span className="font-semibold text-white shrink-0 tabular-nums">
              {formatPrice(Number(s.price))}
            </span>
          </button>
        );
      })}
    </div>
  );
}
