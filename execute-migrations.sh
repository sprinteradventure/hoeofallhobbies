#!/bin/bash

# Supabase credentials
PROJECT_URL="https://tgskrunjdmoyjgrieuzg.supabase.co"
SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnc2tydW5qZG1veWpncmlldXpnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDA4NTYzNiwiZXhwIjoyMDk1NjYxNjM2fQ.VRaqiHZF7l7VozolLHw8rpdXHm_apOgAopmnEeQB4BU"

echo "🚀 Executing database migrations via Supabase API..."
echo ""

# Read the combined SQL
SQL_CONTENT=$(cat .migrations-combined.sql)

# Count the statements
STATEMENT_COUNT=$(echo "$SQL_CONTENT" | grep -c "^[^-].*;" || echo "1")

echo "📝 Statements to execute: ~$STATEMENT_COUNT"
echo "📊 Total SQL size: ${#SQL_CONTENT} bytes"
echo ""

# Try to execute via REST API RPC endpoint
echo "1️⃣ Attempting to execute migrations..."
echo ""

# Create a JSON payload with the SQL
# We need to escape the SQL content for JSON
ESCAPED_SQL=$(echo "$SQL_CONTENT" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))')

# Make the API call
RESPONSE=$(curl -s -X POST \
  "${PROJECT_URL}/rest/v1/rpc/exec_sql" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -d "{\"sql\": $ESCAPED_SQL}" \
  -w "\n%{http_code}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | head -n -1)

echo "Response Status: $HTTP_CODE"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Migrations executed successfully!"
  echo "✅ Database is now fully initialized!"
  exit 0
elif [ "$HTTP_CODE" = "404" ]; then
  echo "ℹ️  RPC function not found (this is expected)"
  echo "   The migrations can still be executed manually"
  exit 1
else
  echo "Response: $BODY"
  exit 1
fi
