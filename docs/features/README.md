# PetForce Features

This directory contains documentation for all production features that have passed through the PetForce autonomous development workflow.

## Purpose

Each feature folder serves as a **permanent reference** containing:
- **Complete Documentation** - All technical documentation created by Thomas (Documentation Agent)
- **Quality Checklists** - All agent checklists showing ✅ PASSED status
- **Quality Validation History** - Full record of iterative quality validation
- **Implementation Summary** - Timeline, metrics, and key achievements

## Why Feature Folders?

Feature folders provide:
1. **Future Reference** - When improving features, reference the original checklists and requirements
2. **Testing Guide** - Tucker's QA checklist serves as a testing roadmap
3. **Onboarding** - New developers can understand features from comprehensive documentation
4. **Knowledge Preservation** - Competitive research and design decisions are preserved
5. **Quality Standards** - Each feature shows what "production ready" means at PetForce

## Folder Structure

Each feature folder follows this structure:

```
docs/features/{feature-name}/
├── README.md                       # Feature overview and agent approvals
├── documentation/                  # Complete technical documentation
│   ├── ARCHITECTURE.md            # System design and flow diagrams
│   ├── API.md                     # API reference (if applicable)
│   ├── USER_GUIDE.md              # User-facing documentation
│   ├── SECURITY.md                # Security model and best practices
│   ├── SETUP.md                   # Developer setup (if applicable)
│   └── TESTING.md                 # Testing strategy and coverage
├── checklists/                    # Agent quality checklists (all ✅ PASSED)
│   ├── peter-product-checklist.md        # Product requirements
│   ├── tucker-qa-checklist.md            # QA and testing
│   ├── samantha-security-checklist.md    # Security review
│   ├── dexter-ux-checklist.md            # UX design standards
│   ├── engrid-engineering-checklist.md   # Code quality
│   ├── larry-logging-checklist.md        # Logging and observability
│   ├── thomas-docs-checklist.md          # Documentation completeness
│   └── axel-api-checklist.md             # API design (if applicable)
├── quality-validation.md           # Full validation history showing Ralph iterations
└── implementation-summary.md       # Timeline, metrics, and key achievements
```

## Features

### ✅ Production Ready

Features that have completed the full PetForce development workflow:

- **[Email/Password Login](./email-password-login/)** - Email/password authentication with enforced email verification. Unconfirmed users rejected at login with resend functionality. Comprehensive logging with 21 tracked events. ✅ Production Ready (2026-01-25)

### 🚧 In Development

Features currently being implemented:

_None currently in development._

### 📋 Planned

Features with proposals created but not yet implemented:

_Check `openspec/changes/` for planned features._

## How Features Are Created

Features are created through the `/petforce-dev:feature` workflow:

1. **Initial Proposal** - OpenSpec proposal with design and tasks
2. **Multi-Agent Research** - All agents create checklists, Peter researches competitors
3. **User Approval** - Review refined proposal before implementation
4. **Autonomous Implementation** - Ralph-loop implements all tasks
5. **Quality Validation** - Iterate until ALL agent checklists pass (Ralph Method)
6. **Feature Folder Creation** - Create permanent documentation folder
7. **Apply Changes** - Update OpenSpec specs
8. **Archive** - Archive the OpenSpec change

## Using Feature Folders

### For Developers

When working on an existing feature:
1. Read `README.md` for overview
2. Check `documentation/ARCHITECTURE.md` for system design
3. Review `checklists/` to understand quality requirements
4. Reference `implementation-summary.md` for implementation details

### For QA Team

When testing features or planning test improvements:
1. Start with `checklists/tucker-qa-checklist.md`
2. All items marked ✅ PASSED are already tested
3. Use checklist as foundation for additional test scenarios
4. Reference `documentation/TESTING.md` for test strategy

### For Product Team

When planning feature enhancements:
1. Review `checklists/peter-product-checklist.md` for original requirements
2. Check `implementation-summary.md` for Peter's competitive research findings
3. Review `quality-validation.md` to see what edge cases were considered
4. Use this as foundation for planning v2 of the feature

### For Documentation Team

When updating or expanding documentation:
1. Start with existing docs in `documentation/`
2. Check `checklists/thomas-docs-checklist.md` for what's already documented
3. Expand based on user feedback or new use cases
4. Maintain the same structure and quality standard

### For Security Team

When auditing or improving security:
1. Review `checklists/samantha-security-checklist.md` for security items validated
2. Read `documentation/SECURITY.md` for security model
3. Check `quality-validation.md` for security concerns addressed
4. Use as baseline for ongoing security reviews

## Feature Status Legend

- ✅ **Production Ready** - All agent checklists passed, deployed to production
- 🚧 **In Development** - Implementation in progress
- 📋 **Planned** - Proposal created, not yet implemented
- 🔄 **Iterating** - Quality validation in progress (Ralph Method)
- ⚠️ **Needs Rework** - Failed validation, requires fixes

## Contributing

To add a new feature, use the `/petforce-dev:feature` command. This will:
- Create the OpenSpec change proposal
- Coordinate multi-agent research and checklists
- Implement the feature autonomously
- Validate against all quality checklists
- Create the permanent feature folder automatically

Never create feature folders manually - they are generated automatically as part of the autonomous development workflow.

## Questions?

- See `AUTONOMOUS-DEVELOPMENT.md` for the complete workflow
- See `.claude/commands/petforce-dev/feature.md` for command documentation
- See `openspec/AGENTS.md` for agent responsibilities and checklists
