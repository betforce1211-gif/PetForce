# Git Setup Guide

Complete guide to setting up your development environment with PetForce's Git workflows.

## Table of Contents

- [Initial Setup](#initial-setup)
- [Git Configuration](#git-configuration)
- [Git Hooks Setup](#git-hooks-setup)
- [GitHub CLI Setup](#github-cli-setup)
- [Verification](#verification)
- [Troubleshooting](#troubleshooting)

---

## Initial Setup

### 1. Install Prerequisites

**macOS:**
```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Git
brew install git

# Install Node.js (via nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20.19.0
nvm use 20.19.0

# Install GitHub CLI
brew install gh
```

**Linux:**
```bash
# Install Git
sudo apt-get update
sudo apt-get install git

# Install Node.js (via nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20.19.0
nvm use 20.19.0

# Install GitHub CLI
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh
```

**Windows:**
```powershell
# Install Git
winget install Git.Git

# Install Node.js
winget install OpenJS.NodeJS.LTS

# Install GitHub CLI
winget install GitHub.cli
```

### 2. Clone Repository

```bash
# Clone via HTTPS
git clone https://github.com/betforce1211-gif/PetForce.git
cd PetForce

# Or clone via SSH (recommended)
git clone git@github.com:betforce1211-gif/PetForce.git
cd PetForce
```

### 3. Install Dependencies

```bash
# Install project dependencies (includes Husky)
npm install
```

This will automatically:
- Install all npm packages
- Set up Husky Git hooks
- Configure lint-staged
- Install commitlint

---

## Git Configuration

### Global Configuration

```bash
# Set your name and email
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Set default branch name
git config --global init.defaultBranch main

# Enable color output
git config --global color.ui auto

# Set default editor (choose one)
git config --global core.editor "code --wait"  # VS Code
git config --global core.editor "vim"          # Vim
git config --global core.editor "nano"         # Nano

# Set pull strategy (rebase by default)
git config --global pull.rebase true

# Enable auto-cleanup
git config --global fetch.prune true

# Enable credential helper
# macOS
git config --global credential.helper osxkeychain

# Linux
git config --global credential.helper cache

# Windows
git config --global credential.helper wincred
```

### PetForce-Specific Configuration

```bash
# Navigate to project
cd PetForce

# Configure repository-specific settings
git config user.name "Your Name"
git config user.email "your.work@email.com"

# Enable commit signing (optional but recommended)
git config commit.gpgsign true
git config user.signingkey YOUR_GPG_KEY_ID

# Set up aliases
git config alias.st "status"
git config alias.co "checkout"
git config alias.br "branch"
git config alias.ci "commit"
git config alias.lg "log --oneline --graph --decorate"
git config alias.last "log -1 HEAD"
git config alias.unstage "reset HEAD --"
```

### Useful Git Aliases

Add these to your `~/.gitconfig`:

```ini
[alias]
  # Status shortcuts
  st = status
  ss = status -s
  
  # Branch shortcuts
  br = branch
  co = checkout
  cob = checkout -b
  
  # Commit shortcuts
  ci = commit
  cm = commit -m
  ca = commit --amend
  can = commit --amend --no-edit
  
  # Log shortcuts
  lg = log --oneline --graph --decorate
  lga = log --oneline --graph --decorate --all
  last = log -1 HEAD
  
  # Diff shortcuts
  df = diff
  dfc = diff --cached
  
  # Stash shortcuts
  st = stash
  stp = stash pop
  stl = stash list
  
  # Sync shortcuts
  sync = !git fetch --all --prune && git pull
  up = !git pull --rebase --prune && git submodule update --init --recursive
  
  # Cleanup shortcuts
  cleanup = !git branch --merged | grep -v '\\*\\|main\\|develop' | xargs -n 1 git branch -d
  
  # Undo shortcuts
  undo = reset --soft HEAD~1
  unstage = reset HEAD --
  
  # Chuck's validation
  check = !npm run check:all
```

---

## Git Hooks Setup

Git hooks are **automatically installed** when you run `npm install`.

### Verify Hooks Installation

```bash
# Check if hooks are installed
ls -la .husky/

# Should see:
# - pre-commit
# - commit-msg
# - pre-push
```

### What Each Hook Does

#### Pre-Commit Hook
- Runs on `git commit`
- Lints staged files with ESLint
- Formats staged files with Prettier
- Only affects files you're committing

#### Commit-Msg Hook
- Runs on `git commit`
- Validates commit message format
- Ensures Conventional Commits compliance
- Cannot be bypassed

#### Pre-Push Hook
- Runs on `git push`
- Runs test suite
- Prevents pushing broken code

### Manually Trigger Hooks

```bash
# Test pre-commit
npm run format && npm run lint

# Test commit message validation
echo "feat: test message" | npx commitlint

# Test pre-push
npm test
```

### Bypass Hooks (Not Recommended)

```bash
# Skip pre-commit and commit-msg
git commit --no-verify -m "message"

# Skip pre-push
git push --no-verify
```

**Warning:** Bypassing hooks can introduce bugs and break CI. Only use in emergencies.

---

## GitHub CLI Setup

### Authenticate

```bash
# Login to GitHub
gh auth login

# Choose:
# - GitHub.com
# - HTTPS or SSH
# - Authenticate via web browser
```

### Verify Authentication

```bash
# Check authentication status
gh auth status

# Test API access
gh repo view betforce1211-gif/PetForce
```

### Useful Commands

```bash
# Create PR from current branch
gh pr create --fill

# View PR status
gh pr status

# Checkout PR locally
gh pr checkout 123

# View PR diff
gh pr diff 123

# List issues
gh issue list

# Create issue
gh issue create

# View workflow runs
gh run list

# View workflow logs
gh run view

# View repository info
gh repo view
```

---

## Verification

### Verify Git Setup

```bash
# Check Git version (should be 2.30+)
git --version

# Check Git config
git config --list

# Check remotes
git remote -v

# Should show:
# origin  https://github.com/betforce1211-gif/PetForce.git (fetch)
# origin  https://github.com/betforce1211-gif/PetForce.git (push)
```

### Verify Node Setup

```bash
# Check Node version (should be 20.19.0+)
node --version

# Check npm version
npm --version

# Check installed packages
npm list --depth=0
```

### Verify Hooks Setup

```bash
# Check Husky installation
npx husky --version

# Check hooks are executable
ls -la .husky/pre-commit
ls -la .husky/commit-msg
ls -la .husky/pre-push

# Test commit message validation
echo "invalid commit message" | npx commitlint
# Should fail

echo "feat: valid commit message" | npx commitlint
# Should pass
```

### Verify Project Setup

```bash
# Run all checks
npm run check:all

# This runs:
# - Linting
# - Type checking
# - Tests
# - Build

# All should pass
```

---

## Troubleshooting

### Git Hooks Not Running

```bash
# Reinstall hooks
rm -rf .husky
npm install

# Make hooks executable
chmod +x .husky/pre-commit
chmod +x .husky/commit-msg
chmod +x .husky/pre-push

# Verify Husky is in package.json
grep "prepare" package.json
# Should show: "prepare": "husky"
```

### Commit Message Validation Failing

```bash
# Check commitlint config exists
cat commitlint.config.js

# Test validation manually
echo "your message" | npx commitlint

# Use correct format
git commit -m "feat(scope): description"
```

### Pre-Commit Hook Failing

```bash
# Run lint and format manually
npm run lint -- --fix
npm run format

# Stage fixed files
git add .

# Try commit again
git commit -m "feat: description"
```

### Pre-Push Hook Failing

```bash
# Run tests manually
npm test

# Fix failing tests
# Then push again
git push
```

### GitHub CLI Not Authenticated

```bash
# Re-authenticate
gh auth logout
gh auth login

# Or use token
gh auth login --with-token < token.txt
```

### Permission Denied (SSH)

```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "your.email@example.com"

# Add to SSH agent
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519

# Add to GitHub
cat ~/.ssh/id_ed25519.pub
# Copy output and add to GitHub SSH keys

# Test connection
ssh -T git@github.com
```

### Husky Command Not Found

```bash
# Install Husky globally
npm install -g husky

# Or use npx
npx husky install
```

---

## Next Steps

After setup is complete:

1. ✅ Read [Git Workflow Guide](./GIT_WORKFLOW.md)
2. ✅ Read [Contributing Guidelines](../CONTRIBUTING.md)
3. ✅ Create your first branch
4. ✅ Make a test commit
5. ✅ Create a test PR

---

## Getting Help

- **Documentation**: Check `/docs` folder
- **Issues**: Create an issue on GitHub
- **Discussions**: Use GitHub Discussions
- **Chuck Agent**: Ask for CI/CD help

---

**Setup validated by Chuck, your CI/CD Guardian**
