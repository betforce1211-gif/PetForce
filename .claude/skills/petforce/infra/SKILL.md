# Infrastructure & DevOps Skill

This skill provides comprehensive infrastructure knowledge, patterns, and best practices for cloud infrastructure, Infrastructure as Code (IaC), and Kubernetes deployments.

## Core Knowledge Areas

### Infrastructure as Code (IaC)

#### Terraform Best Practices
- **Module Structure**: Organized modules with main.tf, variables.tf, outputs.tf, versions.tf
- **Naming Conventions**: `[environment]-[service]-[resource-type]` pattern
- **State Management**: Remote state with S3 backend and DynamoDB locking
- **Standard Tagging**: Environment, Service, ManagedBy, Team tags on all resources

#### VPC Architecture
- Multi-AZ deployment (minimum 3 availability zones)
- Three-tier subnets: public, private, database
- NAT Gateway per AZ for high availability
- VPC Flow Logs enabled for security monitoring
- VPC Endpoints for AWS service access (S3, DynamoDB, ECR, etc.)

#### Example VPC Module Structure
```hcl
modules/vpc/
├── main.tf           # VPC, subnets, NAT gateways, route tables
├── variables.tf      # vpc_cidr, availability_zones, enable_nat_gateway
├── outputs.tf        # vpc_id, subnet_ids, nat_gateway_ips
├── versions.tf       # Terraform and provider versions
└── README.md         # Usage documentation
```

### Kubernetes Deployment

#### Production-Ready Deployment Pattern
```yaml
# Essential components for every deployment:
# 1. Resource requests and limits
# 2. Liveness and readiness probes
# 3. Pod anti-affinity for HA
# 4. Topology spread constraints
# 5. HorizontalPodAutoscaler
# 6. PodDisruptionBudget
# 7. Security context (non-root, read-only filesystem)
```

#### Namespace Strategy
- **System namespaces**: kube-system, monitoring, logging, ingress-nginx, cert-manager
- **Application namespaces**: production, staging, development (per environment)
- **Team namespaces**: Optional for multi-tenant clusters

#### Node Pool Strategy
- **system**: t3.medium, 2-4 nodes, on-demand (CoreDNS, metrics)
- **general**: m5.large, 3-20 nodes, 70% spot (stateless apps)
- **compute**: c5.xlarge, 0-10 nodes, 100% spot (CPU-intensive)
- **memory**: r5.large, 0-5 nodes, on-demand (memory-intensive)
- **persistent**: m5.large, 3 nodes, on-demand (stateful workloads)

### High Availability Patterns

#### Availability Targets
- **Development**: 99% (3.65 days/year downtime)
- **Staging**: 99.5% (1.83 days/year downtime)
- **Production**: 99.9% (8.76 hours/year downtime)
- **Critical**: 99.99% (52.6 minutes/year downtime)

#### Disaster Recovery Strategies

| Strategy | RTO | RPO | Cost | Use Case |
|----------|-----|-----|------|----------|
| Backup/Restore | Hours | Hours | $ | Non-critical, cost-sensitive |
| Pilot Light | Minutes | Minutes | $$ | Core components always ready |
| Warm Standby | Minutes | Seconds | $$$ | Quick recovery needed |
| Active-Active | Zero | Zero | $$$$ | Zero downtime requirement |

### Cost Optimization

#### Compute Optimization
1. Right-size instances using AWS Compute Optimizer / GCP Recommender
2. Reserved Instances for predictable baseline (40-60% savings)
3. Spot/Preemptible for fault-tolerant workloads (up to 90% savings)
4. Scale to zero for non-production environments
5. Schedule dev/test environments for off-hours

#### Storage Optimization
1. Use appropriate storage classes (S3 tiers, EBS types)
2. Lifecycle policies for automated transitions
3. Delete unused snapshots and volumes
4. Compress and deduplicate data
5. Archive cold data to Glacier/Deep Archive

#### Network Optimization
1. VPC endpoints to avoid NAT Gateway costs
2. Minimize cross-AZ traffic
3. CDN for static content delivery
4. Compress API responses
5. Consider NAT instance alternatives for dev/test

### Security Best Practices

#### Defense in Depth
- **Network**: Security groups, NACLs, WAF, VPC Flow Logs
- **Identity**: IAM least privilege, MFA, IRSA for Kubernetes
- **Data**: Encryption at rest (KMS), encryption in transit (TLS)
- **Secrets**: Never hard-code, use AWS Secrets Manager / HashiCorp Vault
- **Monitoring**: GuardDuty, Security Hub, CloudWatch alarms

#### Kubernetes Security
- Security context (runAsNonRoot, readOnlyRootFilesystem)
- Drop all capabilities, add only what's needed
- Network policies for pod-to-pod communication
- Pod Security Standards (restricted profile)
- RBAC with least privilege
- Secrets encryption with KMS

## Infrastructure Checklist

Use this checklist for all infrastructure changes:

### Infrastructure as Code
- [ ] All resources defined in code (no click-ops)
- [ ] State managed remotely with locking
- [ ] Modules organized and documented
- [ ] Provider versions pinned

### High Availability
- [ ] Multi-AZ deployment for production
- [ ] No single points of failure
- [ ] Auto-scaling configured
- [ ] Disaster recovery tested

### Security
- [ ] Least-privilege IAM policies
- [ ] Secrets not hard-coded
- [ ] Encryption at rest and in transit
- [ ] Security groups properly configured
- [ ] VPC Flow Logs enabled

### Monitoring
- [ ] Monitoring and alerting configured
- [ ] Resource limits set
- [ ] Logging enabled
- [ ] Health checks implemented

### Resource Management
- [ ] Proper resource tagging
- [ ] Backup configuration enabled
- [ ] Cost implications analyzed
- [ ] Resources right-sized

### Documentation
- [ ] Infrastructure decisions documented
- [ ] Module usage examples provided
- [ ] Dependencies identified
- [ ] Runbooks created

## Reliability Engineering

### SLO Components
- **SLI (Service Level Indicator)**: Quantitative measure (latency, error rate, availability)
- **SLO (Service Level Objective)**: Target value for SLI (99.9% of requests < 200ms)
- **SLA (Service Level Agreement)**: Contract with consequences (99.9% uptime or credits)
- **Error Budget**: Inverse of SLO (0.1% = 43.8 minutes/month allowed downtime)

### Recovery Objectives
**RTO (Recovery Time Objective)**:
- Critical: < 15 minutes
- High: < 1 hour
- Medium: < 4 hours
- Low: < 24 hours

**RPO (Recovery Point Objective)**:
- Critical: 0 (synchronous replication)
- High: < 5 minutes
- Medium: < 1 hour
- Low: < 24 hours

## Configuration Templates

### .isabel.yml Configuration
```yaml
version: 1

provider:
  name: aws
  region: us-east-1

terraform:
  version: ">= 1.5.0"
  backend:
    type: s3
    config:
      bucket: "${project.name}-terraform-state"
      encrypt: true
      dynamodb_table: terraform-locks

networking:
  vpc:
    cidr: "10.0.0.0/16"
    azCount: 3
    natGateway:
      enabled: true
      singleNatGateway: false  # One per AZ for HA

kubernetes:
  cluster:
    version: "1.29"
  nodeGroups:
    system:
      instanceTypes: [t3.medium]
      scaling: {minSize: 2, maxSize: 4}
    general:
      instanceTypes: [m5.large, m5.xlarge]
      capacityType: SPOT
      scaling: {minSize: 3, maxSize: 20}

cost:
  budget:
    monthly:
      development: 1000
      staging: 2000
      production: 10000
  tags:
    required: [Environment, Service, Team, ManagedBy]
```

## Commands Reference

### Terraform Operations
```bash
# Initialize and plan
isabel tf init --environment production
isabel tf plan --environment production

# Apply changes
isabel tf apply --environment production

# Show state
isabel tf state list
isabel tf state show aws_eks_cluster.main
```

### Kubernetes Operations
```bash
# Deploy application
isabel deploy --app api-server --env production

# Scale deployment
isabel scale --app api-server --replicas 5

# Get cluster status
isabel cluster status
isabel cluster nodes
```

### Cost Operations
```bash
# Analyze costs
isabel cost analyze --period 30d

# Get recommendations
isabel cost optimize

# Show budget status
isabel cost budget
```

### Infrastructure Validation
```bash
# Validate configuration
isabel validate --all

# Security audit
isabel audit security

# DR drill
isabel dr test --region us-west-2
```

## Integration Points

### With CI/CD (Chuck)
- Provide infrastructure for deployments
- Terraform plan/apply in pipelines
- Kubernetes deployment manifests
- Auto-scaling configuration

### With Security (Samantha)
- Implement security requirements
- Network segmentation and policies
- Encryption configuration
- IAM role management

### With Logging (Larry)
- Provision logging infrastructure
- Configure log shipping
- Set up log storage (S3, CloudWatch)
- Log retention policies

### With Analytics (Ana)
- Data infrastructure (warehouses, lakes)
- ETL pipeline infrastructure
- Real-time streaming setup
- Data storage optimization

## Common Patterns

### Multi-Tier Web Application
```
Internet
  ↓
CDN/WAF (CloudFront)
  ↓
Load Balancer (ALB)
  ↓
App Containers (EKS Pods)
  ↓
Service Mesh (Istio/Linkerd)
  ↓
├─ Database (RDS Multi-AZ)
├─ Cache (ElastiCache Redis)
└─ Queue (SQS/Kafka)
```

### Scaling Strategy Decision Tree
- **Stateless apps** → Horizontal scaling (HPA)
- **Databases** → Vertical scaling + read replicas
- **Batch jobs** → Spot instances + autoscaling
- **Real-time** → On-demand with reserved baseline

## Response Templates

### Infrastructure Review Format
```
🏗️ Infrastructure Review: [Environment]

Overall Health: [Status]

Cluster Status:
┌──────────────┬──────────────┬──────────────┐
│ Component    │ Status       │ Details      │
├──────────────┼──────────────┼──────────────┤
│ [Component]  │ [Status]     │ [Details]    │
└──────────────┴──────────────┴──────────────┘

Resource Utilization:
• CPU: [X]% average
• Memory: [X]% average
• Storage: [Used] / [Total]

Cost: $[X] / $[Budget]

Recommendations:
1. [Recommendation]
2. [Recommendation]
```

### Cost Optimization Format
```
💰 Cost Optimization: [Scope]

Current Spend: $[X]/month
Potential Savings: $[X]/month ([X]%)

Recommendations:

1. **[Category]** - Save $[X]/month
   [Details and action items]

Implementation Priority:
• Quick wins (< 1 day): [list]
• Medium effort (< 1 week): [list]
• Longer term (> 1 week): [list]
```

## Key Principles

1. **Infrastructure as Code**: Never click-ops, always codify
2. **High Availability**: Design for failure, multi-AZ minimum
3. **Security First**: Defense in depth, least privilege, encryption
4. **Cost Conscious**: Right-size, optimize, monitor
5. **Observability**: Monitor, log, alert on everything
6. **Documentation**: Decisions, runbooks, architecture diagrams
7. **Automation**: Automate repetitive tasks, reduce human error
8. **Reliability**: SLOs, error budgets, disaster recovery plans
