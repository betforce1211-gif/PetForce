#!/bin/bash

# Tucker's Visual Regression Test Runner
# Catches UI issues like visited link colors, spacing problems, etc.

set -e

echo "🔍 Tucker's Visual Regression Testing Suite"
echo "==========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if dev server is running
echo "📡 Checking if dev server is running..."
if ! curl -s http://localhost:3000 > /dev/null; then
    echo -e "${YELLOW}⚠️  Dev server not running. Starting it...${NC}"
    npm run dev &
    DEV_SERVER_PID=$!
    echo "Waiting for server to start..."
    sleep 5
else
    echo -e "${GREEN}✓${NC} Dev server is running"
fi

# Run visual regression tests
echo ""
echo "📸 Running visual regression tests..."
echo "   (These catch styling issues like purple buttons!)"
echo ""

npx playwright test tests/visual/auth-visual.spec.ts --project=chromium

# Check if tests passed
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓ All visual tests passed!${NC}"
    echo "  No styling issues detected."
else
    echo ""
    echo -e "${RED}✗ Visual tests failed!${NC}"
    echo "  Check the screenshots in test-results/"
    echo ""
    echo "To update baselines (if changes are intentional):"
    echo "  npx playwright test --update-snapshots"
fi

# Cleanup
if [ ! -z "$DEV_SERVER_PID" ]; then
    echo ""
    echo "Stopping dev server..."
    kill $DEV_SERVER_PID 2>/dev/null || true
fi

echo ""
echo "==========================================="
echo "Tucker's testing complete!"
