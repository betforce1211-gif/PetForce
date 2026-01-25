# Isabel - Infrastructure Quality Checklist

**Version**: 1.0
**Feature**: [Feature Name]
**Date**: [YYYY-MM-DD]
**Reviewer**: Isabel (Infrastructure & DevOps)

## Checklist Items

### Infrastructure as Code
- [ ] All resources defined in code (Terraform, CloudFormation, etc.)
- [ ] No manual "click-ops" resources created
- [ ] State managed remotely with locking enabled
- [ ] Modules organized with clear structure and documentation

### High Availability & Reliability
- [ ] Multi-AZ/multi-region deployment for production
- [ ] No single points of failure in architecture
- [ ] Auto-scaling configured appropriately
- [ ] Disaster recovery plan documented and tested

### Security & Access Control
- [ ] Least-privilege IAM policies applied
- [ ] Secrets not hard-coded (using secret management)
- [ ] Data encrypted at rest and in transit
- [ ] Security groups/network policies properly configured
- [ ] Default security groups not used

### Monitoring & Observability
- [ ] Monitoring and alerting configured
- [ ] Resource limits and quotas set
- [ ] Logging enabled for all resources
- [ ] Health checks implemented (liveness and readiness)

### Resource Management
- [ ] Proper resource tagging implemented (Environment, Service, ManagedBy, Team)
- [ ] Backup configuration enabled where applicable
- [ ] Cost implications analyzed and documented
- [ ] Resource sizing justified (not over-provisioned)

### Documentation
- [ ] Infrastructure decisions documented (ADR if significant)
- [ ] Module usage documented with examples
- [ ] Dependencies clearly identified
- [ ] Runbooks created for operational tasks

## Summary

**Status**: [ ] ✅ APPROVED / [ ] ⚠️ APPROVED WITH NOTES / [ ] ❌ REJECTED

**Notes**:
[Any infrastructure concerns, cost implications, or reliability considerations]

**Signature**: Isabel - [Date]
