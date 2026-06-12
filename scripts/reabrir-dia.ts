/**
 * Borra los cierres de caja de HOY (para poder volver a probar el cierre).
 * Uso: npx tsx scripts/reabrir-dia.ts
 */
import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import { startOfDay, endOfDay } from 'date-fns';

const url = process.env.VITE_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(url, key, { auth: { persistSession: false } });

const BARBERSHOP_ID = '8bc02018-0fa4-41a2-b24d-4d6c375caf3d';

async function run() {
  const now = new Date();
  const { data, error } = await supabase
    .from('cash_register_sessions')
    .delete()
    .eq('barbershop_id', BARBERSHOP_ID)
    .gte('closed_at', startOfDay(now).toISOString())
    .lte('closed_at', endOfDay(now).toISOString())
    .select('id');
  if (error) throw error;
  console.log(`✅ Cierres de hoy borrados: ${data?.length ?? 0}. El día quedó abierto.`);
}

run().catch((e) => { console.error('❌', e.message); process.exit(1); });
