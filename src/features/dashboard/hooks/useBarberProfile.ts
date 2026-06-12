import { useCallback, useEffect, useState } from 'react';
import { startOfDay, endOfDay, subDays } from 'date-fns';
import { supabase } from '@/shared/lib/supabase';
import type { Cut, Service, Profile } from '@/shared/types';
import type { Period } from './usePeriodStats';

type ProfileCut = Cut & { service: Pick<Service, 'id' | 'name'> | null };

export interface ServiceShare {
  serviceId: string;
  name: string;
  count: number;
  pct: number;
}

// Ventana móvil que siempre incluye hoy (igual que el dashboard).
const WINDOW_DAYS: Record<Period, number> = { today: 1, week: 7, month: 30 };

function rangeFor(period: Period): { from: Date; to: Date } {
  const now = new Date();
  return { from: startOfDay(subDays(now, WINDOW_DAYS[period] - 1)), to: endOfDay(now) };
}

export function useBarberProfile(barberId: string | undefined, period: Period) {
  const [barber, setBarber] = useState<Pick<Profile, 'id' | 'full_name' | 'is_active' | 'role'> | null>(null);
  const [cuts, setCuts] = useState<ProfileCut[]>([]);
  const [activeToday, setActiveToday] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!barberId) return;
    setIsLoading(true);
    const { from, to } = rangeFor(period);
    const today = { from: startOfDay(new Date()), to: endOfDay(new Date()) };

    const [profRes, cutsRes, todayRes] = await Promise.all([
      supabase.from('profiles').select('id, full_name, is_active, role').eq('id', barberId).single(),
      supabase
        .from('cuts')
        .select('*, service:services ( id, name )')
        .eq('barber_id', barberId)
        .gte('performed_at', from.toISOString())
        .lte('performed_at', to.toISOString())
        .order('performed_at', { ascending: false }),
      supabase
        .from('cuts')
        .select('id', { count: 'exact', head: true })
        .eq('barber_id', barberId)
        .gte('performed_at', today.from.toISOString())
        .lte('performed_at', today.to.toISOString()),
    ]);

    if (profRes.error) {
      setError(profRes.error.message);
      setIsLoading(false);
      return;
    }
    setBarber(profRes.data as Pick<Profile, 'id' | 'full_name' | 'is_active' | 'role'>);
    setCuts((cutsRes.data ?? []) as unknown as ProfileCut[]);
    setActiveToday((todayRes.count ?? 0) > 0);
    setError(null);
    setIsLoading(false);
  }, [barberId, period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const total = cuts.reduce((s, c) => s + Number(c.price), 0);
  const count = cuts.length;
  const avgTicket = count > 0 ? total / count : 0;
  const commission = total * 0.5;

  // Proporción de servicios (por cantidad de cortes)
  const shareMap = new Map<string, ServiceShare>();
  for (const c of cuts) {
    const id = c.service?.id ?? c.service_id;
    const name = c.service?.name ?? 'Otro';
    const cur = shareMap.get(id) ?? { serviceId: id, name, count: 0, pct: 0 };
    cur.count += 1;
    shareMap.set(id, cur);
  }
  const serviceShare = [...shareMap.values()]
    .map((s) => ({ ...s, pct: count > 0 ? (s.count / count) * 100 : 0 }))
    .sort((a, b) => b.count - a.count);

  return {
    barber,
    cuts,
    activeToday,
    total,
    count,
    avgTicket,
    commission,
    serviceShare,
    isLoading,
    error,
  };
}
