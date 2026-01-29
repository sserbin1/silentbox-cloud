// Run Supabase migrations via REST API
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = 'https://ggwdzqcchusaakdpwgzz.supabase.co';
const SERVICE_ROLE_KEY = 'sb_secret_N_1Si-ryM-jZqJO3Jt2BaA_FlBpNkZ-';

const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');

const migrations = [
  '001_initial_schema.sql',
  '002_rls_policies.sql',
  '003_seed_data.sql',
];

async function runMigration(filename) {
  const filepath = path.join(migrationsDir, filename);
  const sql = fs.readFileSync(filepath, 'utf-8');

  console.log(`\n📦 Running migration: ${filename}`);

  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ query: sql }),
  });

  if (!response.ok) {
    // Try direct postgres connection via pg_query if exec_sql doesn't exist
    console.log(`   ⚠️  exec_sql not available, trying alternative...`);
    return false;
  }

  console.log(`   ✅ ${filename} completed`);
  return true;
}

async function main() {
  console.log('🚀 Silentbox Cloud - Database Migrations\n');
  console.log(`Supabase URL: ${SUPABASE_URL}`);

  let allSuccess = true;

  for (const migration of migrations) {
    const success = await runMigration(migration);
    if (!success) {
      allSuccess = false;
      break;
    }
  }

  if (!allSuccess) {
    console.log('\n⚠️  Automatic migration failed.');
    console.log('\n📋 Please run migrations manually:');
    console.log('   1. Open https://supabase.com/dashboard/project/ggwdzqcchusaakdpwgzz');
    console.log('   2. Go to SQL Editor');
    console.log('   3. Copy and run each file from supabase/migrations/ folder');
  } else {
    console.log('\n✅ All migrations completed successfully!');
  }
}

main().catch(console.error);
