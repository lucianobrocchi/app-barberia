import { useState } from 'react';
import { Scissors } from 'lucide-react';

/**
 * Logo de la marca (Barbería Bacano).
 * Usa la imagen en /public/logo-bacano.png. Si todavía no está el archivo,
 * cae al ícono de tijera dorado (look actual) — así nunca se ve roto.
 */
export function BrandLogo({ className = 'w-10 h-10' }: { className?: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={`${className} rounded-full bg-gradient-to-br from-[#E0C766] to-[#A8842F] flex items-center justify-center shadow-md shadow-[#C9A84C]/20 ring-1 ring-white/10`}
      >
        <Scissors className="w-1/2 h-1/2 text-[#0a0a0a]" strokeWidth={2.25} />
      </div>
    );
  }

  return (
    <img
      src="/logo-bacano.jpg"
      alt="Barbería Bacano"
      onError={() => setFailed(true)}
      className={`${className} rounded-full object-cover ring-1 ring-white/10 shadow-md shadow-[#C9A84C]/20`}
    />
  );
}
