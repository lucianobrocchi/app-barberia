/** Solo lectura: estado actual para planificar multi-local. */
import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const sb = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

console.log('═══ BARBERSHOPS (todas las columnas) ═══');
const { data: shops } = await sb.from('barbershops').select('*');
for (const s of shops ?? []) console.log(JSON.stringify(s));

console.log('\n═══ PROFILES (id, nombre, rol, barbershop_id, activo) ═══');
const { data: profs } = await sb.from('profiles').select('id, full_name, role, barbershop_id, is_active').order('role');
for (const p of profs ?? []) console.log(`${p.role.padEnd(6)} | ${p.full_name.padEnd(16)} | shop=${p.barbershop_id} | ${p.is_active ? 'activo' : 'inactivo'}`);

console.log('\n═══ SERVICES del local actual ═══');
const { data: svcs } = await sb.from('services').select('name, price, duration_minutes, is_active, display_order, barbershop_id').order('display_order');
for (const s of svcs ?? []) console.log(`${s.is_active ? '✅' : '⛔'} ${s.name.padEnd(18)} $${s.price} | ${s.duration_minutes}min | order=${s.display_order} | shop=${s.barbershop_id}`);
