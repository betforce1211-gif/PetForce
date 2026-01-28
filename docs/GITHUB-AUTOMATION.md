# GitHub Automation Documentation

## Overview

This document describes the GitHub automation system for PetForce, managed by Chuck (CI/CD Guardian).

**Chuck's Mantra**: Quality gates protect pet families. Every deployment matters.

## Workflows

### 1. Issue Automation
Auto-labels, assigns, and links issues based on content.

### 2. CI Issue Sync
Creates GitHub Issues from CI/CD failures.

### 3. PR Issue Link Check
Ensures every PR references a GitHub Issue.

### 4. PR Status Sync
Updates issues when PRs are merged or closed.

## Scripts

### 1. Bulk Import Issues
Location: `scripts/github/bulk-import-issues.js`

### 2. Sync Issue Status  
Location: `scripts/github/sync-issue-status.js`

### 3. Chuck CLI
Location: `scripts/github/chuck-cli.js`

## Quick Start

See full documentation in the README.
