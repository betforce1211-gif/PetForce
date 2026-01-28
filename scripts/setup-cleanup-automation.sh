#!/bin/bash

# Setup Automated Data Cleanup
# Purpose: Deploy cleanup automation infrastructure
# Owner: Infrastructure (Isabel)
# Created: 2026-01-25

set -e  # Exit on error

echo "=========================================="
echo "PetForce Automated Cleanup Setup"
echo "=========================================="
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Error: Supabase CLI not installed"
    echo "Install with: npm install -g supabase"
    exit 1
fi

echo "✅ Supabase CLI found"
echo ""

# Check if we're in the right directory
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Error: Not in PetForce root directory"
    echo "Please run this script from the PetForce root directory"
    exit 1
fi

echo "✅ In PetForce root directory"
echo ""

# Step 1: Apply database migrations
echo "Step 1: Applying database migrations..."
echo "----------------------------------------"

if [ ! -f "supabase/migrations/20260125000002_create_cleanup_functions.sql" ]; then
    echo "❌ Error: Cleanup migration file not found"
    exit 1
fi

echo "Migration file found: 20260125000002_create_cleanup_functions.sql"
echo ""
echo "Apply migration? (y/n)"
read -r apply_migration

if [ "$apply_migration" = "y" ]; then
    echo "Applying migration..."
    supabase db push
    echo "✅ Migration applied"
else
    echo "⏭️  Skipping migration"
fi

echo ""

# Step 2: Deploy Edge Function
echo "Step 2: Deploying Edge Function..."
echo "----------------------------------------"

if [ ! -f "supabase/functions/scheduled-cleanup/index.ts" ]; then
    echo "❌ Error: Edge function file not found"
    exit 1
fi

echo "Edge function found: scheduled-cleanup"
echo ""
echo "Deploy Edge Function? (y/n)"
read -r deploy_function

if [ "$deploy_function" = "y" ]; then
    echo "Deploying scheduled-cleanup function..."
    supabase functions deploy scheduled-cleanup
    echo "✅ Edge function deployed"
else
    echo "⏭️  Skipping function deployment"
fi

echo ""

# Step 3: Test cleanup functions
echo "Step 3: Testing cleanup functions..."
echo "----------------------------------------"
echo "Run test cleanup? (y/n)"
read -r run_test

if [ "$run_test" = "y" ]; then
    echo ""
    echo "Testing daily cleanup function..."

    # Run via Supabase SQL Editor or CLI
    echo "Please run the following SQL in Supabase Dashboard:"
    echo ""
    echo "  SELECT * FROM run_daily_cleanup();"
    echo ""
    echo "Verify the results show cleanup metrics."
    echo ""
    echo "Press Enter when done..."
    read -r

    echo "✅ Test completed (verify results manually)"
else
    echo "⏭️  Skipping tests"
fi

echo ""

# Step 4: Configure GitHub Secrets
echo "Step 4: Configuring GitHub Secrets..."
echo "----------------------------------------"

echo "You need to set the following secrets in GitHub:"
echo ""
echo "  1. Go to GitHub repo > Settings > Secrets and variables > Actions"
echo "  2. Add the following secrets:"
echo ""
echo "     SUPABASE_URL"
echo "     Value: (Your Supabase project URL)"
echo ""
echo "     SUPABASE_SERVICE_ROLE_KEY"
echo "     Value: (Your Supabase service role key)"
echo ""
echo "  3. Save secrets"
echo ""
echo "Have you configured GitHub secrets? (y/n)"
read -r secrets_configured

if [ "$secrets_configured" = "y" ]; then
    echo "✅ GitHub secrets configured"
else
    echo "⚠️  Remember to configure GitHub secrets before cleanup automation will work"
fi

echo ""

# Step 5: Enable GitHub Actions
echo "Step 5: Enabling GitHub Actions..."
echo "----------------------------------------"

if [ ! -f ".github/workflows/scheduled-cleanup.yml" ]; then
    echo "❌ Error: GitHub Actions workflow file not found"
    exit 1
fi

echo "Workflow file found: scheduled-cleanup.yml"
echo ""
echo "The workflow will automatically run on schedule:"
echo "  - Daily: 2 AM UTC"
echo "  - Weekly: Sunday 3 AM UTC"
echo "  - Monthly: 1st of month 4 AM UTC"
echo ""
echo "No action needed - workflow is enabled automatically."
echo "✅ GitHub Actions workflow ready"

echo ""

# Step 6: Test manual trigger
echo "Step 6: Testing manual trigger..."
echo "----------------------------------------"
echo ""
echo "To test the cleanup automation manually:"
echo ""
echo "  1. Go to GitHub > Actions > 'Scheduled Data Cleanup'"
echo "  2. Click 'Run workflow'"
echo "  3. Select 'daily' job type"
echo "  4. Click 'Run workflow' button"
echo "  5. Verify job completes successfully"
echo ""
echo "Would you like instructions for monitoring? (y/n)"
read -r show_monitoring

if [ "$show_monitoring" = "y" ]; then
    echo ""
    echo "Monitoring Cleanup Jobs:"
    echo "------------------------"
    echo ""
    echo "1. View audit log in Supabase:"
    echo "   SELECT * FROM cleanup_audit_log ORDER BY started_at DESC LIMIT 10;"
    echo ""
    echo "2. Generate retention report:"
    echo "   SELECT * FROM generate_retention_report();"
    echo ""
    echo "3. Check GitHub Actions:"
    echo "   GitHub > Actions > 'Scheduled Data Cleanup'"
    echo ""
fi

echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "Next Steps:"
echo "  1. Verify migration applied: Check Supabase Dashboard > Database > Migrations"
echo "  2. Test Edge Function: Run manual cleanup via GitHub Actions"
echo "  3. Monitor first automated run: Check cleanup_audit_log table"
echo "  4. Review documentation: docs/infrastructure/AUTOMATED-CLEANUP.md"
echo ""
echo "For support, see: docs/infrastructure/AUTOMATED-CLEANUP.md#troubleshooting"
echo ""
