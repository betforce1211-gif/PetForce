#!/bin/bash
# Verify GitHub Automation Setup
# Run this to check if everything is properly configured

echo "🛡️  Chuck's GitHub Automation - Setup Verification"
echo ""
echo "Checking setup..."
echo ""

# Track results
PASS=0
FAIL=0
WARN=0

# Check GitHub CLI
echo -n "✓ GitHub CLI (gh)... "
if command -v gh &> /dev/null; then
    echo "✅ Installed ($(gh --version | head -1))"
    PASS=$((PASS + 1))
else
    echo "❌ Not found - Install: brew install gh"
    FAIL=$((FAIL + 1))
fi

# Check authentication
echo -n "✓ GitHub Authentication... "
if gh auth status &> /dev/null; then
    echo "✅ Authenticated"
    PASS=$((PASS + 1))
else
    echo "❌ Not authenticated - Run: gh auth login"
    FAIL=$((FAIL + 1))
fi

# Check Node.js
echo -n "✓ Node.js... "
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✅ Installed ($NODE_VERSION)"
    PASS=$((PASS + 1))
else
    echo "❌ Not found - Install Node.js 18+"
    FAIL=$((FAIL + 1))
fi

echo ""
echo "Checking workflows..."
echo ""

# Check workflows
WORKFLOWS=(
    "issue-automation.yml"
    "ci-issue-sync.yml"
    "pr-issue-link.yml"
    "pr-status-sync.yml"
)

for workflow in "${WORKFLOWS[@]}"; do
    echo -n "✓ $workflow... "
    if [ -f ".github/workflows/$workflow" ]; then
        echo "✅ Found"
        PASS=$((PASS + 1))
    else
        echo "❌ Missing"
        FAIL=$((FAIL + 1))
    fi
done

echo ""
echo "Checking scripts..."
echo ""

# Check scripts
SCRIPTS=(
    "bulk-import-issues.js"
    "sync-issue-status.js"
    "chuck-cli.js"
    "setup-labels.sh"
)

for script in "${SCRIPTS[@]}"; do
    echo -n "✓ $script... "
    if [ -f "scripts/github/$script" ]; then
        if [ -x "scripts/github/$script" ]; then
            echo "✅ Found (executable)"
            PASS=$((PASS + 1))
        else
            echo "⚠️  Found (not executable)"
            WARN=$((WARN + 1))
        fi
    else
        echo "❌ Missing"
        FAIL=$((FAIL + 1))
    fi
done

echo ""
echo "Checking templates..."
echo ""

# Check templates
TEMPLATES=(
    "bug_report.md"
    "feature_request.md"
    "task.md"
    "roadmap.md"
)

for template in "${TEMPLATES[@]}"; do
    echo -n "✓ $template... "
    if [ -f ".github/ISSUE_TEMPLATE/$template" ]; then
        echo "✅ Found"
        PASS=$((PASS + 1))
    else
        echo "❌ Missing"
        FAIL=$((FAIL + 1))
    fi
done

echo ""
echo "Checking documentation..."
echo ""

# Check docs
DOCS=(
    "GITHUB-AUTOMATION-QUICKSTART.md"
    "GITHUB-AUTOMATION-SUMMARY.md"
    "docs/GITHUB-AUTOMATION.md"
    "scripts/github/README.md"
)

for doc in "${DOCS[@]}"; do
    echo -n "✓ $doc... "
    if [ -f "$doc" ]; then
        echo "✅ Found"
        PASS=$((PASS + 1))
    else
        echo "❌ Missing"
        FAIL=$((FAIL + 1))
    fi
done

echo ""
echo "Checking GitHub repository..."
echo ""

# Check if in git repo
echo -n "✓ Git repository... "
if git rev-parse --git-dir > /dev/null 2>&1; then
    echo "✅ Found"
    PASS=$((PASS + 1))
else
    echo "❌ Not a git repository"
    FAIL=$((FAIL + 1))
fi

# Check remote
echo -n "✓ GitHub remote... "
if git remote get-url origin &> /dev/null; then
    REMOTE=$(git remote get-url origin)
    echo "✅ Found ($REMOTE)"
    PASS=$((PASS + 1))
else
    echo "❌ No remote configured"
    FAIL=$((FAIL + 1))
fi

# Check labels (optional - won't fail setup)
echo -n "✓ GitHub labels... "
LABEL_COUNT=$(gh label list 2>/dev/null | wc -l | tr -d ' ')
if [ "$LABEL_COUNT" -gt 0 ]; then
    echo "✅ $LABEL_COUNT labels found"
    PASS=$((PASS + 1))
else
    echo "⚠️  No labels found - Run: ./scripts/github/setup-labels.sh"
    WARN=$((WARN + 1))
fi

# Summary
echo ""
echo "═══════════════════════════════════════════════════════"
echo "Summary"
echo "═══════════════════════════════════════════════════════"
echo "✅ Passed: $PASS"
echo "⚠️  Warnings: $WARN"
echo "❌ Failed: $FAIL"
echo ""

if [ $FAIL -eq 0 ]; then
    echo "🎉 Setup verification complete!"
    echo ""
    if [ $WARN -gt 0 ]; then
        echo "⚠️  Some warnings found. Review above for details."
        echo ""
    fi
    echo "Next steps:"
    echo "1. Run: ./scripts/github/setup-labels.sh (if not done)"
    echo "2. Import tasks: node scripts/github/bulk-import-issues.js scripts/github/example-tasks.json"
    echo "3. Create your first issue: gh issue create --template task.md"
    echo "4. Read the quick start: GITHUB-AUTOMATION-QUICKSTART.md"
    echo ""
    echo "🛡️  Quality gates protect pet families. Every deployment matters."
    exit 0
else
    echo "❌ Setup verification failed!"
    echo ""
    echo "Please fix the issues above and run again."
    echo ""
    echo "For help:"
    echo "- Check GITHUB-AUTOMATION-QUICKSTART.md"
    echo "- Review GITHUB-AUTOMATION-SUMMARY.md"
    echo "- Create an issue with agent:chuck label"
    exit 1
fi
