#!/bin/bash
# Chuck's E2E Validation Script
# Runs E2E tests with quality gates before pushing to CI

set -e

echo "🎯 Chuck's E2E Quality Gate Validation"
echo "======================================="
echo ""

# Navigate to web app directory
cd "$(dirname "$0")/.."

# Check if Playwright is installed
if ! command -v npx &> /dev/null; then
    echo "❌ npx not found. Please install Node.js"
    exit 1
fi

# Check if Playwright browsers are installed
if ! npx playwright --version &> /dev/null; then
    echo "⚠️  Playwright not found. Installing..."
    npx playwright install chromium
fi

# Run E2E tests
echo "📋 Running E2E tests..."
echo ""

if npm run test:e2e -- --project=chromium; then
    echo ""
    echo "✅ All E2E tests passed!"
    echo ""
    echo "Great work! Your changes are ready for CI."
    echo ""
    echo "Next steps:"
    echo "  1. Commit your changes"
    echo "  2. Push to your branch"
    echo "  3. Create a PR"
    echo "  4. E2E tests will run automatically in CI"
    echo ""
    exit 0
else
    EXIT_CODE=$?
    echo ""
    echo "⚠️  E2E tests failed"
    echo ""
    echo "Current status: Some tests may be failing due to animation timing issues."
    echo "Engrid is working on fixes for known animation issues."
    echo ""
    echo "What to do:"
    echo "  1. Review test failures: npx playwright show-report"
    echo "  2. Check if failures are CRITICAL auth flow tests"
    echo "  3. Fix any critical failures before pushing"
    echo "  4. Document animation timing issues in PR description"
    echo ""
    echo "Quality Gate Policy:"
    echo "  - CRITICAL auth flow tests must pass"
    echo "  - Animation timing issues can be documented and fixed separately"
    echo ""
    echo "To view detailed report:"
    echo "  npx playwright show-report"
    echo ""
    exit $EXIT_CODE
fi
