#!/bin/bash

# sync-bugs-and-roadmap.sh
# Automatically create GitHub Issues from commit messages
# Used by /petforce-dev:push command

set -e

COMMIT_MSG="$1"
COMMIT_SHA="$2"
BRANCH="$3"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🎫 Analyzing commit for GitHub Issues..."

# Extract commit type and scope
COMMIT_TYPE=$(echo "$COMMIT_MSG" | grep -oE '^[a-z]+' | head -1)
COMMIT_SCOPE=$(echo "$COMMIT_MSG" | grep -oE '\([a-z]+\)' | tr -d '()' | head -1)
COMMIT_SUBJECT=$(echo "$COMMIT_MSG" | head -1 | sed 's/^[a-z]\+(\?[a-z]*)\?: //')

echo "  Type: $COMMIT_TYPE"
echo "  Scope: $COMMIT_SCOPE"
echo "  Subject: $COMMIT_SUBJECT"
echo ""

# Determine labels based on scope
LABELS="type:${COMMIT_TYPE}"

# Add agent label based on scope
case "$COMMIT_SCOPE" in
  auth)
    LABELS="${LABELS},agent:engrid,component:auth"
    ;;
  mobile)
    LABELS="${LABELS},agent:maya,component:mobile"
    ;;
  web)
    LABELS="${LABELS},agent:engrid,component:frontend"
    ;;
  ui|components)
    LABELS="${LABELS},agent:dexter,component:frontend"
    ;;
  api)
    LABELS="${LABELS},agent:axel,component:backend"
    ;;
  database|db)
    LABELS="${LABELS},agent:buck,component:database"
    ;;
  ci|cicd)
    LABELS="${LABELS},agent:chuck,component:ci-cd"
    ;;
  docs)
    LABELS="${LABELS},agent:thomas,documentation"
    ;;
  test|testing)
    LABELS="${LABELS},agent:tucker,type:test"
    ;;
  security)
    LABELS="${LABELS},agent:samantha,security"
    ;;
  monitoring|logging)
    LABELS="${LABELS},agent:larry,component:observability"
    ;;
  analytics)
    LABELS="${LABELS},agent:ana,component:analytics"
    ;;
  infrastructure|infra)
    LABELS="${LABELS},agent:isabel,component:infrastructure"
    ;;
  *)
    LABELS="${LABELS},agent:engrid"
    ;;
esac

# Create issues based on commit type
case "$COMMIT_TYPE" in
  feat)
    echo "${GREEN}Creating FEATURE issue...${NC}"

    ISSUE_TITLE="[FEATURE] $COMMIT_SUBJECT"
    ISSUE_BODY="## Feature

This feature was implemented in commit: $COMMIT_SHA

### Commit Message
\`\`\`
$COMMIT_MSG
\`\`\`

### Branch
\`$BRANCH\`

### Scope
\`$COMMIT_SCOPE\`

### Next Steps
- [ ] Create tests if not included
- [ ] Update documentation
- [ ] Add to release notes
- [ ] Monitor after deployment

---
*Auto-created by /petforce-dev:push*"

    LABELS="${LABELS},enhancement,roadmap,priority:medium"

    gh issue create \
      --title "$ISSUE_TITLE" \
      --body "$ISSUE_BODY" \
      --label "$LABELS" 2>&1 | tee /tmp/gh-issue-output.txt

    ISSUE_URL=$(grep -oE 'https://github.com[^ ]+' /tmp/gh-issue-output.txt | head -1)
    echo "${GREEN}✅ Created: $ISSUE_URL${NC}"
    ;;

  fix)
    echo "${GREEN}Creating BUG issue...${NC}"

    ISSUE_TITLE="[BUG] $COMMIT_SUBJECT"
    ISSUE_BODY="## Bug Fix

This bug was fixed in commit: $COMMIT_SHA

### Commit Message
\`\`\`
$COMMIT_MSG
\`\`\`

### Branch
\`$BRANCH\`

### Scope
\`$COMMIT_SCOPE\`

### Resolution
Fixed in commit $COMMIT_SHA

### Verification Needed
- [ ] Verify fix in staging
- [ ] Run regression tests
- [ ] Update related documentation
- [ ] Add test to prevent regression

---
*Auto-created by /petforce-dev:push*"

    LABELS="${LABELS},bug,priority:high"

    gh issue create \
      --title "$ISSUE_TITLE" \
      --body "$ISSUE_BODY" \
      --label "$LABELS" 2>&1 | tee /tmp/gh-issue-output.txt

    ISSUE_URL=$(grep -oE 'https://github.com[^ ]+' /tmp/gh-issue-output.txt | head -1)
    echo "${GREEN}✅ Created: $ISSUE_URL${NC}"
    ;;

  refactor)
    echo "${YELLOW}Creating TECH DEBT issue...${NC}"

    ISSUE_TITLE="[TECH DEBT] $COMMIT_SUBJECT"
    ISSUE_BODY="## Technical Debt Addressed

This refactoring was completed in commit: $COMMIT_SHA

### Commit Message
\`\`\`
$COMMIT_MSG
\`\`\`

### Branch
\`$BRANCH\`

### Scope
\`$COMMIT_SCOPE\`

### Follow-up
- [ ] Verify no behavior changes
- [ ] Check test coverage
- [ ] Document architectural changes
- [ ] Monitor performance

---
*Auto-created by /petforce-dev:push*"

    LABELS="${LABELS},type:refactor,priority:medium"

    gh issue create \
      --title "$ISSUE_TITLE" \
      --body "$ISSUE_BODY" \
      --label "$LABELS" 2>&1 | tee /tmp/gh-issue-output.txt

    ISSUE_URL=$(grep -oE 'https://github.com[^ ]+' /tmp/gh-issue-output.txt | head -1)
    echo "${GREEN}✅ Created: $ISSUE_URL${NC}"
    ;;

  docs)
    echo "${BLUE}Creating DOCS issue...${NC}"

    ISSUE_TITLE="[DOCS] $COMMIT_SUBJECT"
    ISSUE_BODY="## Documentation Update

Documentation was updated in commit: $COMMIT_SHA

### Commit Message
\`\`\`
$COMMIT_MSG
\`\`\`

### Branch
\`$BRANCH\`

### Scope
\`$COMMIT_SCOPE\`

### Review Needed
- [ ] Technical accuracy review
- [ ] Grammar and style check
- [ ] Code examples tested
- [ ] Links verified

---
*Auto-created by /petforce-dev:push*"

    LABELS="${LABELS},documentation,priority:low"

    gh issue create \
      --title "$ISSUE_TITLE" \
      --body "$ISSUE_BODY" \
      --label "$LABELS" 2>&1 | tee /tmp/gh-issue-output.txt

    ISSUE_URL=$(grep -oE 'https://github.com[^ ]+' /tmp/gh-issue-output.txt | head -1)
    echo "${GREEN}✅ Created: $ISSUE_URL${NC}"
    ;;

  test)
    echo "${BLUE}Skipping issue creation for test commits${NC}"
    echo "  (Tests are tracked via code coverage)"
    ;;

  chore|style|perf)
    echo "${BLUE}Skipping issue creation for $COMMIT_TYPE commits${NC}"
    echo "  (No roadmap item needed)"
    ;;

  *)
    echo "${YELLOW}Unknown commit type: $COMMIT_TYPE${NC}"
    echo "  Skipping issue creation"
    ;;
esac

echo ""
echo "🎫 GitHub Issues sync complete!"
