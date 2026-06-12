/** Borra todos los cortes de demo (notes='seed-demo-6m'). Reversa de seed-demo-6m.ts */
import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const sb = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});

async function main() {
  const { count: before } = await sb
    .from('cuts')
    .select('id', { count: 'exact', head: true })
    .eq('notes', 'seed-demo-6m');
  console.log(`Cortes de demo a borrar: ${before}`);

  const { error } = await sb.from('cuts').delete().eq('notes', 'seed-demo-6m');
  if (error) throw new Error(error.message);

  const { count: after } = await sb.from('cuts').select('id', { count: 'exact', head: true });
  console.log(`✅ Borrados. Quedan ${after} cortes (los reales).`);
}

main().catch((e) => { console.error('❌', e.message); process.exit(1); });
