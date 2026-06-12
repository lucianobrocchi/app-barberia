import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Delete } from 'lucide-react';

interface PinKeypadProps {
  /** Se llama cuando se completan los 4 dígitos. */
  onComplete: (pin: string) => void;
  /** Mensaje de error: dispara shake + limpia los puntos. */
  error?: string | null;
  /** Cambiá este número para limpiar el PIN desde afuera. */
  resetSignal?: number;
  /** Deshabilita el teclado (mientras valida). */
  disabled?: boolean;
  title?: string;
  subtitle?: string;
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

export function PinKeypad({
  onComplete,
  error,
  resetSignal = 0,
  disabled = false,
  title,
  subtitle,
}: PinKeypadProps) {
  const [pin, setPin] = useState('');

  // Limpiar cuando el padre lo pide (p.ej. tras un PIN incorrecto).
  useEffect(() => {
    setPin('');
  }, [resetSignal]);

  // Al llegar a 4 dígitos, avisar al padre.
  useEffect(() => {
    if (pin.length === 4) onComplete(pin);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  function press(d: string) {
    if (disabled) return;
    setPin((p) => (p.length >= 4 ? p : p + d));
  }

  function backspace() {
    if (disabled) return;
    setPin((p) => p.slice(0, -1));
  }

  return (
    <div className="flex flex-col items-center">
      {title && <p className="text-lg font-semibold text-white">{title}</p>}
      {subtitle && <p className="text-sm text-[#a1a1aa] mt-1">{subtitle}</p>}

      {/* 4 puntos */}
      <motion.div
        className="flex gap-4 my-7"
        animate={error ? { x: [0, -10, 10, -8, 8, -4, 4, 0] } : { x: 0 }}
        transition={{ duration: 0.45 }}
      >
        {[0, 1, 2, 3].map((i) => {
          const filled = i < pin.length;
          return (
            <motion.div
              key={i}
              animate={{ scale: filled ? 1 : 0.85 }}
              transition={{ type: 'spring', stiffness: 500, damping: 22 }}
              className={`w-4 h-4 rounded-full border-2 transition-colors ${
                error
                  ? 'border-red-500 bg-red-500'
                  : filled
                  ? 'border-[#C9A84C] bg-[#C9A84C]'
                  : 'border-white/25 bg-transparent'
              }`}
            />
          );
        })}
      </motion.div>

      {/* Mensaje de error */}
      <div className="h-5 mb-2">
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-sm text-red-400"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Teclado */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-[260px]">
        {KEYS.map((k) => (
          <motion.button
            key={k}
            whileTap={{ scale: 0.92 }}
            onClick={() => press(k)}
            disabled={disabled}
            className="h-16 rounded-2xl bg-[#2a2a2a] text-white text-2xl font-medium hover:bg-[#3a3a3a] active:bg-[#3a3a3a] disabled:opacity-40 transition-colors"
          >
            {k}
          </motion.button>
        ))}
        {/* Espaciador */}
        <div />
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => press('0')}
          disabled={disabled}
          className="h-16 rounded-2xl bg-[#2a2a2a] text-white text-2xl font-medium hover:bg-[#3a3a3a] active:bg-[#3a3a3a] disabled:opacity-40 transition-colors"
        >
          0
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={backspace}
          disabled={disabled}
          className="h-16 rounded-2xl bg-transparent text-[#a1a1aa] flex items-center justify-center hover:bg-white/5 disabled:opacity-40 transition-colors"
          aria-label="Borrar"
        >
          <Delete className="w-6 h-6" />
        </motion.button>
      </div>
    </div>
  );
}
