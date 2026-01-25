# PetForce Releases

This directory contains release documentation for all PetForce product releases, including completed quality checklists as evidence of thorough review.

## Directory Structure

```
releases/
├── README.md                    # This file
├── templates/                   # Release documentation templates
│   ├── release-notes.md        # Release notes template
│   └── checklist-summary.md    # Checklist summary template
└── v[X.Y.Z]/                   # Individual releases
    ├── release-notes.md        # Release notes with checklist summary
    ├── checklists/             # Completed quality checklists
    │   ├── peter-requirements-[feature].md
    │   ├── tucker-testing-[feature].md
    │   ├── samantha-security-[feature].md
    │   └── ...
    ├── artifacts/              # Deployment artifacts (optional)
    └── runbooks/               # Post-deployment runbooks (optional)
```

## Creating a New Release

### 1. Create Release Directory

```bash
mkdir -p releases/v[X.Y.Z]/{checklists,artifacts,runbooks}
```

### 2. Collect Completed Checklists

Copy all completed feature checklists to `releases/v[X.Y.Z]/checklists/`:
- Use naming: `[agent]-[checklist-type]-[feature-name].md`
- Example: `samantha-security-user-authentication.md`

### 3. Create Release Notes

Use the template at `releases/templates/release-notes.md`:
- Fill in release metadata
- List features with checklist summaries
- Include full checklist links
- Document improvements, bug fixes, breaking changes

### 4. Validate Completeness

Before finalizing:
- [ ] All features have completed checklists
- [ ] Blocking checklists are approved (Peter, Tucker, Samantha, Chuck)
- [ ] Checklist summary table is complete
- [ ] Links to full checklists are valid
- [ ] Breaking changes are documented
- [ ] Upgrade instructions provided (if needed)

## Release Notes Format

### Checklist Summary Table

Every feature in release notes MUST include checklist status:

```markdown
| Agent | Checklist | Status |
|-------|-----------|--------|
| Peter | Requirements | ✅ Approved |
| Dexter | UI Design | ✅ Approved |
| Engrid | Implementation | ⚠️ Approved with Notes |
| Tucker | Testing | ✅ Approved |
| Samantha | Security | ✅ Approved |
| Thomas | Documentation | ⚠️ Approved with Notes |
| Chuck | Deployment | ✅ Approved |
| Larry | Monitoring | ✅ Approved |
```

**Status Icons**:
- ✅ Approved - All items passed
- ⚠️ Approved with Notes - Passed with minor concerns documented
- ❌ Rejected - Blocked (should not appear in released features)
- 🚫 Exempted - Exemption granted with documented reason

## Audit Trail

Completed checklists in release directories serve as:
- **Evidence** of thorough review
- **Audit trail** for compliance
- **Learning** for process improvement
- **Accountability** for quality decisions

## Version History

Checklists evolve over time. Each completed checklist documents which version was used:
- Checklist Version: v1.0, v1.1, v2.0, etc.
- Allows tracking process improvements
- Helps understand historical context

## Examples

See example releases:
- (To be added after first FDP release)

## Questions?

- **Release Process**: Thomas (Documentation)
- **Checklist Questions**: Individual agent owners
- **FDP Process**: Peter (Product Management)
