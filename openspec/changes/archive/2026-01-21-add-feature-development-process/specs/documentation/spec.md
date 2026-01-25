# Capability: Documentation

## ADDED Requirements

### Requirement: Document Feature Quality Checklists in Release Notes
The system SHALL include quality checklist summaries and links in release notes for audit and transparency.

#### Scenario: Create release notes with checklist summary
- **GIVEN** features ready for release
- **WHEN** creating release notes
- **THEN** release notes SHALL include checklist summary for each feature
- **AND** checklist summary SHALL show approval status for each agent (✅ Approved, ⚠️ With Notes, ❌ Rejected)
- **AND** checklist summary SHALL list which agents reviewed the feature
- **AND** release notes SHALL link to full checklist documentation

#### Scenario: Attach full checklists to release
- **GIVEN** completed quality checklists for features
- **WHEN** finalizing release documentation
- **THEN** all completed checklists SHALL be stored in release directory
- **AND** directory structure SHALL be `releases/v[X.Y.Z]/checklists/[agent]-[feature].md`
- **AND** checklists SHALL include agent signature and date
- **AND** checklists SHALL document version number used

#### Scenario: Highlight checklist concerns in release notes
- **GIVEN** checklists with approval notes or concerns
- **WHEN** writing release notes
- **THEN** significant concerns SHALL be highlighted in release notes
- **AND** follow-up items SHALL be listed
- **AND** any exemptions granted SHALL be documented
- **AND** technical debt items SHALL be referenced

### Requirement: Maintain Release Directory Structure
The system SHALL organize release documentation including checklists in consistent structure.

#### Scenario: Create release documentation directory
- **GIVEN** a new release being prepared
- **WHEN** setting up release documentation
- **THEN** directory SHALL be created at `releases/v[X.Y.Z]/`
- **AND** subdirectories SHALL include `checklists/`, `artifacts/`, `runbooks/`
- **AND** release-notes.md SHALL be created at root of release directory
- **AND** README.md SHALL explain directory structure

#### Scenario: Archive release documentation
- **GIVEN** a release successfully deployed
- **WHEN** archiving release
- **THEN** all checklists SHALL be preserved
- **AND** release notes SHALL be finalized
- **AND** deployment artifacts SHALL be stored
- **AND** post-deployment review notes SHALL be added

### Requirement: Template Release Notes Structure
The system SHALL provide release notes template including checklist sections.

#### Scenario: Use release notes template
- **GIVEN** a new release being documented
- **WHEN** creating release notes
- **THEN** template SHALL include: Release metadata, Features with checklists, Improvements, Bug Fixes, Breaking Changes, Upgrade Instructions
- **AND** template SHALL have placeholder for checklist summary table
- **AND** template SHALL include section for process notes/learnings
- **AND** template SHALL reference full checklist documentation

#### Scenario: Validate release notes completeness
- **GIVEN** release notes being finalized
- **WHEN** reviewing completeness
- **THEN** all features SHALL have checklist summaries
- **AND** all breaking changes SHALL be documented
- **AND** upgrade instructions SHALL be included if needed
- **AND** links to full checklists SHALL be valid
