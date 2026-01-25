# ☁️ Isabel: The Infrastructure & DevOps Agent

> *Infrastructure as code. Reliability as culture. Scale as needed.*

Isabel is a comprehensive Infrastructure & DevOps agent powered by Claude Code. She builds scalable, reliable, and cost-effective cloud infrastructure. When Isabel architects your infrastructure, it scales smoothly, fails gracefully, and costs only what it should.

## ✨ Features

| Feature | Description |
|---------|-------------|
| **Infrastructure as Code** | Terraform modules, state management, GitOps |
| **Kubernetes** | EKS/GKE/AKS, Helm charts, auto-scaling |
| **High Availability** | Multi-AZ, multi-region, disaster recovery |
| **Cost Optimization** | Right-sizing, reserved capacity, spot instances |
| **Reliability** | SLOs/SLIs, chaos engineering, incident response |
| **Security** | Network segmentation, encryption, IAM |

## 📁 Package Contents

```
isabel-infrastructure-agent/
├── ISABEL.md                             # Full infrastructure documentation
├── CLAUDE.md                             # Claude Code agent configuration
├── README.md                             # This file
├── QUICKSTART.md                         # 10-minute setup guide
├── .isabel.yml                           # Infrastructure configuration
└── templates/
    ├── eks-cluster.tf.template           # EKS Terraform module
    └── k8s-deployment.yaml.template      # Production K8s deployment
```

## 🚀 Quick Start

### 1. Copy files to your project

```bash
cp isabel-infrastructure-agent/.isabel.yml your-repo/
cp -r isabel-infrastructure-agent/templates your-repo/terraform/
```

### 2. Initialize Terraform

```bash
cd terraform/environments/production
terraform init
terraform plan
```

### 3. Deploy Kubernetes workloads

```bash
kubectl apply -f k8s/production/
```

**[📖 Full Setup Guide →](./QUICKSTART.md)**

## 🏗️ Architecture Patterns

### Multi-Tier Architecture
```
Internet → CDN/WAF → Load Balancer → App Tier → Cache/Queue → Database
```

### High Availability
```
┌─────────────────────────────────────────────┐
│              Region: us-east-1              │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐    │
│  │  AZ-1a  │  │  AZ-1b  │  │  AZ-1c  │    │
│  │  ┌───┐  │  │  ┌───┐  │  │  ┌───┐  │    │
│  │  │App│  │  │  │App│  │  │  │App│  │    │
│  │  └───┘  │  │  └───┘  │  │  └───┘  │    │
│  └─────────┘  └─────────┘  └─────────┘    │
└─────────────────────────────────────────────┘
```

## ☸️ Kubernetes Features

### Node Groups
| Pool | Instance Type | Capacity | Use Case |
|------|---------------|----------|----------|
| system | t3.medium | On-Demand | CoreDNS, metrics |
| general | m5.large | 70% Spot | Stateless apps |
| compute | c5.xlarge | 100% Spot | CPU-intensive |
| memory | r5.large | On-Demand | Memory-intensive |

### Auto-Scaling
- **HPA**: Scale pods based on CPU/memory/custom metrics
- **Cluster Autoscaler**: Scale nodes based on pending pods
- **Karpenter**: Just-in-time node provisioning

## 💰 Cost Optimization

| Strategy | Savings | Use Case |
|----------|---------|----------|
| Reserved Instances | 40-60% | Predictable baseline |
| Spot Instances | Up to 90% | Fault-tolerant workloads |
| Right-sizing | 20-50% | Over-provisioned resources |
| Scheduling | 65% | Dev/test environments |

## 🛡️ Reliability Targets

| Environment | Availability | Downtime/Year |
|-------------|--------------|---------------|
| Development | 99% | 3.65 days |
| Staging | 99.5% | 1.83 days |
| Production | 99.9% | 8.76 hours |
| Critical | 99.99% | 52.6 minutes |

## 🤖 Using with Claude Code

```
You: Set up a production EKS cluster

Isabel: 🏗️ EKS Cluster Configuration

I'll create a production-ready EKS cluster with:

Cluster:
• Version: 1.29
• Private + Public endpoint
• Secrets encryption (KMS)
• Audit logging enabled

Node Groups:
• system: 2x t3.medium (On-Demand)
• general: 3-20x m5.large (70% Spot)
• compute: 0-10x c5.xlarge (100% Spot)

Add-ons:
• VPC CNI with prefix delegation
• CoreDNS (HA)
• AWS Load Balancer Controller
• Cluster Autoscaler
• External DNS
• Cert Manager

Networking:
• Private subnets for nodes
• NAT Gateway per AZ
• VPC endpoints for AWS services

Shall I generate the Terraform?
```

## 🎯 Isabel's Commands

### Terraform
```bash
isabel tf init --environment production
isabel tf plan --environment production
isabel tf apply --environment production
```

### Kubernetes
```bash
isabel deploy --app api-server --env production
isabel scale --app api-server --replicas 5
isabel rollback --app api-server --revision 3
```

### Cost
```bash
isabel cost analyze --period 30d
isabel cost optimize
isabel cost report --format html
```

### Reliability
```bash
isabel cluster status
isabel dr test --region us-west-2
isabel slo report
```

## 🤝 Integration with Other Agents

| Agent | Integration |
|-------|-------------|
| **Chuck** | CI/CD pipeline infrastructure |
| **Samantha** | Security controls, encryption |
| **Larry** | Logging infrastructure |
| **Ana** | Analytics data infrastructure |

## 📋 Configuration

Isabel uses `.isabel.yml`:

```yaml
version: 1

provider:
  name: aws
  region: us-east-1

kubernetes:
  cluster:
    version: "1.29"
  nodeGroups:
    general:
      instanceTypes: [m5.large]
      minSize: 3
      maxSize: 20
      spotPercentage: 70

cost:
  budget:
    monthly: 10000
  optimization:
    rightSizing: true
    spotInstances: true

dr:
  strategy: warm-standby
  rto: 30  # minutes
  rpo: 5   # minutes
```

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [ISABEL.md](./ISABEL.md) | Complete infrastructure documentation |
| [CLAUDE.md](./CLAUDE.md) | Claude Code configuration |
| [QUICKSTART.md](./QUICKSTART.md) | 10-minute setup guide |

## 📋 Templates

| Template | Use For |
|----------|---------|
| `eks-cluster.tf.template` | Production EKS with IRSA |
| `k8s-deployment.yaml.template` | Production K8s deployment |

---

<p align="center">
  <strong>Isabel: Your Infrastructure Partner</strong><br>
  <em>Building foundations that scale.</em>
</p>

---

*Infrastructure as code. Reliability as culture. Scale as needed.* ☁️
