# Isabel Infrastructure Agent - Quick Start Guide

Set up production-ready cloud infrastructure in 15 minutes.

## Prerequisites

- AWS CLI configured with appropriate credentials
- Terraform >= 1.5.0
- kubectl
- Helm >= 3.0

---

## Step 1: Set Up Terraform Backend

First, create the S3 bucket and DynamoDB table for Terraform state:

```bash
# Create S3 bucket for state
aws s3api create-bucket \
  --bucket myproject-terraform-state \
  --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket myproject-terraform-state \
  --versioning-configuration Status=Enabled

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket myproject-terraform-state \
  --server-side-encryption-configuration '{
    "Rules": [{"ApplyServerSideEncryptionByDefault": {"SSEAlgorithm": "AES256"}}]
  }'

# Create DynamoDB table for locking
aws dynamodb create-table \
  --table-name terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

---

## Step 2: Create Project Structure

```bash
mkdir -p terraform/{modules,environments/{dev,staging,production},global}
mkdir -p k8s/{base,overlays/{dev,staging,production}}

# Copy Isabel's templates
cp isabel-infrastructure-agent/templates/eks-cluster.tf.template \
   terraform/modules/eks/main.tf

cp isabel-infrastructure-agent/templates/k8s-deployment.yaml.template \
   k8s/base/deployment.yaml
```

Project structure:
```
terraform/
├── modules/
│   ├── vpc/
│   ├── eks/
│   └── rds/
├── environments/
│   ├── dev/
│   ├── staging/
│   └── production/
└── global/
    └── iam/

k8s/
├── base/
│   ├── deployment.yaml
│   ├── service.yaml
│   └── kustomization.yaml
└── overlays/
    ├── dev/
    ├── staging/
    └── production/
```

---

## Step 3: Configure VPC

Create `terraform/modules/vpc/main.tf`:

```hcl
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "${var.project}-${var.environment}-vpc"
  cidr = var.vpc_cidr

  azs             = var.availability_zones
  private_subnets = [for i, az in var.availability_zones : cidrsubnet(var.vpc_cidr, 4, i)]
  public_subnets  = [for i, az in var.availability_zones : cidrsubnet(var.vpc_cidr, 4, i + 4)]

  enable_nat_gateway     = true
  single_nat_gateway     = var.environment != "production"
  enable_dns_hostnames   = true
  enable_dns_support     = true

  # Tags for EKS
  public_subnet_tags = {
    "kubernetes.io/role/elb" = 1
  }

  private_subnet_tags = {
    "kubernetes.io/role/internal-elb" = 1
  }

  tags = var.tags
}
```

---

## Step 4: Configure Production Environment

Create `terraform/environments/production/main.tf`:

```hcl
terraform {
  required_version = ">= 1.5.0"

  backend "s3" {
    bucket         = "myproject-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-locks"
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.region

  default_tags {
    tags = {
      Environment = "production"
      Project     = var.project
      ManagedBy   = "terraform"
    }
  }
}

locals {
  project     = "myproject"
  environment = "production"
  region      = "us-east-1"
  
  azs = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

# VPC
module "vpc" {
  source = "../../modules/vpc"

  project            = local.project
  environment        = local.environment
  vpc_cidr           = "10.0.0.0/16"
  availability_zones = local.azs

  tags = {
    Environment = local.environment
  }
}

# EKS
module "eks" {
  source = "../../modules/eks"

  project            = local.project
  environment        = local.environment
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids

  cluster_version = "1.29"

  # Node groups
  system_node_instance_types = ["t3.medium"]
  system_node_min_size       = 2
  system_node_max_size       = 4
  system_node_desired_size   = 2

  general_node_instance_types = ["m5.large", "m5.xlarge"]
  general_node_capacity_type  = "SPOT"
  general_node_min_size       = 3
  general_node_max_size       = 20
  general_node_desired_size   = 3

  tags = {
    Environment = local.environment
  }
}
```

---

## Step 5: Deploy Infrastructure

```bash
cd terraform/environments/production

# Initialize Terraform
terraform init

# Review the plan
terraform plan -out=tfplan

# Apply (after review)
terraform apply tfplan
```

---

## Step 6: Configure kubectl

```bash
# Update kubeconfig
aws eks update-kubeconfig \
  --name myproject-production-eks \
  --region us-east-1

# Verify connection
kubectl get nodes
```

---

## Step 7: Deploy Application

Create `k8s/overlays/production/kustomization.yaml`:

```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: production

resources:
  - ../../base

patches:
  - patch: |-
      - op: replace
        path: /spec/replicas
        value: 3
    target:
      kind: Deployment
      name: api-server

configMapGenerator:
  - name: api-server-config
    literals:
      - NODE_ENV=production
      - LOG_LEVEL=info

images:
  - name: api-server
    newName: myregistry/api-server
    newTag: v1.2.3
```

Deploy:

```bash
kubectl apply -k k8s/overlays/production/
```

---

## Step 8: Verify Deployment

```bash
# Check pods
kubectl get pods -n production

# Check HPA
kubectl get hpa -n production

# Check services
kubectl get svc -n production

# View logs
kubectl logs -f deployment/api-server -n production
```

---

## Resource Sizing Guide

### Node Instance Types

| Workload | Instance Type | vCPU | Memory | Use Case |
|----------|---------------|------|--------|----------|
| System | t3.medium | 2 | 4 GB | CoreDNS, metrics |
| General | m5.large | 2 | 8 GB | Web apps, APIs |
| Compute | c5.xlarge | 4 | 8 GB | CPU-intensive |
| Memory | r5.large | 2 | 16 GB | Caching, analytics |

### Pod Resources

```yaml
# Small service
resources:
  requests:
    cpu: 100m
    memory: 128Mi
  limits:
    cpu: 500m
    memory: 256Mi

# Medium service
resources:
  requests:
    cpu: 250m
    memory: 512Mi
  limits:
    cpu: 1000m
    memory: 1Gi

# Large service
resources:
  requests:
    cpu: 500m
    memory: 1Gi
  limits:
    cpu: 2000m
    memory: 2Gi
```

---

## Cost Optimization Checklist

- [ ] Use Spot instances for stateless workloads
- [ ] Enable Cluster Autoscaler
- [ ] Set appropriate resource requests/limits
- [ ] Use Reserved Instances for baseline
- [ ] Schedule dev/test environments off-hours
- [ ] Enable S3 Intelligent Tiering
- [ ] Review and delete unused resources
- [ ] Set up cost alerts

---

## Reliability Checklist

- [ ] Deploy across 3 AZs minimum
- [ ] Configure health checks (liveness, readiness)
- [ ] Set up HPA for auto-scaling
- [ ] Configure PodDisruptionBudget
- [ ] Enable pod anti-affinity
- [ ] Set up monitoring and alerting
- [ ] Configure backups
- [ ] Document runbooks

---

## Security Checklist

- [ ] Private subnets for workloads
- [ ] VPC endpoints for AWS services
- [ ] IRSA for pod IAM
- [ ] Secrets encryption with KMS
- [ ] Network policies enabled
- [ ] Pod security contexts
- [ ] Image scanning in CI/CD
- [ ] Audit logging enabled

---

## Troubleshooting

### Terraform state lock
```bash
terraform force-unlock <LOCK_ID>
```

### Node not joining cluster
```bash
# Check node status
kubectl describe node <node-name>

# Check kubelet logs (on node)
journalctl -u kubelet -f
```

### Pod stuck in Pending
```bash
kubectl describe pod <pod-name>
# Check events for scheduling issues
```

### HPA not scaling
```bash
kubectl describe hpa <hpa-name>
# Ensure metrics-server is running
kubectl get pods -n kube-system | grep metrics
```

---

## Next Steps

1. 📖 Read the full [ISABEL.md](./ISABEL.md) documentation
2. 🔒 Set up security with Samantha
3. 📊 Add monitoring with Larry
4. 🚀 Configure CI/CD with Chuck
5. 💰 Review cost optimization recommendations

---

*Isabel: Infrastructure as code. Reliability as culture. Scale as needed.* ☁️
