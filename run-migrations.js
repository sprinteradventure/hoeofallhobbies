#!/usr/bin/env node

const https = require('https');
const fs = require('fs');

// Configuration
const PROJECT_URL = 'https://tgskrunjdmoyjgrieuzg.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnc2tydW5qZG1veWpncmlldXpnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDA4NTYzNiwiZXhwIjoyMDk1NjYxNjM2fQ.VRaqiHZF7l7VozolLHw8rpdXHm_apOgAopmnEeQB4BU';

// Read migration files
const migration1 = fs.readFileSync('./supabase/migrations/001_initial_schema.sql', 'utf8');
const migration2 = fs.readFileSync('./supabase/migrations/002_rls_policies.sql', 'utf8');

console.log('Migration files read successfully');
console.log('Migration 1 size:', migration1.length, 'bytes');
console.log('Migration 2 size:', migration2.length, 'bytes');

// Try pg library first
let usePostgres = false;
try {
  const { Client } = require('pg');
  usePostgres = true;
} catch {
  console.log('pg library not available');
}

if (usePostgres) {
  const { Client } = require('pg');

  async function executeViaPsql() {
    const client = new Client({
      host: 'db.tgskrunjdmoyjgrieuzg.supabase.co',
      port: 5432,
      database: 'postgres',
      user: 'postgres'
    });

    try {
      await client.connect();
      console.log('Connected to Supabase database');

      console.log('Executing migration 001_initial_schema.sql...');
      const result1 = await client.query(migration1);
      console.log('✓ Migration 1 completed');

      console.log('Executing migration 002_rls_policies.sql...');
      const result2 = await client.query(migration2);
      console.log('✓ Migration 2 completed');

      console.log('\n✓ All migrations executed successfully!');
    } catch (err) {
      console.error('Error executing migrations:', err.message);
      process.exit(1);
    } finally {
      await client.end();
    }
  }

  executeViaPsql();
} else {
  console.log('PostgreSQL client not available. Please install pg library.');
}
