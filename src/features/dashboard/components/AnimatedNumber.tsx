import { useEffect, useRef, useState } from 'react';

interface AnimatedNumberProps {
  value: number;
  /** Cómo formatear el número mostrado (ej: formatPrice). */
  format?: (n: number) => string;
  durationMs?: number;
  className?: string;
}

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

/** Cuenta de 0 (o del valor anterior) hasta `value` con easing ease-out. */
export function AnimatedNumber({
  value,
  format = (n) => String(Math.round(n)),
  durationMs = 800,
  className,
}: AnimatedNumberProps) {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    // Si la pestaña está oculta, requestAnimationFrame no corre: mostramos
    // el valor final directo (evita que el número quede pegado en 0).
    if (typeof document !== 'undefined' && document.hidden) {
      fromRef.current = value;
      setDisplay(value);
      return;
    }

    const from = fromRef.current;
    const start = performance.now();

    function tick(now: number) {
      const t = Math.min((now - start) / durationMs, 1);
      const current = from + (value - from) * easeOut(t);
      setDisplay(current);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = value;
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    // Red de seguridad: los setTimeout sí disparan con la pestaña en segundo
    // plano, así que garantizamos el valor final aunque rAF se frene.
    const safety = window.setTimeout(() => {
      fromRef.current = value;
      setDisplay(value);
    }, durationMs + 150);

    return () => {
      cancelAnimationFrame(rafRef.current);
      clearTimeout(safety);
    };
  }, [value, durationMs]);

  return <span className={className}>{format(display)}</span>;
}
