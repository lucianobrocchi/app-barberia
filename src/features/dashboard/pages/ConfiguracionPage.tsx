import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Settings, Check, X, ShieldCheck, ShieldOff, Users, Scissors, Plus, Pencil } from 'lucide-react';
import { supabase } from '@/shared/lib/supabase';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { DEMO_USERS, initials } from '@/features/auth/data/demoUsers';
import { PinKeypad } from '@/features/auth/components/PinKeypad';
import { hashPin } from '@/features/auth/lib/pin';

interface BarberRow {
  id: string;
  full_name: string;
  pin_hash: string | null;
  is_active: boolean;
}
interface ServiceRow {
  id: string;
  name: string;
  price: number;
  is_active: boolean;
  display_order: number;
}

function colorForName(name: string): string {
  return DEMO_USERS.find((u) => u.name === name)?.color ?? '#C9A84C';
}

export function ConfiguracionPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [barbers, setBarbers] = useState<BarberRow[]>([]);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // PIN modal
  const [editing, setEditing] = useState<BarberRow | null>(null);
  const [phase, setPhase] = useState<'enter' | 'confirm'>('enter');
  const [firstPin, setFirstPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinReset, setPinReset] = useState(0);
  const [saving, setSaving] = useState(false);

  // Editar nombre del barbero
  const [editName, setEditName] = useState<BarberRow | null>(null);
  const [nameValue, setNameValue] = useState('');
  const [savingName, setSavingName] = useState(false);

  // Edición de precios + alta de servicio
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');

  const fetchAll = useCallback(async () => {
    if (!profile?.barbershop_id) return;
    setLoading(true);
    const [bRes, sRes] = await Promise.all([
      supabase.from('profiles').select('id, full_name, pin_hash, is_active').eq('barbershop_id', profile.barbershop_id).eq('role', 'barber').order('full_name'),
      supabase.from('services').select('id, name, price, is_active, display_order').eq('barbershop_id', profile.barbershop_id).order('display_order'),
    ]);
    if (bRes.error) {
      setLoadError(bRes.error.message);
    } else {
      setBarbers((bRes.data ?? []) as BarberRow[]);
      setServices((sRes.data ?? []) as ServiceRow[]);
      setDrafts(Object.fromEntries((sRes.data ?? []).map((s) => [s.id, String(s.price)])));
      setLoadError(null);
    }
    setLoading(false);
  }, [profile?.barbershop_id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Barberos: editar nombre (se va uno, viene otro → mismo perfil, nuevo nombre) ──
  function openName(b: BarberRow) { setEditName(b); setNameValue(b.full_name); setSavingName(false); }
  async function saveName() {
    if (!editName) return;
    const name = nameValue.trim();
    if (!name || name === editName.full_name) { setEditName(null); return; }
    setSavingName(true);
    await supabase.from('profiles').update({ full_name: name }).eq('id', editName.id);
    setEditName(null);
    await fetchAll();
  }

  // ── Barberos: activar / desactivar ──
  async function toggleBarber(b: BarberRow) {
    setBusyId(b.id);
    await supabase.from('profiles').update({ is_active: !b.is_active }).eq('id', b.id);
    await fetchAll();
    setBusyId(null);
  }

  // ── Servicios ──
  async function toggleService(s: ServiceRow) {
    setBusyId(s.id);
    await supabase.from('services').update({ is_active: !s.is_active }).eq('id', s.id);
    await fetchAll();
    setBusyId(null);
  }
  async function savePrice(s: ServiceRow) {
    const val = Math.round(Number(drafts[s.id]));
    if (!Number.isFinite(val) || val <= 0 || val === s.price) return;
    setBusyId(s.id);
    await supabase.from('services').update({ price: val }).eq('id', s.id);
    await fetchAll();
    setBusyId(null);
  }
  async function addService() {
    const name = newName.trim();
    const price = Math.round(Number(newPrice));
    if (!name || !Number.isFinite(price) || price <= 0 || !profile?.barbershop_id) return;
    setBusyId('new');
    await supabase.from('services').insert({
      barbershop_id: profile.barbershop_id,
      name,
      price,
      duration_minutes: 30,
      is_active: true,
      display_order: services.length + 1,
    });
    setNewName(''); setNewPrice(''); setAdding(false);
    await fetchAll();
    setBusyId(null);
  }

  // ── PIN ──
  function openEdit(b: BarberRow) { setEditing(b); setPhase('enter'); setFirstPin(''); setPinError(null); setPinReset((n) => n + 1); setSaving(false); }
  function closeEdit() { setEditing(null); setFirstPin(''); setPinError(null); setSaving(false); }
  async function onPinComplete(pin: string) {
    if (!editing) return;
    if (phase === 'enter') { setFirstPin(pin); setPhase('confirm'); setPinError(null); setPinReset((n) => n + 1); return; }
    if (pin !== firstPin) { setPhase('enter'); setFirstPin(''); setPinError('No coincide, empezá de nuevo'); setPinReset((n) => n + 1); return; }
    setSaving(true); setPinError(null);
    const pin_hash = await hashPin(pin);
    const { error } = await supabase.from('profiles').update({ pin_hash }).eq('id', editing.id);
    if (error) { setPinError('No se pudo guardar: ' + error.message); setSaving(false); setPhase('enter'); setFirstPin(''); setPinReset((n) => n + 1); return; }
    await fetchAll();
    closeEdit();
  }

  const pill = 'px-3 py-1.5 rounded-lg text-xs font-medium border active:scale-95 transition-all disabled:opacity-50';

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-16">
      <header className="px-5 py-5 border-b border-white/10 sticky top-0 bg-[#0a0a0a]/90 backdrop-blur z-20">
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-1.5 text-sm text-[#a1a1aa] hover:text-white transition-colors mb-3">
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>
        <h1 className="text-lg font-semibold flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#C9A84C]" /> Administración
        </h1>
        <p className="text-sm text-[#a1a1aa] mt-1">Equipo, PINs, precios y servicios.</p>
      </header>

      <main className="px-5 pt-5 max-w-2xl mx-auto w-full space-y-8">
        {loading ? (
          <div className="flex justify-center py-20"><div className="w-7 h-7 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" /></div>
        ) : loadError ? (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
            No se pudo cargar. Quizás falta correr <code className="text-red-200">scripts/migration-paso5.sql</code>.
            <p className="text-xs text-red-400/80 mt-2">{loadError}</p>
          </div>
        ) : (
          <>
            {/* ── EQUIPO ── */}
            <section className="space-y-2.5">
              <h2 className="flex items-center gap-2 text-sm font-medium text-[#a1a1aa]"><Users className="w-4 h-4" /> Equipo</h2>
              {barbers.map((b) => {
                const hasPin = !!b.pin_hash;
                return (
                  <div key={b.id} className={`flex items-center gap-3 p-4 rounded-2xl border border-white/10 bg-white/[0.03] ${b.is_active ? '' : 'opacity-60'}`}>
                    <div className="w-11 h-11 rounded-full flex items-center justify-center font-semibold shrink-0 text-white" style={{ backgroundColor: colorForName(b.full_name) }}>
                      {initials(b.full_name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <button onClick={() => openName(b)} className="flex items-center gap-1.5 group max-w-full">
                        <span className="font-medium text-white truncate group-hover:text-[#C9A84C] transition-colors">{b.full_name}</span>
                        <Pencil className="w-3 h-3 text-[#71717a] group-hover:text-[#C9A84C] shrink-0" />
                      </button>
                      <span className={`text-xs flex items-center gap-1 ${hasPin ? 'text-green-400' : 'text-[#a1a1aa]'}`}>
                        {hasPin ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldOff className="w-3.5 h-3.5" />}
                        {hasPin ? 'PIN configurado' : 'Sin PIN'}{b.is_active ? '' : ' · Inactivo'}
                      </span>
                    </div>
                    <button onClick={() => openEdit(b)} className={`${pill} bg-[#C9A84C]/10 text-[#C9A84C] border-[#C9A84C]/30 hover:bg-[#C9A84C]/20`}>
                      PIN
                    </button>
                    <button onClick={() => toggleBarber(b)} disabled={busyId === b.id} className={`${pill} ${b.is_active ? 'bg-white/5 text-[#a1a1aa] border-white/10 hover:text-white' : 'bg-green-500/10 text-green-400 border-green-500/30'}`}>
                      {b.is_active ? 'Desactivar' : 'Activar'}
                    </button>
                  </div>
                );
              })}
              <p className="text-xs text-[#71717a] pt-1">Desactivar conserva su historial y estadísticas (no se borra).</p>
            </section>

            {/* ── SERVICIOS ── */}
            <section className="space-y-2.5">
              <h2 className="flex items-center gap-2 text-sm font-medium text-[#a1a1aa]"><Scissors className="w-4 h-4" /> Servicios y precios</h2>
              {services.map((s) => {
                const changed = drafts[s.id] !== undefined && Math.round(Number(drafts[s.id])) !== s.price && Number(drafts[s.id]) > 0;
                return (
                  <div key={s.id} className={`flex items-center gap-3 p-4 rounded-2xl border border-white/10 bg-white/[0.03] ${s.is_active ? '' : 'opacity-60'}`}>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-white truncate">{s.name}{s.is_active ? '' : ' · Inactivo'}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[#a1a1aa] text-sm">$</span>
                      <input
                        type="number"
                        value={drafts[s.id] ?? ''}
                        onChange={(e) => setDrafts((d) => ({ ...d, [s.id]: e.target.value }))}
                        className="w-20 px-2 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-white text-sm text-right tabular-nums focus:outline-none focus:border-[#C9A84C]"
                      />
                    </div>
                    {changed ? (
                      <button onClick={() => savePrice(s)} disabled={busyId === s.id} className={`${pill} bg-[#C9A84C] text-[#0a0a0a] border-transparent`}>Guardar</button>
                    ) : (
                      <button onClick={() => toggleService(s)} disabled={busyId === s.id} className={`${pill} ${s.is_active ? 'bg-white/5 text-[#a1a1aa] border-white/10 hover:text-white' : 'bg-green-500/10 text-green-400 border-green-500/30'}`}>
                        {s.is_active ? 'Ocultar' : 'Activar'}
                      </button>
                    )}
                  </div>
                );
              })}

              {/* Agregar servicio */}
              {adding ? (
                <div className="flex items-center gap-2 p-4 rounded-2xl border border-[#C9A84C]/30 bg-[#C9A84C]/[0.05]">
                  <input autoFocus value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nombre del servicio" className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/10 text-white text-sm focus:outline-none focus:border-[#C9A84C]" />
                  <input type="number" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} placeholder="$" className="w-20 px-2 py-2 rounded-lg bg-white/[0.04] border border-white/10 text-white text-sm text-right tabular-nums focus:outline-none focus:border-[#C9A84C]" />
                  <button onClick={addService} disabled={busyId === 'new'} className={`${pill} bg-[#C9A84C] text-[#0a0a0a] border-transparent`}>Agregar</button>
                  <button onClick={() => { setAdding(false); setNewName(''); setNewPrice(''); }} className="p-2 text-[#a1a1aa] hover:text-white"><X className="w-4 h-4" /></button>
                </div>
              ) : (
                <button onClick={() => setAdding(true)} className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl border border-dashed border-white/15 text-[#a1a1aa] hover:text-white hover:border-white/30 transition-colors text-sm font-medium">
                  <Plus className="w-4 h-4" /> Agregar servicio
                </button>
              )}
            </section>
          </>
        )}
      </main>

      {/* Modal editar nombre */}
      <AnimatePresence>
        {editName && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-4" onClick={() => setEditName(null)}>
            <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 28 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#1a1a1a] p-6 mb-4 sm:mb-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-medium text-white">Editar nombre</h3>
                <button onClick={() => setEditName(null)} className="p-2 rounded-xl text-[#a1a1aa] hover:text-white hover:bg-white/5 transition-colors" aria-label="Cerrar"><X className="w-5 h-5" /></button>
              </div>
              <p className="text-xs text-[#a1a1aa] mb-4">Si entra otra persona, cambiá el nombre acá: usa el mismo acceso y el historial queda intacto.</p>
              <input
                autoFocus
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') saveName(); }}
                placeholder="Nombre del barbero"
                className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-white/[0.04] text-white placeholder:text-[#71717a] focus:outline-none focus:border-[#C9A84C] transition-colors mb-4"
              />
              <button onClick={saveName} disabled={savingName || !nameValue.trim()} className="w-full min-h-[48px] flex items-center justify-center gap-2 bg-gradient-to-br from-[#E0C766] to-[#A8842F] text-[#0a0a0a] font-semibold rounded-2xl shadow-lg shadow-[#C9A84C]/20 hover:opacity-95 active:scale-95 disabled:opacity-50 transition-all">
                {savingName ? <span className="w-5 h-5 border-2 border-[#0a0a0a] border-t-transparent rounded-full animate-spin" /> : 'Guardar'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de PIN */}
      <AnimatePresence>
        {editing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-4" onClick={closeEdit}>
            <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 28 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#1a1a1a] p-6 pb-8 mb-4 sm:mb-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold shrink-0 text-white" style={{ backgroundColor: colorForName(editing.full_name) }}>{initials(editing.full_name)}</div>
                  <p className="font-medium text-white">{editing.full_name.split(' ')[0]}</p>
                </div>
                <button onClick={closeEdit} className="p-2 rounded-xl text-[#a1a1aa] hover:text-white hover:bg-white/5 transition-colors" aria-label="Cerrar"><X className="w-5 h-5" /></button>
              </div>
              <PinKeypad title={phase === 'enter' ? 'Nuevo PIN' : 'Repetí el PIN'} subtitle={phase === 'enter' ? '4 dígitos' : 'Confirmá para guardar'} onComplete={onPinComplete} error={pinError} resetSignal={pinReset} disabled={saving} />
              {phase === 'confirm' && !pinError && !saving && (
                <p className="text-center text-xs text-[#C9A84C] flex items-center justify-center gap-1 mt-2"><Check className="w-3.5 h-3.5" /> Ingresá el mismo PIN otra vez</p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
