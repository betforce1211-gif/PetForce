# Release Notes: v{{VERSION}}

**Release Date**: {{DATE}}  
**Release Type**: Major / Minor / Patch  

---

## Highlights

*2-3 sentences highlighting the most important changes in this release.*

This release introduces [major feature], improves [area], and fixes [notable bugs]. [Optional: one sentence about impact or benefit].

---

## 🎉 New Features

### [Feature Name]

[One paragraph describing what the feature does and why it's valuable to users.]

**Key capabilities:**
- Capability 1
- Capability 2
- Capability 3

**How to use it:**

1. Navigate to **Location** > **Feature**
2. Click **Action**
3. Configure your settings

```bash
# Example command or code
example-command --new-option
```

[📚 Learn more →](link-to-documentation)

---

### [Another Feature Name]

[Description of the feature and its value.]

**Example:**
```javascript
// Code example showing new feature
const result = newFeature({ option: 'value' });
```

[📚 Learn more →](link-to-documentation)

---

## ✨ Improvements

### [Area/Component]

- **[Improvement title]**: Description of what improved and the impact. ([#123](link-to-pr))
- **[Improvement title]**: Description of improvement. ([#124](link-to-pr))

### [Another Area]

- **[Improvement]**: Description. ([#125](link-to-pr))

### Performance

- Improved [operation] by X% ([#126](link-to-pr))
- Reduced [metric] from X to Y ([#127](link-to-pr))

---

## 🐛 Bug Fixes

- **[Area]**: Fixed issue where [description of problem]. ([#128](link-to-pr))
- **[Area]**: Resolved [description]. ([#129](link-to-pr))
- **[Area]**: Corrected [description]. ([#130](link-to-pr))

---

## ⚠️ Breaking Changes

### [Change Title]

**What changed:**  
[Clear description of what was changed]

**Why:**  
[Reason for the breaking change]

**Who is affected:**  
[Which users/use cases are impacted]

**Migration steps:**

1. **Before the upgrade:**
   ```yaml
   # Old configuration
   old_setting: value
   ```

2. **After the upgrade:**
   ```yaml
   # New configuration
   new_setting: value
   ```

3. **Verify the migration:**
   ```bash
   your-cli config validate
   ```

**Deadline:** Users must migrate by [date] when [old behavior] will be removed.

[📚 Full migration guide →](link-to-migration-guide)

---

### [Another Breaking Change]

**What changed:** [Description]

**Migration:**
```diff
- oldMethod(param)
+ newMethod({ param })
```

---

## 🚨 Deprecations

| Deprecated | Replacement | Removal Version | Notes |
|------------|-------------|-----------------|-------|
| `oldFunction()` | `newFunction()` | v4.0.0 | [Migration guide](link) |
| `legacyEndpoint` | `v2/endpoint` | v4.0.0 | [API docs](link) |
| Old UI feature | New UI feature | v3.5.0 | Enable via settings |

### Using Deprecated Features

You'll see warnings when using deprecated features:

```
⚠️ DEPRECATION WARNING: oldFunction() is deprecated and will be removed in v4.0.0.
   Use newFunction() instead. See: https://docs.example.com/migration
```

---

## 🔒 Security

- **[CVE-XXXX-XXXX]**: [Brief description of the vulnerability and fix]. Severity: High/Medium/Low.
- Upgraded [dependency] to address [vulnerability type].

We recommend all users upgrade to this version immediately.

---

## 📦 Dependency Updates

| Package | Previous | New | Notes |
|---------|----------|-----|-------|
| `package-name` | 1.2.3 | 2.0.0 | Major upgrade |
| `another-package` | 4.5.6 | 4.5.7 | Security patch |

---

## ⚠️ Known Issues

- **[Issue description]** - Workaround: [steps]. Tracking: [#131](link-to-issue)
- **[Issue description]** - Fix planned for v{{NEXT_VERSION}}. [#132](link-to-issue)

---

## 📋 Upgrade Guide

### From v{{PREVIOUS_VERSION}}

**Requirements:**
- Minimum Node.js version: 18.x
- Minimum [dependency]: X.Y.Z

**Steps:**

1. **Backup your configuration**
   ```bash
   cp config.yaml config.yaml.backup
   ```

2. **Update the package**
   ```bash
   npm update your-package
   # or
   yarn upgrade your-package
   ```

3. **Run migrations** (if applicable)
   ```bash
   your-cli migrate
   ```

4. **Update configuration** (if breaking changes apply)
   - See Breaking Changes section above

5. **Verify the upgrade**
   ```bash
   your-cli --version
   your-cli health
   ```

### From Older Versions

If upgrading from a version older than v{{PREVIOUS_VERSION}}, please review the release notes for all intermediate versions.

---

## 📊 Statistics

| Metric | Count |
|--------|-------|
| Commits | XX |
| PRs Merged | XX |
| Issues Closed | XX |
| Contributors | XX |

---

## 🙏 Thank You

Thanks to everyone who contributed to this release!

**Contributors:**
- @username1
- @username2
- @username3

**Special thanks** to [Name] for [specific contribution].

---

## 📚 Resources

- [Full Changelog](link-to-changelog)
- [Documentation](link-to-docs)
- [API Reference](link-to-api)
- [Support](link-to-support)

---

## 📬 Feedback

We'd love to hear your feedback on this release!

- [GitHub Discussions](link)
- [Community Forum](link)
- [Twitter @handle](link)

---

**Full Changelog**: [v{{PREVIOUS_VERSION}}...v{{VERSION}}](github-compare-link)
