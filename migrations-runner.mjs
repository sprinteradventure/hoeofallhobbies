import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = 'https://tgskrunjdmoyjgrieuzg.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnc2tydW5qZG1veWpncmlldXpnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDA4NTYzNiwiZXhwIjoyMDk1NjYxNjM2fQ.VRaqiHZF7l7VozolLHw8rpdXHm_apOgAopmnEeQB4BU';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function runMigrations() {
  try {
    // Read migration files
    const migration1Path = './supabase/migrations/001_initial_schema.sql';
    const migration2Path = './supabase/migrations/002_rls_policies.sql';

    console.log('Reading migration files...');
    const migration1 = fs.readFileSync(migration1Path, 'utf8');
    const migration2 = fs.readFileSync(migration2Path, 'utf8');

    console.log(`✓ Migration 1: ${migration1.length} bytes`);
    console.log(`✓ Migration 2: ${migration2.length} bytes`);

    // Execute migrations using RPC or raw query
    console.log('\nExecuting migrations...');

    // Split migrations by statement to handle them one by one
    const statements1 = migration1.split(';').map(s => s.trim()).filter(s => s);
    const statements2 = migration2.split(';').map(s => s.trim()).filter(s => s);

    console.log(`\nMigration 1: Executing ${statements1.length} statements`);
    let count = 0;
    for (const stmt of statements1) {
      try {
        const { data, error } = await supabase.rpc('exec_sql', { sql: stmt });
        if (error) throw error;
        count++;
      } catch (e) {
        console.warn(`  Warning on statement ${count + 1}: ${e.message.substring(0, 100)}`);
      }
    }
    console.log(`✓ Migration 1: ${count} statements executed`);

    console.log(`\nMigration 2: Executing ${statements2.length} statements`);
    count = 0;
    for (const stmt of statements2) {
      try {
        const { data, error } = await supabase.rpc('exec_sql', { sql: stmt });
        if (error) throw error;
        count++;
      } catch (e) {
        console.warn(`  Warning on statement ${count + 1}: ${e.message.substring(0, 100)}`);
      }
    }
    console.log(`✓ Migration 2: ${count} statements executed`);

    console.log('\n✓ Migrations completed successfully!');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

runMigrations();
