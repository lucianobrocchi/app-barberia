/** Solo lectura: muestra los precios actuales de los servicios. */
import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const sb = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

const { data } = await sb.from('services').select('name, price, is_active').order('price', { ascending: false });
for (const s of data ?? []) {
  console.log(`${s.is_active ? '✅' : '⛔'} ${s.name}: $${s.price.toLocaleString('es-AR')}`);
}
