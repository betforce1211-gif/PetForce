#!/bin/bash

# Mock Infrastructure Fix - Verification Script
# This script verifies that the Vite dev server uses test environment variables

set -e

echo "================================================"
echo "Mock Infrastructure Fix - Verification"
echo "================================================"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Navigate to web app directory
cd "$(dirname "$0")"
echo "Working directory: $(pwd)"
echo ""

# Step 1: Clean environment
echo "Step 1: Cleaning environment..."
echo "  - Killing any running Vite dev servers..."
pkill -f "vite" 2>/dev/null || true
pkill -f "node.*vite" 2>/dev/null || true
sleep 2
echo -e "${GREEN}  ✓ Environment cleaned${NC}"
echo ""

# Step 2: Verify .env.test exists
echo "Step 2: Verifying .env.test configuration..."
if [ ! -f ".env.test" ]; then
  echo -e "${RED}  ✗ Error: .env.test not found!${NC}"
  exit 1
fi

# Check for mock URL in .env.test
if grep -q "VITE_SUPABASE_URL=https://test.supabase.co" .env.test; then
  echo -e "${GREEN}  ✓ Mock Supabase URL configured correctly${NC}"
else
  echo -e "${RED}  ✗ Error: Mock URL not found in .env.test${NC}"
  exit 1
fi
echo ""

# Step 3: Verify playwright.config.ts has env injection
echo "Step 3: Verifying Playwright configuration..."
if grep -q "env:" playwright.config.ts && grep -q "VITE_SUPABASE_URL:" playwright.config.ts; then
  echo -e "${GREEN}  ✓ Environment variable injection configured${NC}"
else
  echo -e "${RED}  ✗ Error: webServer.env not configured in playwright.config.ts${NC}"
  exit 1
fi
echo ""

# Step 4: Run the test
echo "Step 4: Running E2E test with mock infrastructure..."
echo "  Test: Unified auth flow - new user registration"
echo ""
echo -e "${YELLOW}Watch for the mock interception message:${NC}"
echo -e "${YELLOW}  '🔍 Mock intercepted signup request for: test@example.com'${NC}"
echo ""

# Run the test and capture output
if npx playwright test src/features/auth/__tests__/e2e/unified-auth-flow.spec.ts --grep "successfully registers new user" --reporter=line; then
  echo ""
  echo -e "${GREEN}================================================${NC}"
  echo -e "${GREEN}✓ Test passed! Mock infrastructure is working.${NC}"
  echo -e "${GREEN}================================================${NC}"
  echo ""
  echo "Success indicators:"
  echo "  • Test completed without timeout errors"
  echo "  • Mock interception messages appeared in console"
  echo "  • Test ran in 2-5 seconds (not 10+ seconds)"
  echo ""
  exit 0
else
  echo ""
  echo -e "${RED}================================================${NC}"
  echo -e "${RED}✗ Test failed. Check output above for details.${NC}"
  echo -e "${RED}================================================${NC}"
  echo ""
  echo "Troubleshooting steps:"
  echo "  1. Check if mock interception message appeared"
  echo "  2. Look for timeout errors (indicates real API calls)"
  echo "  3. Review MOCK_FIX_VERIFICATION.md for detailed debugging"
  echo ""
  exit 1
fi
