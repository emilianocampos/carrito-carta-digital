import fs from 'fs';

const supabaseUrl = 'https://ipypgjhajmqlvlxpevga.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlweXBnamhham1xbHZseHBldmdhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODQ1NjI5NCwiZXhwIjoyMTA0MDMyMjk0fQ.dDQTYaYKMUVuOXB4xF71y79G24sm8hiQ3RrvkKeMxPU';

async function testEndpoints() {
  // Test pg/query or rpc endpoints
  const sql = `SELECT 1;`;
  
  // Test 1: rpc/exec_sql or rpc/exec
  for (const fn of ['exec_sql', 'execute_sql', 'exec', 'run_sql']) {
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/rpc/${fn}`, {
        method: 'POST',
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: sql, sql: sql })
      });
      console.log(`RPC ${fn}:`, res.status, await res.text());
    } catch (e) {
      console.log(`RPC ${fn} error:`, e.message);
    }
  }

  // Test 2: pg endpoint
  try {
    const res = await fetch(`${supabaseUrl}/pg/query`, {
      method: 'POST',
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: sql })
    });
    console.log(`pg/query:`, res.status, await res.text());
  } catch (e) {
    console.log(`pg/query error:`, e.message);
  }
}

testEndpoints();
