import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Scissors, Crown, Lock, X, LogOut, HelpCircle } from 'lucide-react';
import { supabase } from '@/shared/lib/supabase';
import { useAuthStore } from '../hooks/useAuthStore';
import { getLocalSession, clearBarberiaId, type LocalSession } from '../lib/localAuth';
import { BrandLogo } from '@/shared/components/BrandLogo';
import { Onboarding } from '@/features/onboarding/Onboarding';
import { hasSeenOnboarding } from '@/features/onboarding/onboardingState';
import { PinKeypad } from '../components/PinKeypad';
import { verifyPin } from '../lib/pin';
import { initials, colorForId } from '@/shared/lib/utils';
import type { Profile } from '@/shared/types';

/** Perfil para el selector, traído de barberos_para_login_v2 (sin pin_hash). */
interface LoginProfile {
  id: string;
  full_name: string;
  role: 'owner' | 'barber';
  is_active: boolean;
  email: string;
}

export function ProfilePickerPage() {
  const navigate = useNavigate();
  const { setUser, setProfile, setLoading } = useAuthStore();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Sesión del local (id + clave interna + marca). Sin ella, al login del local.
  const [session] = useState<LocalSession | null>(() => getLocalSession());

  // Perfiles de ESTA barbería, desde la base.
  const [profiles, setProfiles] = useState<LoginProfile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);

  // Onboarding: se muestra solo la primera vez. Reabrible desde "¿Cómo funciona?".
  const [showOnboarding, setShowOnboarding] = useState(() => !hasSeenOnboarding());

  // Modal de contraseña del dueño
  const [ownerModal, setOwnerModal] = useState(false);
  const [ownerPassword, setOwnerPassword] = useState('');
  const [ownerError, setOwnerError] = useState<string | null>(null);
  const [ownerLoading, setOwnerLoading] = useState(false);

  // Modal de PIN del barbero (solo si tiene PIN configurado)
  const [pinBarber, setPinBarber] = useState<{ profile: LoginProfile; uid: string; hash: string } | null>(null);
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinReset, setPinReset] = useState(0);
  const [pinChecking, setPinChecking] = useState(false);

  // Guard: si el local no tiene sesión iniciada, volver al login del local.
  useEffect(() => {
    if (!session) navigate('/local', { replace: true });
  }, [session, navigate]);

  function logoutLocal() {
    clearBarberiaId();
    navigate('/local', { replace: true });
  }

  // Carga los perfiles de la barbería logueada.
  useEffect(() => {
    if (!session) return;
    setLoadingProfiles(true);
    supabase
      .rpc('barberos_para_login_v2', { p_barbershop_id: session.id })
      .then(({ data, error }) => {
        if (error) {
          setError('No se pudieron cargar los perfiles.');
        } else {
          setProfiles((data ?? []) as LoginProfile[]);
        }
        setLoadingProfiles(false);
      });
  }, [session]);

  const owner = profiles.find((p) => p.role === 'owner');
  const barbers = profiles.filter((p) => p.role === 'barber' && p.is_active);

  // Deja el estado de auth listo ANTES de navegar, para que el guardián de
  // rutas no vea estado viejo y rebote (evita el "hay que tocar dos veces").
  async function hydrateAndGo(userId: string, to: string) {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    setUser(user);
    setProfile(profile as Profile | null);
    setLoading(false);
    navigate(to, { replace: true });
  }

  // Barberos: un toque. Si tiene PIN configurado, pedimos PIN antes de entrar.
  async function pickBarber(p: LoginProfile) {
    if (!session) return;
    setError(null);
    setLoadingId(p.id);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: p.email,
        password: session.appPassword,
      });
      if (error) throw error;
      const uid = data.user!.id;

      const { data: profile } = await supabase.from('profiles').select('*').eq('id', uid).single();
      const pinHash = (profile as Profile & { pin_hash?: string | null })?.pin_hash;

      if (pinHash) {
        // Tiene PIN: queda autenticado pero no navegamos hasta validar el PIN.
        setPinBarber({ profile: p, uid, hash: pinHash });
        setPinError(null);
        setPinReset((n) => n + 1);
        setLoadingId(null);
      } else {
        await hydrateAndGo(uid, '/barber');
      }
    } catch {
      setError(`No se pudo entrar como ${p.full_name}.`);
      setLoadingId(null);
    }
  }

  async function onPinComplete(pin: string) {
    if (!pinBarber) return;
    setPinChecking(true);
    setPinError(null);
    const ok = await verifyPin(pin, pinBarber.hash);
    if (ok) {
      await hydrateAndGo(pinBarber.uid, '/barber');
    } else {
      setPinError('PIN incorrecto');
      setPinReset((n) => n + 1);
      setPinChecking(false);
    }
  }

  async function closePinModal() {
    // Cerró sin validar el PIN: deshacemos el login silencioso.
    await supabase.auth.signOut();
    setPinBarber(null);
    setPinError(null);
    setPinChecking(false);
  }

  // Dueño: requiere contraseña
  async function submitOwner(e: React.FormEvent) {
    e.preventDefault();
    if (!owner || !ownerPassword) return;
    setOwnerError(null);
    setOwnerLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: owner.email,
        password: ownerPassword,
      });
      if (error) throw error;
      await hydrateAndGo(data.user!.id, '/dashboard');
    } catch {
      setOwnerError('Contraseña incorrecta.');
      setOwnerLoading(false);
    }
  }

  function closeOwnerModal() {
    setOwnerModal(false);
    setOwnerPassword('');
    setOwnerError(null);
    setOwnerLoading(false);
  }

  const brandName = session?.name?.replace(/^barber[ií]a\s+/i, '') || session?.name || 'Barbería';

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white px-5 py-10">
      <div className="max-w-md mx-auto">
        {/* Marca */}
        <div className="flex flex-col items-center mb-10">
          <BrandLogo className="w-16 h-16 mb-4" src={session?.logoUrl ?? undefined} />
          <p className="text-[11px] tracking-[0.35em] text-[#C9A84C] font-medium pl-[0.35em]">BARBERÍA</p>
          <h1 className="font-display text-4xl text-white leading-none mt-0.5">{brandName}</h1>
          <p className="text-sm text-[#a1a1aa] mt-4">¿Quién sos? Elegí tu perfil</p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm text-center">
            {error}
          </div>
        )}

        {loadingProfiles ? (
          <div className="flex justify-center py-16">
            <div className="w-7 h-7 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Dueño */}
            {owner && (
              <div className="mb-8">
                <p className="text-xs font-medium text-[#a1a1aa] mb-3 flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5 text-[#C9A84C]" /> Dueño
                </p>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setOwnerModal(true)}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl border border-white/10 bg-white/[0.03] hover:border-white/20 transition-colors"
                >
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center font-semibold text-lg shrink-0"
                    style={{ backgroundColor: '#C9A84C', color: '#0a0a0a' }}
                  >
                    {initials(owner.full_name)}
                  </div>
                  <div className="text-left min-w-0 flex-1">
                    <p className="font-medium text-white text-base truncate">{owner.full_name}</p>
                    <p className="text-xs text-[#a1a1aa]">Ver panel del dueño</p>
                  </div>
                  <Lock className="w-4 h-4 text-[#a1a1aa] shrink-0" />
                </motion.button>
              </div>
            )}

            {/* Barberos */}
            <div>
              <p className="text-xs font-medium text-[#a1a1aa] mb-3 flex items-center gap-1.5">
                <Scissors className="w-3.5 h-3.5" /> Barberos
              </p>
              <div className="grid grid-cols-3 gap-3">
                {barbers.map((b) => (
                  <motion.button
                    key={b.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => pickBarber(b)}
                    disabled={loadingId !== null}
                    className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-white/10 bg-white/[0.03] hover:border-white/20 disabled:opacity-50 transition-colors"
                  >
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center font-semibold text-xl shrink-0 text-white"
                      style={{ backgroundColor: colorForId(b.id) }}
                    >
                      {loadingId === b.id ? (
                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        initials(b.full_name)
                      )}
                    </div>
                    <p className="font-medium text-white text-xs truncate w-full text-center">
                      {b.full_name.split(' ')[0]}
                    </p>
                  </motion.button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Acciones discretas: ayuda + cerrar sesión del local */}
        <div className="mt-12 flex items-center justify-center gap-5">
          <button
            onClick={() => setShowOnboarding(true)}
            className="flex items-center gap-1.5 text-xs text-[#6b6b72] hover:text-[#a1a1aa] transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            ¿Cómo funciona?
          </button>
          <span className="w-px h-3 bg-white/10" />
          <button
            onClick={logoutLocal}
            className="flex items-center gap-1.5 text-xs text-[#6b6b72] hover:text-[#a1a1aa] transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Cerrar sesión del local
          </button>
        </div>
      </div>

      <Onboarding open={showOnboarding} onClose={() => setShowOnboarding(false)} />

      {/* Modal PIN del barbero */}
      <AnimatePresence>
        {pinBarber && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-4"
            onClick={closePinModal}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#1a1a1a] p-6 pb-8 mb-4 sm:mb-0"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center font-semibold shrink-0 text-white"
                    style={{ backgroundColor: colorForId(pinBarber.profile.id) }}
                  >
                    {initials(pinBarber.profile.full_name)}
                  </div>
                  <p className="font-medium text-white">{pinBarber.profile.full_name.split(' ')[0]}</p>
                </div>
                <button
                  onClick={closePinModal}
                  className="p-2 rounded-xl text-[#a1a1aa] hover:text-white hover:bg-white/5 transition-colors"
                  aria-label="Cerrar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <PinKeypad
                title="Ingresá tu PIN"
                subtitle="4 dígitos"
                onComplete={onPinComplete}
                error={pinError}
                resetSignal={pinReset}
                disabled={pinChecking}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal contraseña del dueño */}
      <AnimatePresence>
        {ownerModal && owner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-4"
            onClick={closeOwnerModal}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#141414] p-6 mb-4 sm:mb-0"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center font-semibold shrink-0"
                    style={{ backgroundColor: '#C9A84C', color: '#0a0a0a' }}
                  >
                    {initials(owner.full_name)}
                  </div>
                  <div>
                    <p className="font-medium text-white">{owner.full_name}</p>
                    <p className="text-xs text-[#a1a1aa]">Ingresá tu contraseña</p>
                  </div>
                </div>
                <button
                  onClick={closeOwnerModal}
                  className="p-2 rounded-xl text-[#a1a1aa] hover:text-white hover:bg-white/5 transition-colors"
                  aria-label="Cerrar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={submitOwner} className="space-y-4">
                <input
                  autoFocus
                  type="password"
                  value={ownerPassword}
                  onChange={(e) => setOwnerPassword(e.target.value)}
                  placeholder="Contraseña"
                  className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-white/[0.04] text-white placeholder:text-[#a1a1aa] focus:outline-none focus:border-[#C9A84C] transition-colors"
                />

                {ownerError && <p className="text-sm text-red-400">{ownerError}</p>}

                <button
                  type="submit"
                  disabled={ownerLoading || !ownerPassword}
                  className="w-full min-h-[52px] flex items-center justify-center gap-2 bg-gradient-to-br from-[#E0C766] to-[#A8842F] text-[#0a0a0a] font-semibold rounded-2xl shadow-lg shadow-[#C9A84C]/20 hover:opacity-95 active:scale-95 disabled:opacity-50 transition-all"
                >
                  {ownerLoading ? (
                    <span className="w-5 h-5 border-2 border-[#0a0a0a] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Entrar'
                  )}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
