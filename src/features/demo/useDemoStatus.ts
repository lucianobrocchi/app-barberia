import { useCallback, useEffect, useState } from 'react';
import { countDemoCuts } from './demoData';

/** Estado de la demo en una barbería: si hay cortes de demo y cuántos. */
export function useDemoStatus(barbershopId: string | undefined) {
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!barbershopId) return;
    setIsLoading(true);
    try {
      setCount(await countDemoCuts(barbershopId));
    } finally {
      setIsLoading(false);
    }
  }, [barbershopId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { hasDemo: count > 0, count, isLoading, refetch };
}
