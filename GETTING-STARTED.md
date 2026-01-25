# Getting Started with PetForce Development

This guide will walk you through setting up PetForce for the first time and building your first feature.

## 📋 Prerequisites Check

Before you start, make sure you have:

- [ ] Node.js >= 18.0.0 (`node --version`)
- [ ] npm >= 10.0.0 (`npm --version`)
- [ ] Docker Desktop installed and running
- [ ] Git installed
- [ ] Code editor (VS Code recommended)

## 🎯 Quick Start (5 Minutes)

### 1. Clone and Install

```bash
cd /Users/danielzeddr/PetForce
npm install
```

This installs all dependencies across the monorepo (web app, packages, etc.).

### 2. Start Supabase Locally

```bash
# Install Supabase CLI globally (one time only)
npm install -g supabase

# Start local Supabase stack
supabase start
```

**Important:** Save the output! You'll need:
- `API URL`: http://localhost:54321
- `publishable_key`: sb_publishable_... (new key format - recommended)
- `anon key`: eyJh... (legacy key - for backward compatibility)

### 3. Configure Environment

```bash
# Copy environment template
cp apps/web/.env.example apps/web/.env

# Edit apps/web/.env and paste your local credentials:
# VITE_SUPABASE_URL=http://localhost:54321
# VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...[your-key]
#
# Or use legacy key (will show deprecation warning):
# VITE_SUPABASE_ANON_KEY=eyJh...[your-key]
```

### 4. Set Up Database

```bash
# Run migrations to create auth tables
supabase db reset
```

You should see:
```
✓ Finished supabase db reset
Database reset successful
```

### 5. Start Web App

```bash
npm run dev
```

Open http://localhost:3000 - you should see the PetForce login page!

## ✅ Verify Everything Works

### Test Registration

1. Go to http://localhost:3000/auth/register
2. Enter:
   - First Name: Test
   - Email: test@example.com
   - Password: TestPass123
3. Click "Create Account"
4. You should see: "Registration successful. Please check your email..."

### Check Email

Since you're running locally, emails go to Inbucket (local email testing):

1. Open http://localhost:54324
2. Click on the email from "test@example.com"
3. You'll see the verification email!

### Test Login

1. Go to http://localhost:3000/auth/login
2. Enter your test credentials
3. Click "Sign In"
4. You should be redirected to the Dashboard!

## 🎨 Development Workflow

### Project Structure

```
PetForce/
├── apps/web/              ← Web app (you'll work here most)
│   ├── src/
│   │   ├── features/auth/ ← Authentication pages
│   │   └── App.tsx
│   └── package.json
│
├── packages/auth/         ← Shared auth logic
│   ├── src/
│   │   ├── api/          ← API calls to Supabase
│   │   ├── types/        ← TypeScript types
│   │   └── utils/        ← Validation, helpers
│   └── package.json
│
└── supabase/
    └── migrations/        ← Database schema changes
```

### Making Changes

**Example: Add a "Last Name" field to registration**

1. **Update the database** (if needed):
   ```bash
   # Users table already has last_name column - no migration needed!
   ```

2. **Update the form** (`apps/web/src/features/auth/pages/RegisterPage.tsx`):
   ```typescript
   const [lastName, setLastName] = useState('');

   // Add input field:
   <input
     type="text"
     value={lastName}
     onChange={(e) => setLastName(e.target.value)}
   />

   // Pass to register function:
   await register({
     email,
     password,
     firstName,
     lastName  // Add this
   });
   ```

3. **Update shared package** (`packages/auth/src/types/auth.ts`):
   ```typescript
   export interface RegisterRequest {
     email: string;
     password: string;
     firstName?: string;
     lastName?: string;  // Already there!
   }
   ```

4. **Test it**:
   ```bash
   # Changes are live! Just refresh the browser
   # No need to restart dev server (Vite hot reload)
   ```

### View Database

```bash
# Open Supabase Studio
open http://localhost:54323

# You can:
# - Browse tables
# - View data
# - Run SQL queries
# - See auth users
```

### Debugging

**Check Supabase logs:**
```bash
supabase functions logs
```

**View database:**
```bash
# Connect with psql
psql postgresql://postgres:postgres@localhost:54322/postgres
```

**Browser DevTools:**
- Network tab: See API requests to Supabase
- Console: See error messages
- Application tab: Check localStorage for tokens

## 📦 Installing New Packages

```bash
# Install in root (for all packages)
npm install some-package

# Install in specific app
cd apps/web
npm install some-package

# Install in shared package
cd packages/auth
npm install some-package
```

## 🏗️ Building Your First Feature

Let's build **"Email Verification Flow"** (Phase 1, Task 1.4):

### Step 1: Understand the Goal

Users need to verify their email before logging in. Currently, registration sends an email but doesn't enforce verification.

### Step 2: Check the Spec

Open: `openspec/changes/add-authentication-system/specs/authentication/spec.md`

Find: "Requirement: Implement Secure Email Verification"

This tells you:
- What needs to happen
- How it should work
- Security requirements

### Step 3: Check Tasks

Open: `openspec/changes/add-authentication-system/tasks.md`

Find section **1.4 Email Verification System**. You'll see:
- [ ] Design email verification email template
- [ ] Set up email service integration
- [ ] Create endpoints
- [ ] Implement token validation
- etc.

### Step 4: Implement

Start with the first unchecked task and work through them sequentially. Each task should be production-ready before moving to the next.

### Step 5: Test

```bash
# Run tests
cd packages/auth
npm test

# Manual testing:
# 1. Register new user
# 2. Check email in Inbucket (localhost:54324)
# 3. Click verification link
# 4. Verify user can now log in
```

### Step 6: Mark Complete

Update `tasks.md`:
```markdown
- [x] Design email verification email template (Thomas, Dexter)
- [x] Set up email service integration (Resend/SendGrid/AWS SES)
```

## 🚦 Common Commands

```bash
# Start everything
npm run dev

# Start web app only
cd apps/web && npm run dev

# Run tests
npm run test

# Type checking
npm run typecheck

# Lint code
npm run lint

# Format code
npm run format

# Build for production
npm run build

# Supabase commands
supabase start         # Start local Supabase
supabase stop          # Stop local Supabase
supabase status        # Check status
supabase db reset      # Reset database (deletes data!)
supabase db push       # Push migrations to cloud
```

## 🎓 Learning Resources

**TypeScript:**
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/)
- VSCode will show type errors inline

**React:**
- [React Docs](https://react.dev/)
- Check existing pages in `apps/web/src/features/` for patterns

**Supabase:**
- [Supabase Docs](https://supabase.com/docs)
- [Auth Guide](https://supabase.com/docs/guides/auth)

**Monorepo:**
- [Turborepo Docs](https://turbo.build/repo/docs)

## 🆘 Getting Help

**Something not working?**

1. Check `supabase status` - is it running?
2. Check `.env` files - correct credentials?
3. Check browser console - any errors?
4. Check terminal - any error messages?

**Common Issues:**

❌ **"Supabase client not initialized"**
→ Check `apps/web/.env` has correct VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

❌ **"Port 3000 already in use"**
→ Kill the process: `lsof -ti:3000 | xargs kill -9`

❌ **"Module not found"**
→ Run `npm install` in root directory

❌ **Database migration errors**
→ `supabase db reset` (warning: deletes all data)

## 🎯 Next Steps

Now that you're set up:

1. **Explore the code**: Look around `apps/web/src/` and `packages/auth/src/`
2. **Read the specs**: Check `openspec/specs/` to understand requirements
3. **Pick a task**: Look at `tasks.md` for Phase 1 tasks
4. **Build incrementally**: Complete one task, test it, then move to the next
5. **Ask questions**: Use the agent system for guidance

**Ready to build?** Pick your first task from Phase 1 and let's go! 🚀

---

**Remember the philosophy:**
> "Pets are part of the family, so let's take care of them as simply as we can."

Keep features simple, reliable, and family-friendly!
