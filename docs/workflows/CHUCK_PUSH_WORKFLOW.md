# Chuck Push Workflow - Automated Git Operations

**Version:** 1.0.0  
**Status:** Production Ready  
**Owner:** Chuck - CI/CD Guardian

---

## Overview

The Chuck Push Workflow is a comprehensive, production-ready automation system that handles the entire git push lifecycle from validation to PR creation and auto-merge. It follows Git Flow best practices and coordinates with all PetForce agents to ensure quality.

### Philosophy

> "Quality gates protect pet families. Every deployment matters."

Every push goes through rigorous validation to ensure we never ship broken code to production where it could affect pet health and safety.

---

## Quick Start

### One-Command Push

```bash
/petforce-dev:push
# or
./scripts/chuck-push
```

This single command:

1. Validates your branch and commits
2. Runs all quality gates (lint, typecheck, test, security, build)
3. Commits changes with generated conventional commit message
4. Pulls latest from base branch and rebases
5. Pushes to remote
6. Creates PR with auto-generated description
7. Enables auto-merge when CI passes

### Prerequisites

```bash
# Install GitHub CLI
brew install gh

# Authenticate
gh auth login

# Verify setup
gh auth status
```

---

## Workflow Phases

See full documentation in `/docs/workflows/` for detailed information on:

- Phase 1: Pre-Push Validation
- Phase 2: Quality Gates
- Phase 3: Git Operations
- Phase 4: PR Creation & Auto-Merge

---

## Quick Reference

### Common Commands

```bash
# Automated push workflow
./scripts/chuck-push

# Validate branch name
./scripts/chuck validate-branch

# Create feature branch
./scripts/chuck create-branch feature PET-123 "add notifications"

# Check all quality gates
./scripts/chuck check all

# Validate PR readiness
./scripts/chuck pr validate
```

### Configuration

Configuration file: `.chuckrc.yml`

Key settings:

- Branch naming patterns
- Quality gate requirements
- Auto-merge behavior
- Agent coordination

---

**Remember:** Quality gates protect pet families. Every deployment matters.
