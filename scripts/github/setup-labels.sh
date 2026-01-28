#!/bin/bash
# Setup GitHub Labels
# Run this once to create all necessary labels

echo "🏷️  Setting up GitHub labels for PetForce"
echo ""

# Agent labels
echo "Creating agent labels..."
gh label create "agent:peter" --color "0052CC" --description "Product Management" --force
gh label create "agent:engrid" --color "0052CC" --description "Engineering" --force
gh label create "agent:tucker" --color "0052CC" --description "Testing/QA" --force
gh label create "agent:larry" --color "0052CC" --description "Logging/Monitoring" --force
gh label create "agent:dexter" --color "0052CC" --description "Design/UX" --force
gh label create "agent:samantha" --color "0052CC" --description "Security" --force
gh label create "agent:chuck" --color "0052CC" --description "CI/CD" --force
gh label create "agent:maya" --color "0052CC" --description "Mobile" --force
gh label create "agent:axel" --color "0052CC" --description "API" --force
gh label create "agent:buck" --color "0052CC" --description "Data Engineering" --force
gh label create "agent:ana" --color "0052CC" --description "Analytics" --force
gh label create "agent:isabel" --color "0052CC" --description "Infrastructure" --force
gh label create "agent:thomas" --color "0052CC" --description "Documentation" --force
gh label create "agent:casey" --color "0052CC" --description "Customer Success" --force

# Priority labels
echo "Creating priority labels..."
gh label create "priority:critical" --color "D73A4A" --description "Critical priority" --force
gh label create "priority:high" --color "FF6B35" --description "High priority" --force
gh label create "priority:medium" --color "FBCA04" --description "Medium priority" --force
gh label create "priority:low" --color "0E8A16" --description "Low priority" --force

# Severity labels
echo "Creating severity labels..."
gh label create "severity:critical" --color "D73A4A" --description "Critical severity" --force
gh label create "severity:high" --color "FF6B35" --description "High severity" --force
gh label create "severity:medium" --color "FBCA04" --description "Medium severity" --force
gh label create "severity:low" --color "0E8A16" --description "Low severity" --force

# Type labels
echo "Creating type labels..."
gh label create "type:bug" --color "D73A4A" --description "Bug fix" --force
gh label create "type:feature" --color "A2EEEF" --description "New feature" --force
gh label create "type:docs" --color "0075CA" --description "Documentation" --force
gh label create "type:refactor" --color "5319E7" --description "Code refactoring" --force
gh label create "type:test" --color "F9D0C4" --description "Testing" --force
gh label create "type:chore" --color "FEF2C0" --description "Chores" --force

# Component labels
echo "Creating component labels..."
gh label create "component:auth" --color "C5DEF5" --description "Authentication" --force
gh label create "component:database" --color "C5DEF5" --description "Database" --force
gh label create "component:frontend" --color "C5DEF5" --description "Frontend" --force
gh label create "component:backend" --color "C5DEF5" --description "Backend" --force
gh label create "component:mobile" --color "C5DEF5" --description "Mobile" --force
gh label create "component:docs" --color "C5DEF5" --description "Documentation" --force
gh label create "component:ci-cd" --color "C5DEF5" --description "CI/CD" --force
gh label create "component:security" --color "C5DEF5" --description "Security" --force
gh label create "component:performance" --color "C5DEF5" --description "Performance" --force

# Status labels
echo "Creating status labels..."
gh label create "status:blocked" --color "B60205" --description "Blocked" --force
gh label create "status:in-progress" --color "FBCA04" --description "In progress" --force
gh label create "status:ready" --color "0E8A16" --description "Ready for work" --force
gh label create "merged" --color "0E8A16" --description "PR merged" --force
gh label create "deployed:staging" --color "0E8A16" --description "Deployed to staging" --force
gh label create "deployed:production" --color "0E8A16" --description "Deployed to production" --force

# Special labels
echo "Creating special labels..."
gh label create "ci-failure" --color "D73A4A" --description "CI/CD failure" --force
gh label create "security" --color "D73A4A" --description "Security issue" --force
gh label create "stale" --color "EDEDED" --description "Stale issue" --force
gh label create "good-first-issue" --color "7057FF" --description "Good for newcomers" --force
gh label create "help-wanted" --color "008672" --description "Extra attention needed" --force
gh label create "no-issue-needed" --color "EDEDED" --description "Trivial change" --force
gh label create "missing-issue-link" --color "FF6B35" --description "PR missing issue" --force
gh label create "invalid-branch-name" --color "FF6B35" --description "Invalid branch name" --force
gh label create "roadmap" --color "7057FF" --description "Roadmap item" --force
gh label create "task" --color "FEF2C0" --description "Task" --force

echo ""
echo "✅ All labels created!"
echo ""
echo "To view labels: gh label list"
