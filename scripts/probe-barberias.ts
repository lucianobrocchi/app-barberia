/**
 * Probe: ¿existe la tabla "barberías" (español) o "barbershops" (inglés)?
 * Imprime las columnas reales de la(s) que existan, con una fila de ejemplo.
 * Solo lectura — no modifica nada.
 */
import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(url, key, { auth: { persistSession: false } });

const CANDIDATAS = [
  'barberías',
  'barberias',
  'barbershops',
  'recortes',
  'perfiles',
  'profiles',
  'cuts',
];

async function run() {
  for (const tabla of CANDIDATAS) {
    const { data, error } = await supabase.from(tabla).select('*').limit(1);
    if (error) {
      console.log(`❌ "${tabla}" → NO accesible: ${error.message}`);
    } else {
      console.log(`✅ "${tabla}" EXISTE — ${data.length} fila(s) de muestra`);
      if (data.length > 0) {
        console.log(`   Columnas: ${Object.keys(data[0]).join(', ')}`);
        console.log(`   Ejemplo:`, JSON.stringify(data[0], null, 2).split('\n').map(l => '   ' + l).join('\n'));
      } else {
        console.log('   (tabla vacía — no puedo inferir columnas desde una fila)');
      }
    }
  }
}

run();
