#!/bin/bash
# Tucker's E2E Test Runner Script
# Ensures dev server is running before executing tests

set -e

echo "🧪 Tucker's E2E Test Runner"
echo "==========================="
echo ""

# Check if dev server is running
check_server() {
  if curl -s http://localhost:5173 > /dev/null; then
    return 0
  else
    return 1
  fi
}

# Start dev server in background if not running
if check_server; then
  echo "✅ Dev server already running on port 5173"
  SERVER_STARTED_BY_SCRIPT=false
else
  echo "🚀 Starting dev server..."
  npm run dev > /dev/null 2>&1 &
  DEV_SERVER_PID=$!
  SERVER_STARTED_BY_SCRIPT=true
  
  # Wait for server to be ready
  echo "⏳ Waiting for server to be ready..."
  for i in {1..30}; do
    if check_server; then
      echo "✅ Server ready!"
      break
    fi
    sleep 1
    if [ $i -eq 30 ]; then
      echo "❌ Server failed to start within 30 seconds"
      kill $DEV_SERVER_PID 2>/dev/null || true
      exit 1
    fi
  done
fi

echo ""
echo "🧪 Running E2E tests..."
echo ""

# Run tests with all arguments passed through
npx playwright test "$@"

TEST_EXIT_CODE=$?

# Cleanup: stop dev server if we started it
if [ "$SERVER_STARTED_BY_SCRIPT" = true ]; then
  echo ""
  echo "🛑 Stopping dev server..."
  kill $DEV_SERVER_PID 2>/dev/null || true
fi

# Show report link if tests ran
if [ $TEST_EXIT_CODE -eq 0 ]; then
  echo ""
  echo "✅ All tests passed!"
  echo "📊 View full report: npx playwright show-report"
else
  echo ""
  echo "❌ Some tests failed"
  echo "📊 View report: npx playwright show-report"
  echo "🐛 Debug: npx playwright test --debug"
fi

exit $TEST_EXIT_CODE
