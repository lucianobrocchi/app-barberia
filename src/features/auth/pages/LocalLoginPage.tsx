import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { loginLocal, getBarberiaId, setLocalSession } from '../lib/localAuth';

/**
 * Pantalla de login del LOCAL — aparece ANTES del selector de perfiles.
 * Si ya hay una barbería con sesión iniciada (localStorage), redirige directo
 * al selector de perfiles sin mostrar nada.
 */
export function LocalLoginPage() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Si el local ya tiene sesión, saltear esta pantalla.
  useEffect(() => {
    if (getBarberiaId()) navigate('/', { replace: true });
  }, [navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!usuario || !password || loading) return;
    setError(null);
    setLoading(true);
    try {
      const session = await loginLocal(usuario, password);
      if (session) {
        setLocalSession(session);
        navigate('/', { replace: true });
      } else {
        setError('Usuario o contraseña incorrectos.');
        setLoading(false);
      }
    } catch {
      setError('No se pudo conectar. Probá de nuevo.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white px-5 flex flex-col items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        {/* Logo ADDA: "a." serif con punto teal dentro de un círculo claro */}
        <div className="flex flex-col items-center mb-9">
          <div className="w-20 h-20 rounded-full bg-[#F5F0EB] flex items-center justify-center shadow-lg shadow-black/40">
            <span className="font-display text-5xl leading-none text-[#1a1a1a] tracking-tight">
              a<span className="text-[#00B4B4]">.</span>
            </span>
          </div>
          <h1 className="text-xl font-semibold tracking-[0.3em] text-white mt-5 pl-[0.3em]">
            ADDA APP
          </h1>
          <p className="text-sm text-[#a1a1aa] mt-2 text-center">
            Ingresá con los datos de tu local
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <input
            autoFocus
            type="text"
            autoCapitalize="none"
            autoCorrect="off"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            placeholder="Usuario"
            className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-white/[0.04] text-white placeholder:text-[#a1a1aa] focus:outline-none focus:border-[#C9A84C] transition-colors"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-white/[0.04] text-white placeholder:text-[#a1a1aa] focus:outline-none focus:border-[#C9A84C] transition-colors"
          />

          {error && <p className="text-sm text-red-400 text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading || !usuario || !password}
            className="w-full min-h-[52px] flex items-center justify-center gap-2 bg-gradient-to-br from-[#E0C766] to-[#A8842F] text-[#0a0a0a] font-semibold rounded-2xl shadow-lg shadow-[#C9A84C]/20 hover:opacity-95 active:scale-95 disabled:opacity-50 transition-all mt-1"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-[#0a0a0a] border-t-transparent rounded-full animate-spin" />
            ) : (
              'Entrar'
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
