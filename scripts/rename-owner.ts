/** Renombra al dueño a "Juani Bacano" en profiles.full_name. */
import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const sb = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

const OWNER_ID = '8c00c074-728c-444a-8fef-dd80a66eda3f';
const { error } = await sb.from('profiles').update({ full_name: 'Juani Bacano' }).eq('id', OWNER_ID);
console.log(error ? `❌ ${error.message}` : '✅ Dueño renombrado a "Juani Bacano"');
