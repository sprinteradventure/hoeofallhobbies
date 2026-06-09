import https from 'https';
import fs from 'fs';

const PROJECT_URL = 'https://tgskrunjdmoyjgrieuzg.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnc2tydW5qZG1veWpncmlldXpnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDA4NTYzNiwiZXhwIjoyMDk1NjYxNjM2fQ.VRaqiHZF7l7VozolLHw8rpdXHm_apOgAopmnEeQB4BU';

// Read migration files
const migration1 = fs.readFileSync('./supabase/migrations/001_initial_schema.sql', 'utf8');
const migration2 = fs.readFileSync('./supabase/migrations/002_rls_policies.sql', 'utf8');

console.log('📋 Migrations loaded');
console.log(`  Schema: ${migration1.length} bytes`);
console.log(`  RLS: ${migration2.length} bytes`);

// Try to execute via REST API endpoint
async function executeSql(sql, name) {
  return new Promise((resolve, reject) => {
    const url = new URL(PROJECT_URL);
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: '/rest/v1/',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY
      }
    };

    const data = JSON.stringify({ sql });
    
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        console.log(`  ${name}: Status ${res.statusCode}`);
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(true);
        } else {
          reject(new Error(`${name} failed: ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// Try using curl instead for better SQL support
function executeSqlViaCurl(sql, name) {
  return new Promise((resolve, reject) => {
    const { execSync } = require('child_process');
    try {
      // First, try to connect and run via curl + postgres
      console.log(`  Attempting ${name}...`);
      resolve(true);
    } catch (e) {
      reject(e);
    }
  });
}

console.log('\n🚀 Deploying migrations...\n');

(async () => {
  try {
    // Check if we can use pg library
    try {
      const pg = await import('pg');
      console.log('✅ Found pg library, using native PostgreSQL connection');
      
      const { Client } = pg;
      const client = new Client({
        host: 'db.tgskrunjdmoyjgrieuzg.supabase.co',
        port: 5432,
        database: 'postgres',
        user: 'postgres',
        password: process.env.DB_PASSWORD || 'postgres'
      });

      await client.connect();
      console.log('✅ Connected to database\n');

      // Run migrations
      console.log('1️⃣  Running schema migration...');
      try {
        await client.query(migration1);
        console.log('   ✅ Schema created\n');
      } catch (e) {
        if (e.message.includes('already exists')) {
          console.log('   ℹ️  Tables already exist\n');
        } else {
          throw e;
        }
      }

      console.log('2️⃣  Running RLS policies...');
      try {
        await client.query(migration2);
        console.log('   ✅ RLS policies configured\n');
      } catch (e) {
        if (e.message.includes('already exists')) {
          console.log('   ℹ️  Policies already exist\n');
        } else {
          throw e;
        }
      }

      await client.end();
      console.log('✅ All migrations completed successfully!');
      console.log('\n📊 Database is ready for the marketplace application.');
      
    } catch (pgError) {
      console.log('⚠️  pg library not available, trying alternative method...\n');
      throw new Error('Cannot execute migrations without pg library. Please use Supabase Dashboard or install pg library.');
    }
  } catch (err) {
    console.error('\n❌ Error:', err.message);
    console.error('\n📖 To run migrations manually:');
    console.error('   1. Go to https://app.supabase.com');
    console.error('   2. Sign in with GitHub (sprinteradventure account)');
    console.error('   3. Open SQL Editor');
    console.error('   4. Paste and run: supabase/migrations/001_initial_schema.sql');
    console.error('   5. Then run: supabase/migrations/002_rls_policies.sql');
    process.exit(1);
  }
})();
