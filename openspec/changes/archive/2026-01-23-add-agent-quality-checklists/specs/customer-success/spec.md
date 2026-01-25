# Capability Spec: Customer Success

**Status**: MODIFIED
**Change**: add-agent-quality-checklists
**Owner**: Casey (Customer Success)

## ADDED Requirements

### Requirement: Customer Success SHALL provide customer impact checklist

Customer Success SHALL provide a quality review checklist to ensure customer impact is understood and support readiness is achieved before features proceed through stage gates.

#### Scenario: Complete Customer Success quality checklist
- **GIVEN** a feature ready for customer impact review
- **WHEN** Customer Success evaluates the feature
- **THEN** all checklist items SHALL be evaluated as Yes, No, or N/A
- **AND** "No" items SHALL be documented with customer support risks
- **AND** N/A items SHALL include justification for non-applicability
- **AND** checklist SHALL be signed, dated, and attached to release notes
- **AND** checklist is non-blocking (may ship with support gaps documented)

**Customer Success Quality Checklist (v1.0)**:

1. **Customer Communication**: Customer-facing announcement drafted (release notes, blog post, email)
2. **Support Documentation**: Help center articles created or updated for new feature
3. **FAQ Prepared**: Common questions anticipated and answers documented
4. **Support Team Training**: Support team trained on new feature functionality
5. **User Onboarding**: In-app onboarding or tooltips created for feature discovery
6. **Migration Path**: Existing users have clear migration/upgrade path (if feature changes behavior)
7. **Rollback Communication**: Plan for communicating rollback to customers (if needed)
8. **Feedback Mechanism**: Way for users to provide feedback on new feature (survey, feedback form)
9. **Success Metrics Communication**: How feature success will be measured and communicated to customers
10. **Breaking Changes**: Breaking changes clearly communicated with sufficient notice
11. **Customer Segmentation**: Identified which customer segments benefit most from feature
12. **Support Ticket Tagging**: New tags/categories created for feature-related support tickets
13. **Escalation Path**: Escalation path defined for critical issues with new feature

**Approval Options**:
- [ ] Approved (customer success ready)
- [ ] Approved with Gaps (documentation/training gaps, will address quickly post-launch)
- [ ] Support Unready (significant gaps, recommend delaying launch)

**Support Readiness Gaps**:
- [ ] Documentation incomplete (Issue #: ________)
- [ ] Support team not trained (Issue #: ________)
- [ ] Customer communication not drafted (Issue #: ________)

**Notes**: _____________________________________________________________________________

**Reviewer**: Casey (Customer Success)
**Date**: _________________
**Checklist Version**: 1.0
**Signature**: _________________
