import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ipypgjhajmqlvlxpevga.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlweXBnamhham1xbHZseHBldmdhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODQ1NjI5NCwiZXhwIjoyMTA0MDMyMjk0fQ.dDQTYaYKMUVuOXB4xF71y79G24sm8hiQ3RrvkKeMxPU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log('--- Checking tables & columns ---');
  
  // 1. Check products columns
  const { data: prodData, error: prodErr } = await supabase
    .from('products')
    .select('id, name, is_combo, original_price')
    .limit(1);
  console.log('Products check:', prodErr ? `Error: ${prodErr.message}` : `Success (${prodData.length} records)`);

  // 2. Check product_combo_items
  const { data: comboData, error: comboErr } = await supabase
    .from('product_combo_items')
    .select('*')
    .limit(1);
  console.log('Product combo items check:', comboErr ? `Error: ${comboErr.message}` : `Success (${comboData.length} records)`);

  // 3. Check tenant_settings
  const { data: settData, error: settErr } = await supabase
    .from('tenant_settings')
    .select('id, card_style, slogan')
    .limit(1);
  console.log('Tenant settings check:', settErr ? `Error: ${settErr.message}` : `Success (${settData.length} records)`);

  // 4. Check raffles
  const { data: raffleData, error: raffleErr } = await supabase
    .from('raffles')
    .select('*')
    .limit(1);
  console.log('Raffles check:', raffleErr ? `Error: ${raffleErr.message}` : `Success (${raffleData.length} records)`);

  // 5. Check raffle_entries
  const { data: entriesData, error: entriesErr } = await supabase
    .from('raffle_entries')
    .select('*')
    .limit(1);
  console.log('Raffle entries check:', entriesErr ? `Error: ${entriesErr.message}` : `Success (${entriesData.length} records)`);

  // 6. Check storage bucket 'menu-assets'
  const { data: buckets, error: bucketErr } = await supabase.storage.listBuckets();
  if (bucketErr) {
    console.log('Buckets check Error:', bucketErr.message);
  } else {
    const found = buckets.find(b => b.name === 'menu-assets');
    console.log('menu-assets bucket exists:', !!found, buckets.map(b => b.name));
    if (!found) {
      console.log('Creating menu-assets bucket...');
      const { data: bData, error: bErr } = await supabase.storage.createBucket('menu-assets', {
        public: true,
        fileSizeLimit: 10485760,
      });
      console.log('Created bucket result:', bErr ? bErr.message : 'Created successfully');
    }
  }
}

check();
