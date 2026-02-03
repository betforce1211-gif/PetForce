# Infrastructure & DevOps Guide

**Owner**: Isabel (Infrastructure Agent)
**Last Updated**: 2026-02-02

This guide provides comprehensive infrastructure and DevOps practices for PetForce. Isabel ensures our infrastructure is reliable, scalable, secure, and cost-effective.

---

## Table of Contents

1. [Infrastructure Philosophy](#infrastructure-philosophy)
2. [Cloud Architecture](#cloud-architecture)
3. [Infrastructure as Code (IaC)](#infrastructure-as-code-iac)
4. [Kubernetes & Container Orchestration](#kubernetes--container-orchestration)
5. [Deployment Strategies](#deployment-strategies)
6. [Monitoring & Observability](#monitoring--observability)
7. [Security & Compliance](#security--compliance)
8. [Cost Optimization](#cost-optimization)
9. [Disaster Recovery & Business Continuity](#disaster-recovery--business-continuity)
10. [Infrastructure Checklist](#infrastructure-checklist)

---

## Infrastructure Philosophy

### Core Principles

1. **Infrastructure as Code (IaC)** - All infrastructure is versioned, reviewable, and reproducible
2. **Immutable Infrastructure** - Replace, don't modify (no SSH-ing into servers to fix things)
3. **Defense in Depth** - Multiple layers of security (network, application, data)
4. **Observability First** - You can't fix what you can't see
5. **Cost-Aware Architecture** - Every resource has a business justification
6. **High Availability** - Design for failure, build resilient systems
7. **Automated Everything** - Manual processes are error-prone and slow

### The Pet vs Cattle Mindset

**Traditional "Pet" Servers** (AVOID):

- Manually configured
- Irreplaceable (if it dies, panic ensues)
- Patched and updated in place
- Unique snowflakes

**Modern "Cattle" Servers** (EMBRACE):

- Automatically provisioned from code
- Replaceable (if it dies, spin up another)
- Immutable (never patched, always replaced)
- Identical and interchangeable

---

## Cloud Architecture

### Multi-Tier Architecture

PetForce uses a classic three-tier architecture with modern cloud-native enhancements:

```
┌─────────────────────────────────────────────────────────────┐
│                         CloudFront CDN                      │
│                    (Static Assets, Edge Caching)            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Application Load Balancer                │
│              (HTTPS Termination, WAF, Health Checks)        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Presentation Tier                      │
│                    (Next.js App, React Native)              │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   ECS Task  │  │   ECS Task  │  │   ECS Task  │        │
│  │  (us-east)  │  │  (us-west)  │  │  (us-east)  │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       Application Tier                      │
│                   (Node.js APIs, Business Logic)            │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   ECS Task  │  │   ECS Task  │  │   ECS Task  │        │
│  │   (API 1)   │  │   (API 2)   │  │   (API 3)   │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                             │
│  ┌─────────────────────────────────────────────────┐       │
│  │              Redis ElastiCache                  │       │
│  │         (Session Store, Rate Limiting)          │       │
│  └─────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                          Data Tier                          │
│                                                             │
│  ┌──────────────────────┐    ┌──────────────────────┐      │
│  │   PostgreSQL RDS     │    │      S3 Buckets      │      │
│  │  (Primary + Replica) │    │  (User Uploads, Logs)│      │
│  └──────────────────────┘    └──────────────────────┘      │
│                                                             │
│  ┌──────────────────────┐    ┌──────────────────────┐      │
│  │    DynamoDB          │    │   Secrets Manager    │      │
│  │ (Activity Logs, Etc) │    │   (API Keys, Certs)  │      │
│  └──────────────────────┘    └──────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### AWS Account Structure

**Multi-Account Strategy** (Recommended):

```
Root Account (Organization)
├── Dev Account (Sandbox, experimentation)
├── Staging Account (Pre-production, integration testing)
├── Production Account (Live customer traffic)
├── Security Account (CloudTrail logs, GuardDuty, Security Hub)
└── Shared Services Account (CI/CD, artifact registry, DNS)
```

**Why Multi-Account?**

- **Blast Radius Containment** - A breach in dev doesn't affect production
- **Cost Allocation** - Clear cost tracking per environment
- **Compliance** - Easier to audit production separately
- **Access Control** - Different IAM policies per environment

### VPC Design

**Production VPC Layout** (Multi-AZ for High Availability):

```
VPC: 10.0.0.0/16

Availability Zone A (us-east-1a):
  - Public Subnet:  10.0.1.0/24  (ALB, NAT Gateway)
  - Private Subnet: 10.0.11.0/24 (ECS Tasks, Lambdas)
  - Data Subnet:    10.0.21.0/24 (RDS, ElastiCache)

Availability Zone B (us-east-1b):
  - Public Subnet:  10.0.2.0/24  (ALB, NAT Gateway)
  - Private Subnet: 10.0.12.0/24 (ECS Tasks, Lambdas)
  - Data Subnet:    10.0.22.0/24 (RDS Replica, ElastiCache)

Availability Zone C (us-east-1c):
  - Public Subnet:  10.0.3.0/24  (ALB)
  - Private Subnet: 10.0.13.0/24 (ECS Tasks, Lambdas)
  - Data Subnet:    10.0.23.0/24 (RDS Replica)
```

**Subnet Tiers**:

- **Public Subnets** - Internet-facing resources (ALB, NAT Gateway, Bastion)
- **Private Subnets** - Application workloads (ECS, Lambda, EC2)
- **Data Subnets** - Databases (RDS, ElastiCache, no direct internet access)

**Routing**:

- Public subnets → Internet Gateway (IGW)
- Private subnets → NAT Gateway (in public subnet)
- Data subnets → No internet access (VPC endpoints for AWS services)

### Security Groups (Firewall Rules)

**Principle**: Least privilege, deny by default.

```typescript
// Example: ALB Security Group (Terraform)
resource "aws_security_group" "alb" {
  name        = "petforce-alb-sg"
  description = "Allow HTTPS from internet"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTPS from internet"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP from internet (redirect to HTTPS)"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "petforce-alb-sg"
    Environment = "production"
  }
}

// Example: ECS Tasks Security Group
resource "aws_security_group" "ecs_tasks" {
  name        = "petforce-ecs-tasks-sg"
  description = "Allow traffic from ALB"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "HTTP from ALB"
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "petforce-ecs-tasks-sg"
    Environment = "production"
  }
}

// Example: RDS Security Group
resource "aws_security_group" "rds" {
  name        = "petforce-rds-sg"
  description = "Allow PostgreSQL from ECS tasks only"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "PostgreSQL from ECS tasks"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_tasks.id]
  }

  # No egress rules needed for RDS (client initiates)

  tags = {
    Name        = "petforce-rds-sg"
    Environment = "production"
  }
}
```

**Key Principles**:

- Reference security groups by ID (not CIDR blocks) for internal traffic
- Never allow `0.0.0.0/0` for databases
- Use AWS Secrets Manager for database credentials (not hardcoded)

---

## Infrastructure as Code (IaC)

### Why IaC?

**Problems with Manual Infrastructure**:

- "It works on my machine" syndrome
- No audit trail (who changed what?)
- Impossible to reproduce environments
- Slow disaster recovery
- Configuration drift

**Benefits of IaC**:

- Version controlled (Git history of infrastructure changes)
- Peer reviewed (PR process for infrastructure)
- Automated testing (validate before applying)
- Fast disaster recovery (recreate infrastructure from code)
- Consistent environments (dev === staging === production)

### Terraform Fundamentals

**Project Structure**:

```
infrastructure/
├── modules/                 # Reusable components
│   ├── vpc/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── ecs-cluster/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   └── rds/
│       ├── main.tf
│       ├── variables.tf
│       └── outputs.tf
├── environments/            # Environment-specific configs
│   ├── dev/
│   │   ├── main.tf
│   │   ├── terraform.tfvars
│   │   └── backend.tf
│   ├── staging/
│   │   ├── main.tf
│   │   ├── terraform.tfvars
│   │   └── backend.tf
│   └── production/
│       ├── main.tf
│       ├── terraform.tfvars
│       └── backend.tf
└── global/                  # Shared resources (DNS, IAM)
    ├── main.tf
    └── outputs.tf
```

**Example Module: VPC** (`modules/vpc/main.tf`):

```hcl
variable "environment" {
  description = "Environment name (dev, staging, production)"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of AZs"
  type        = list(string)
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "petforce-${var.environment}-vpc"
    Environment = var.environment
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "petforce-${var.environment}-igw"
    Environment = var.environment
  }
}

# Public Subnets
resource "aws_subnet" "public" {
  count                   = length(var.availability_zones)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index + 1)
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name        = "petforce-${var.environment}-public-${count.index + 1}"
    Environment = var.environment
    Tier        = "public"
  }
}

# Private Subnets
resource "aws_subnet" "private" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 11)
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name        = "petforce-${var.environment}-private-${count.index + 1}"
    Environment = var.environment
    Tier        = "private"
  }
}

# Data Subnets
resource "aws_subnet" "data" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 21)
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name        = "petforce-${var.environment}-data-${count.index + 1}"
    Environment = var.environment
    Tier        = "data"
  }
}

# NAT Gateway (one per AZ for HA)
resource "aws_eip" "nat" {
  count  = length(var.availability_zones)
  domain = "vpc"

  tags = {
    Name        = "petforce-${var.environment}-nat-eip-${count.index + 1}"
    Environment = var.environment
  }
}

resource "aws_nat_gateway" "main" {
  count         = length(var.availability_zones)
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name        = "petforce-${var.environment}-nat-${count.index + 1}"
    Environment = var.environment
  }

  depends_on = [aws_internet_gateway.main]
}

# Route Tables
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name        = "petforce-${var.environment}-public-rt"
    Environment = var.environment
  }
}

resource "aws_route_table" "private" {
  count  = length(var.availability_zones)
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = {
    Name        = "petforce-${var.environment}-private-rt-${count.index + 1}"
    Environment = var.environment
  }
}

# Route Table Associations
resource "aws_route_table_association" "public" {
  count          = length(var.availability_zones)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count          = length(var.availability_zones)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# Outputs
output "vpc_id" {
  value = aws_vpc.main.id
}

output "public_subnet_ids" {
  value = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  value = aws_subnet.private[*].id
}

output "data_subnet_ids" {
  value = aws_subnet.data[*].id
}
```

**Using the Module** (`environments/production/main.tf`):

```hcl
terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "petforce-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-state-lock"
  }
}

provider "aws" {
  region = "us-east-1"

  default_tags {
    tags = {
      Project     = "PetForce"
      Environment = "production"
      ManagedBy   = "Terraform"
    }
  }
}

module "vpc" {
  source = "../../modules/vpc"

  environment        = "production"
  vpc_cidr           = "10.0.0.0/16"
  availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

module "ecs_cluster" {
  source = "../../modules/ecs-cluster"

  environment  = "production"
  cluster_name = "petforce-production"
  vpc_id       = module.vpc.vpc_id
  subnet_ids   = module.vpc.private_subnet_ids
}

module "rds" {
  source = "../../modules/rds"

  environment            = "production"
  vpc_id                 = module.vpc.vpc_id
  subnet_ids             = module.vpc.data_subnet_ids
  instance_class         = "db.r6g.xlarge"
  allocated_storage      = 100
  multi_az               = true
  backup_retention_days  = 30
}
```

### Terraform Best Practices

1. **Remote State with Locking** - Store state in S3, use DynamoDB for locking (prevents concurrent modifications)
2. **Modules for Reusability** - Don't repeat yourself (VPC module used in dev, staging, production)
3. **Workspace or Directory per Environment** - Separate state files per environment
4. **Variables for Configuration** - Never hardcode values
5. **Outputs for Cross-Module Communication** - VPC outputs → ECS cluster inputs
6. **Plan Before Apply** - Always review changes before executing
7. **Version Pin Providers** - Use `~> 5.0` not `>= 5.0` (avoid breaking changes)
8. **Tags Everything** - Cost allocation, ownership, environment
9. **Sensitive Variables** - Use `sensitive = true` for secrets
10. **Pre-Commit Hooks** - Run `terraform fmt` and `terraform validate`

### Terraform Workflow

```bash
# Initialize (downloads providers)
terraform init

# Format code
terraform fmt -recursive

# Validate syntax
terraform validate

# Plan changes (dry run)
terraform plan -out=plan.tfplan

# Review plan
terraform show plan.tfplan

# Apply changes
terraform apply plan.tfplan

# Destroy resources (BE CAREFUL!)
terraform destroy
```

### AWS CDK (Alternative to Terraform)

**When to Use CDK vs Terraform**:

- **CDK** - If you want to write infrastructure in TypeScript/Python/Java (familiar languages)
- **Terraform** - If you need multi-cloud (AWS + GCP + Azure)

**Example CDK Stack** (TypeScript):

```typescript
import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecsPatterns from "aws-cdk-lib/aws-ecs-patterns";

export class PetForceStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPC with public and private subnets across 3 AZs
    const vpc = new ec2.Vpc(this, "PetForceVpc", {
      maxAzs: 3,
      natGateways: 3,
      subnetConfiguration: [
        {
          name: "Public",
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: "Private",
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
        {
          name: "Data",
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
    });

    // ECS Cluster
    const cluster = new ecs.Cluster(this, "PetForceCluster", {
      vpc,
      clusterName: "petforce-production",
      containerInsights: true,
    });

    // Fargate Service with ALB
    const fargateService =
      new ecsPatterns.ApplicationLoadBalancedFargateService(
        this,
        "PetForceApi",
        {
          cluster,
          memoryLimitMiB: 512,
          cpu: 256,
          desiredCount: 3,
          taskImageOptions: {
            image: ecs.ContainerImage.fromRegistry("petforce/api:latest"),
            containerPort: 3000,
            environment: {
              NODE_ENV: "production",
            },
          },
        },
      );

    // Configure health checks
    fargateService.targetGroup.configureHealthCheck({
      path: "/health",
      interval: cdk.Duration.seconds(30),
      timeout: cdk.Duration.seconds(5),
      healthyThresholdCount: 2,
      unhealthyThresholdCount: 3,
    });

    // Auto-scaling
    const scaling = fargateService.service.autoScaleTaskCount({
      minCapacity: 3,
      maxCapacity: 10,
    });

    scaling.scaleOnCpuUtilization("CpuScaling", {
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    // Outputs
    new cdk.CfnOutput(this, "LoadBalancerDNS", {
      value: fargateService.loadBalancer.loadBalancerDnsName,
    });
  }
}
```

**CDK Advantages**:

- Type safety (TypeScript catches errors before deployment)
- Familiar syntax (no HCL to learn)
- Higher-level constructs (e.g., `ApplicationLoadBalancedFargateService` sets up ALB + target groups + ECS service in one line)

**CDK Workflow**:

```bash
# Install CDK
npm install -g aws-cdk

# Initialize new project
cdk init app --language=typescript

# Synthesize CloudFormation template
cdk synth

# Deploy stack
cdk deploy

# Destroy stack
cdk destroy
```

---

## Kubernetes & Container Orchestration

### ECS vs EKS vs Fargate

**Amazon ECS (Elastic Container Service)**:

- AWS-native container orchestration
- Simpler than Kubernetes (less overhead)
- No control plane to manage
- Great for AWS-only workloads

**Amazon EKS (Elastic Kubernetes Service)**:

- Managed Kubernetes
- Multi-cloud portability (Kubernetes is standard)
- Rich ecosystem (Helm charts, operators)
- More complex (steeper learning curve)

**AWS Fargate**:

- Serverless compute for containers
- No EC2 instances to manage
- Pay per vCPU/memory (not EC2 instance hours)
- Works with both ECS and EKS

**When to Use What**:

- **ECS + Fargate** - Simple, AWS-native, serverless (PetForce uses this)
- **EKS + Fargate** - Need Kubernetes, don't want to manage nodes
- **EKS + EC2** - Need Kubernetes, want node-level control (GPU workloads, etc.)

### ECS Task Definitions

**Example Task Definition** (JSON):

```json
{
  "family": "petforce-api",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::123456789012:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::123456789012:role/petforceApiTaskRole",
  "containerDefinitions": [
    {
      "name": "api",
      "image": "123456789012.dkr.ecr.us-east-1.amazonaws.com/petforce-api:latest",
      "cpu": 256,
      "memory": 512,
      "essential": true,
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:petforce/db-url"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/petforce-api",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "api"
        }
      },
      "healthCheck": {
        "command": [
          "CMD-SHELL",
          "curl -f http://localhost:3000/health || exit 1"
        ],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

**Key Fields**:

- `cpu` and `memory` - Fargate task size (affects pricing)
- `executionRoleArn` - IAM role for ECS agent (pull images, write logs)
- `taskRoleArn` - IAM role for your application (access S3, DynamoDB, etc.)
- `secrets` - Fetch from Secrets Manager (not hardcoded environment variables)
- `healthCheck` - ECS will restart unhealthy tasks

### ECS Service Definition

**Example Service** (Terraform):

```hcl
resource "aws_ecs_service" "api" {
  name            = "petforce-api"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.api.arn
  desired_count   = 3
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.api.arn
    container_name   = "api"
    container_port   = 3000
  }

  deployment_configuration {
    maximum_percent         = 200
    minimum_healthy_percent = 100
  }

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  enable_execute_command = true

  tags = {
    Environment = "production"
  }
}
```

**Key Fields**:

- `desired_count` - Number of tasks to run
- `deployment_configuration` - Rolling deployment settings
  - `maximum_percent = 200` - Can temporarily have 2x tasks during deployment
  - `minimum_healthy_percent = 100` - Never go below desired count
- `deployment_circuit_breaker` - Automatically rollback failed deployments
- `enable_execute_command` - Allows `aws ecs execute-command` (SSH alternative)

### Container Health Checks

**Application Health Check** (in your code):

```typescript
// src/health.ts
import express from "express";

const router = express.Router();

router.get("/health", async (req, res) => {
  const health = {
    uptime: process.uptime(),
    timestamp: Date.now(),
    status: "healthy",
    checks: {
      database: await checkDatabase(),
      redis: await checkRedis(),
      memory: checkMemory(),
    },
  };

  const isHealthy = Object.values(health.checks).every(
    (check) => check.healthy,
  );

  if (isHealthy) {
    res.status(200).json(health);
  } else {
    res.status(503).json(health);
  }
});

async function checkDatabase() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { healthy: true };
  } catch (error) {
    return { healthy: false, error: error.message };
  }
}

async function checkRedis() {
  try {
    await redis.ping();
    return { healthy: true };
  } catch (error) {
    return { healthy: false, error: error.message };
  }
}

function checkMemory() {
  const used = process.memoryUsage();
  const maxHeap = 512 * 1024 * 1024; // 512 MB
  const heapUsed = used.heapUsed;
  const percentUsed = (heapUsed / maxHeap) * 100;

  return {
    healthy: percentUsed < 90,
    percentUsed: Math.round(percentUsed),
  };
}

export default router;
```

**Why Deep Health Checks Matter**:

- Container running ≠ application healthy
- Database connection pool exhausted? Health check catches it
- Redis down? Health check catches it
- Out of memory? Health check catches it

### Kubernetes Fundamentals

**Core Concepts**:

- **Pod** - Smallest deployable unit (one or more containers)
- **Deployment** - Manages replica sets (rolling updates)
- **Service** - Stable network endpoint for pods
- **Ingress** - HTTP routing to services (like ALB)
- **ConfigMap** - Configuration data (environment variables)
- **Secret** - Sensitive data (credentials, API keys)

**Example Deployment** (YAML):

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: petforce-api
  namespace: production
  labels:
    app: petforce-api
    version: v1.2.3
spec:
  replicas: 3
  selector:
    matchLabels:
      app: petforce-api
  template:
    metadata:
      labels:
        app: petforce-api
        version: v1.2.3
    spec:
      containers:
        - name: api
          image: petforce/api:1.2.3
          ports:
            - containerPort: 3000
              protocol: TCP
          env:
            - name: NODE_ENV
              value: production
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: petforce-db-credentials
                  key: url
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /ready
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: petforce-api
  namespace: production
spec:
  selector:
    app: petforce-api
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000
  type: ClusterIP
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: petforce-api
  namespace: production
  annotations:
    kubernetes.io/ingress.class: "nginx"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  tls:
    - hosts:
        - api.petforce.com
      secretName: petforce-api-tls
  rules:
    - host: api.petforce.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: petforce-api
                port:
                  number: 80
```

**Key Kubernetes Concepts**:

- `resources.requests` - Guaranteed resources (scheduler uses this)
- `resources.limits` - Maximum resources (container throttled/killed if exceeded)
- `livenessProbe` - Restart if failing (container is alive)
- `readinessProbe` - Remove from service if failing (container is ready for traffic)

### Helm Charts (Kubernetes Package Manager)

**Why Helm?**

- Reusable Kubernetes manifests (like npm packages)
- Templating (one chart, multiple environments)
- Version management (rollback deployments)

**Example Chart Structure**:

```
petforce-api/
├── Chart.yaml
├── values.yaml
├── values-production.yaml
├── values-staging.yaml
└── templates/
    ├── deployment.yaml
    ├── service.yaml
    ├── ingress.yaml
    └── secret.yaml
```

**Chart.yaml**:

```yaml
apiVersion: v2
name: petforce-api
description: PetForce API Helm Chart
version: 1.2.3
appVersion: 1.2.3
```

**values.yaml** (defaults):

```yaml
replicaCount: 3

image:
  repository: petforce/api
  tag: 1.2.3
  pullPolicy: IfNotPresent

service:
  type: ClusterIP
  port: 80

ingress:
  enabled: true
  className: nginx
  hosts:
    - host: api.petforce.com
      paths:
        - path: /
          pathType: Prefix

resources:
  requests:
    memory: 256Mi
    cpu: 250m
  limits:
    memory: 512Mi
    cpu: 500m
```

**values-production.yaml** (overrides):

```yaml
replicaCount: 5

resources:
  requests:
    memory: 512Mi
    cpu: 500m
  limits:
    memory: 1Gi
    cpu: 1000m
```

**Deploy with Helm**:

```bash
# Install chart
helm install petforce-api ./petforce-api -f values-production.yaml

# Upgrade chart
helm upgrade petforce-api ./petforce-api -f values-production.yaml

# Rollback
helm rollback petforce-api 1
```

---

## Deployment Strategies

### Blue-Green Deployment

**Concept**: Two identical production environments (Blue = current, Green = new version).

```
┌──────────────────────────────────────────────────────────┐
│                    Load Balancer                         │
│                  (Routes to Blue)                        │
└──────────────────────────────────────────────────────────┘
                        │
         ┌──────────────┴──────────────┐
         │                             │
┌────────▼─────────┐         ┌─────────────────┐
│   Blue (v1.0)    │         │  Green (v2.0)   │
│   ✅ Live        │         │  🧪 Testing     │
└──────────────────┘         └─────────────────┘

# After testing Green, flip traffic:

┌──────────────────────────────────────────────────────────┐
│                    Load Balancer                         │
│                  (Routes to Green)                       │
└──────────────────────────────────────────────────────────┘
                        │
         ┌──────────────┴──────────────┐
         │                             │
┌────────────────────┐         ┌───────▼──────────┐
│   Blue (v1.0)      │         │  Green (v2.0)    │
│   💤 Idle          │         │  ✅ Live         │
└────────────────────┘         └──────────────────┘
```

**Advantages**:

- Zero downtime
- Instant rollback (flip traffic back to Blue)
- Test production environment before going live

**Disadvantages**:

- Requires 2x infrastructure (expensive)
- Database migrations tricky (need backward compatibility)

**Implementation with ECS**:

```hcl
# Blue service
resource "aws_ecs_service" "blue" {
  name            = "petforce-api-blue"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.api_v1.arn
  desired_count   = 3

  load_balancer {
    target_group_arn = aws_lb_target_group.blue.arn
    container_name   = "api"
    container_port   = 3000
  }
}

# Green service
resource "aws_ecs_service" "green" {
  name            = "petforce-api-green"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.api_v2.arn
  desired_count   = 0 # Initially zero

  load_balancer {
    target_group_arn = aws_lb_target_group.green.arn
    container_name   = "api"
    container_port   = 3000
  }
}

# ALB listener rule (flip between blue and green)
resource "aws_lb_listener_rule" "api" {
  listener_arn = aws_lb_listener.https.arn

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.blue.arn # Change to green when ready
  }

  condition {
    path_pattern {
      values = ["/api/*"]
    }
  }
}
```

**Flip Traffic Script**:

```bash
#!/bin/bash
# blue-green-flip.sh

CURRENT_TARGET=$(aws elbv2 describe-rules --listener-arn $LISTENER_ARN \
  --query 'Rules[0].Actions[0].TargetGroupArn' --output text)

if [[ $CURRENT_TARGET == *"blue"* ]]; then
  NEW_TARGET=$GREEN_TARGET_GROUP_ARN
  echo "Flipping from Blue to Green"
else
  NEW_TARGET=$BLUE_TARGET_GROUP_ARN
  echo "Flipping from Green to Blue"
fi

aws elbv2 modify-rule \
  --rule-arn $RULE_ARN \
  --actions Type=forward,TargetGroupArn=$NEW_TARGET

echo "Traffic flipped to $NEW_TARGET"
```

### Canary Deployment

**Concept**: Gradually shift traffic to new version (e.g., 5% → 25% → 50% → 100%).

```
┌─────────────────────────────────────────────────────────┐
│              Load Balancer (Weighted Routing)           │
│                95% v1.0  |  5% v2.0                     │
└─────────────────────────────────────────────────────────┘
                   │                 │
         ┌─────────┘                 └─────────┐
         │                                     │
┌────────▼─────────┐                  ┌────────▼──────┐
│   v1.0 (Old)     │                  │   v2.0 (New)  │
│   95% traffic    │                  │   5% traffic  │
└──────────────────┘                  └───────────────┘
```

**Advantages**:

- Lower risk (only 5% of users see new version initially)
- Real production traffic testing
- Gradual rollout

**Disadvantages**:

- Requires metrics to monitor canary (error rate, latency)
- More complex than blue-green

**Implementation with ALB Target Groups**:

```hcl
resource "aws_lb_listener_rule" "canary" {
  listener_arn = aws_lb_listener.https.arn

  action {
    type = "forward"

    forward {
      target_group {
        arn    = aws_lb_target_group.v1.arn
        weight = 95
      }

      target_group {
        arn    = aws_lb_target_group.v2.arn
        weight = 5
      }

      stickiness {
        enabled  = true
        duration = 3600
      }
    }
  }

  condition {
    path_pattern {
      values = ["/api/*"]
    }
  }
}
```

**Canary Rollout Script**:

```bash
#!/bin/bash
# canary-rollout.sh

WEIGHTS=(5 25 50 75 100)

for WEIGHT in "${WEIGHTS[@]}"; do
  echo "Setting canary weight to $WEIGHT%"

  aws elbv2 modify-rule \
    --rule-arn $RULE_ARN \
    --actions Type=forward,ForwardConfig="{
      TargetGroups=[
        {TargetGroupArn=$V1_TG_ARN,Weight=$((100-WEIGHT))},
        {TargetGroupArn=$V2_TG_ARN,Weight=$WEIGHT}
      ]
    }"

  echo "Waiting 5 minutes to monitor metrics..."
  sleep 300

  # Check error rate
  ERROR_RATE=$(aws cloudwatch get-metric-statistics \
    --namespace AWS/ApplicationELB \
    --metric-name HTTPCode_Target_5XX_Count \
    --dimensions Name=TargetGroup,Value=$V2_TG_ARN \
    --statistics Sum \
    --start-time $(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%S) \
    --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
    --period 300 \
    --query 'Datapoints[0].Sum' --output text)

  if [ "$ERROR_RATE" -gt 10 ]; then
    echo "ERROR: Canary error rate too high ($ERROR_RATE errors). Rolling back."
    aws elbv2 modify-rule --rule-arn $RULE_ARN \
      --actions Type=forward,TargetGroupArn=$V1_TG_ARN
    exit 1
  fi
done

echo "Canary rollout complete! 100% traffic on v2."
```

### Rolling Deployment

**Concept**: Replace instances one at a time (default ECS behavior).

**ECS Rolling Update**:

```hcl
resource "aws_ecs_service" "api" {
  name            = "petforce-api"
  desired_count   = 6

  deployment_configuration {
    maximum_percent         = 200  # Can have 12 tasks during deployment
    minimum_healthy_percent = 100  # Always keep 6 running
  }
}
```

**What Happens**:

1. ECS starts 6 new tasks (v2.0) alongside 6 old tasks (v1.0) → 12 total
2. Once new tasks are healthy, ECS drains connections to old tasks
3. Old tasks are stopped
4. Deployment complete

**Advantages**:

- No extra infrastructure needed
- Built into ECS/Kubernetes

**Disadvantages**:

- Slower than blue-green (gradual replacement)
- Mixed versions running simultaneously

---

## Monitoring & Observability

See [observability.md](./observability.md) for comprehensive monitoring guide.

**Quick Reference**:

- **Metrics** - CloudWatch, Prometheus (CPU, memory, request rate)
- **Logs** - CloudWatch Logs, ELK Stack, Datadog
- **Traces** - AWS X-Ray, OpenTelemetry, Jaeger
- **Alerts** - CloudWatch Alarms, PagerDuty

**Key Metrics to Monitor**:

| Metric             | Description                   | Alert Threshold                 |
| ------------------ | ----------------------------- | ------------------------------- |
| CPU Utilization    | Average CPU across tasks      | > 80% for 5 minutes             |
| Memory Utilization | Average memory across tasks   | > 90% for 5 minutes             |
| Request Rate       | Requests per second           | Sudden drop (< 50% of baseline) |
| Error Rate         | 5xx errors / total requests   | > 1% for 5 minutes              |
| Latency (p99)      | 99th percentile response time | > 1000ms for 5 minutes          |
| Active Connections | Current connections to ALB    | > 10,000                        |
| Healthy Hosts      | Tasks passing health checks   | < 2                             |

---

## Security & Compliance

### Principle of Least Privilege

**IAM Policy for ECS Task Role** (only what the app needs):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject"],
      "Resource": "arn:aws:s3:::petforce-uploads/*"
    },
    {
      "Effect": "Allow",
      "Action": ["secretsmanager:GetSecretValue"],
      "Resource": "arn:aws:secretsmanager:us-east-1:123456789012:secret:petforce/*"
    },
    {
      "Effect": "Allow",
      "Action": ["kms:Decrypt"],
      "Resource": "arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012"
    }
  ]
}
```

**What to NEVER Give**:

- `s3:*` (way too broad, use specific actions)
- `Resource: "*"` (limit to specific resources)
- `iam:*` (never give tasks IAM permissions)

### Secrets Management

**AWS Secrets Manager**:

```bash
# Store secret
aws secretsmanager create-secret \
  --name petforce/database-url \
  --secret-string "postgresql://user:pass@host:5432/db"

# Retrieve in application
const secret = await client.send(
  new GetSecretValueCommand({ SecretId: 'petforce/database-url' })
);
const databaseUrl = secret.SecretString;
```

**Automatic Rotation**:

```hcl
resource "aws_secretsmanager_secret" "db_password" {
  name = "petforce/db-password"

  rotation_rules {
    automatically_after_days = 30
  }
}

resource "aws_secretsmanager_secret_rotation" "db_password" {
  secret_id           = aws_secretsmanager_secret.db_password.id
  rotation_lambda_arn = aws_lambda_function.rotate_secret.arn

  rotation_rules {
    automatically_after_days = 30
  }
}
```

### Encryption

**Encryption at Rest**:

- RDS: Enable encryption (KMS)
- S3: Enable default encryption (AES-256 or KMS)
- EBS: Enable encryption for volumes
- Secrets Manager: Encrypted by default with KMS

**Encryption in Transit**:

- ALB: HTTPS only (TLS 1.2+)
- RDS: Force SSL connections
- Redis: Enable in-transit encryption

**Example RDS with Encryption**:

```hcl
resource "aws_db_instance" "main" {
  identifier     = "petforce-production"
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = "db.r6g.xlarge"

  storage_encrypted = true
  kms_key_id        = aws_kms_key.rds.arn

  # Force SSL
  parameter_group_name = aws_db_parameter_group.postgres_ssl.name
}

resource "aws_db_parameter_group" "postgres_ssl" {
  name   = "petforce-postgres-ssl"
  family = "postgres15"

  parameter {
    name  = "rds.force_ssl"
    value = "1"
  }
}
```

### Security Scanning

**Container Image Scanning** (ECR):

```hcl
resource "aws_ecr_repository" "api" {
  name = "petforce-api"

  image_scanning_configuration {
    scan_on_push = true
  }

  image_tag_mutability = "IMMUTABLE"
}
```

**Dependency Scanning**:

```bash
# Scan npm dependencies
npm audit

# Fix vulnerabilities
npm audit fix

# Snyk (commercial tool)
npx snyk test
```

### WAF (Web Application Firewall)

**Protect against OWASP Top 10**:

```hcl
resource "aws_wafv2_web_acl" "main" {
  name  = "petforce-waf"
  scope = "REGIONAL"

  default_action {
    allow {}
  }

  rule {
    name     = "RateLimitRule"
    priority = 1

    statement {
      rate_based_statement {
        limit              = 2000
        aggregate_key_type = "IP"
      }
    }

    action {
      block {}
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "RateLimitRule"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 2

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSManagedRulesCommonRuleSet"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "petforce-waf"
    sampled_requests_enabled   = true
  }
}

resource "aws_wafv2_web_acl_association" "main" {
  resource_arn = aws_lb.main.arn
  web_acl_arn  = aws_wafv2_web_acl.main.arn
}
```

**What WAF Protects Against**:

- SQL injection
- Cross-site scripting (XSS)
- Rate limiting (DDoS protection)
- Known bad inputs (AWS managed rule sets)

---

## Cost Optimization

### Right-Sizing Resources

**Problem**: Over-provisioned resources waste money.

**Solution**: Monitor actual usage and resize.

**Example**:

```
Current: db.r6g.2xlarge (8 vCPUs, 64 GB RAM) = $1,460/month
Actual usage: 20% CPU, 30% memory

Right-sized: db.r6g.xlarge (4 vCPUs, 32 GB RAM) = $730/month
Savings: $730/month = $8,760/year
```

**Tools**:

- AWS Compute Optimizer (recommendations for EC2, Lambda, EBS)
- CloudWatch metrics (CPU, memory utilization)

### Reserved Instances & Savings Plans

**On-Demand vs Reserved vs Savings Plans**:

| Type                        | Commitment | Discount | Flexibility             |
| --------------------------- | ---------- | -------- | ----------------------- |
| On-Demand                   | None       | 0%       | Full                    |
| Reserved Instances (1-year) | 1 year     | 40%      | Instance type locked    |
| Reserved Instances (3-year) | 3 years    | 60%      | Instance type locked    |
| Savings Plans (1-year)      | 1 year     | 40%      | Flexible instance types |
| Savings Plans (3-year)      | 3 years    | 60%      | Flexible instance types |

**When to Use**:

- **On-Demand** - Development, staging, unpredictable workloads
- **Savings Plans** - Production, predictable baseline capacity
- **Reserved Instances** - Legacy, if you know exact instance types

**Example Cost Savings**:

```
Production RDS (db.r6g.xlarge, always running):
On-Demand: $730/month × 12 months = $8,760/year
3-Year Savings Plan: $8,760 × 0.4 = $3,504/year
Savings: $5,256/year
```

### S3 Lifecycle Policies

**Problem**: Old objects in S3 accumulate (logs, backups).

**Solution**: Automatically transition to cheaper storage or delete.

```hcl
resource "aws_s3_bucket_lifecycle_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    id     = "transition-old-logs"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "STANDARD_IA" # Infrequent Access (50% cheaper)
    }

    transition {
      days          = 90
      storage_class = "GLACIER" # 80% cheaper
    }

    expiration {
      days = 365 # Delete after 1 year
    }
  }
}
```

**S3 Storage Classes**:

| Class                      | Use Case                                 | Cost (per GB/month)     |
| -------------------------- | ---------------------------------------- | ----------------------- |
| Standard                   | Frequently accessed data                 | $0.023                  |
| Intelligent-Tiering        | Unknown access patterns                  | $0.023 (auto-optimized) |
| Standard-IA                | Infrequent access (monthly)              | $0.0125                 |
| Glacier Flexible Retrieval | Archival (retrieval: minutes-hours)      | $0.0036                 |
| Glacier Deep Archive       | Long-term archival (retrieval: 12 hours) | $0.00099                |

### Auto-Scaling

**Horizontal Scaling** (more tasks):

```hcl
resource "aws_appautoscaling_target" "ecs" {
  max_capacity       = 10
  min_capacity       = 2
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.api.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "cpu" {
  name               = "cpu-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }

    target_value       = 70.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}
```

**What Happens**:

- CPU > 70%: Add more tasks (scale out in 60 seconds)
- CPU < 70%: Remove tasks (scale in after 300 seconds)
- Cost savings: Only pay for tasks you need

### Spot Instances (90% Discount)

**Concept**: AWS sells unused capacity at deep discounts, but can reclaim with 2-minute notice.

**When to Use**:

- Batch processing (fault-tolerant workloads)
- Non-critical background jobs
- Development/testing environments

**When NOT to Use**:

- Production web servers (user-facing traffic)
- Databases (data loss risk)
- Stateful services

**ECS with Spot Instances**:

```hcl
resource "aws_ecs_capacity_provider" "spot" {
  name = "spot-capacity-provider"

  auto_scaling_group_provider {
    auto_scaling_group_arn = aws_autoscaling_group.spot.arn

    managed_scaling {
      status          = "ENABLED"
      target_capacity = 100
    }
  }
}

resource "aws_autoscaling_group" "spot" {
  name             = "petforce-spot-asg"
  max_size         = 10
  min_size         = 0
  desired_capacity = 3

  mixed_instances_policy {
    instances_distribution {
      on_demand_base_capacity                  = 1
      on_demand_percentage_above_base_capacity = 0
      spot_allocation_strategy                 = "lowest-price"
      spot_instance_pools                      = 2
    }

    launch_template {
      launch_template_specification {
        launch_template_id = aws_launch_template.ecs.id
      }

      override {
        instance_type = "t3.medium"
      }

      override {
        instance_type = "t3a.medium"
      }
    }
  }
}
```

**Cost Comparison**:

```
On-Demand t3.medium: $0.0416/hour × 730 hours = $30.37/month
Spot t3.medium: ~$0.0125/hour × 730 hours = $9.13/month
Savings: $21.24/month per instance
```

### Cost Allocation Tags

**Tag everything** for cost tracking:

```hcl
provider "aws" {
  default_tags {
    tags = {
      Project     = "PetForce"
      Environment = "production"
      ManagedBy   = "Terraform"
      CostCenter  = "Engineering"
    }
  }
}
```

**AWS Cost Explorer** can then show costs by:

- Project
- Environment (production vs dev)
- Cost center (Engineering vs Marketing)

---

## Disaster Recovery & Business Continuity

### RTO and RPO

**Recovery Time Objective (RTO)**: How long can you be down?
**Recovery Point Objective (RPO)**: How much data can you lose?

| Tier                       | RTO           | RPO        | Cost | Use Case               |
| -------------------------- | ------------- | ---------- | ---- | ---------------------- |
| Pilot Light                | 1-4 hours     | 1 hour     | $    | Non-critical workloads |
| Warm Standby               | 10-30 minutes | 5 minutes  | $$   | Standard production    |
| Hot Standby (Multi-Region) | < 1 minute    | < 1 minute | $$$  | Mission-critical       |

### Backup Strategy

**RDS Automated Backups**:

```hcl
resource "aws_db_instance" "main" {
  identifier = "petforce-production"

  backup_retention_period = 30 # Keep 30 days of backups
  backup_window           = "03:00-04:00" # UTC
  maintenance_window      = "mon:04:00-mon:05:00"

  skip_final_snapshot = false
  final_snapshot_identifier = "petforce-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"
}
```

**What You Get**:

- Daily automated snapshots (kept for 30 days)
- Point-in-time restore (restore to any second within 30 days)
- Final snapshot before deletion (prevents accidental data loss)

**S3 Versioning & Replication**:

```hcl
resource "aws_s3_bucket_versioning" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_replication_configuration" "uploads" {
  bucket = aws_s3_bucket.uploads.id
  role   = aws_iam_role.replication.arn

  rule {
    id     = "replicate-all"
    status = "Enabled"

    destination {
      bucket        = aws_s3_bucket.uploads_replica.arn
      storage_class = "STANDARD_IA"

      replication_time {
        status = "Enabled"
        time {
          minutes = 15
        }
      }

      metrics {
        status = "Enabled"
        event_threshold {
          minutes = 15
        }
      }
    }
  }
}
```

**What You Get**:

- Versioning: Recover accidentally deleted/overwritten files
- Replication: Copy to another region (disaster recovery)

### Multi-Region Failover

**Active-Passive Setup** (most cost-effective):

```
Primary Region (us-east-1):
  - Full production stack (ALB, ECS, RDS)
  - Route 53 health checks

Secondary Region (us-west-2):
  - RDS Read Replica (automatically promoted to primary if us-east-1 fails)
  - ECS tasks in standby (desired count = 0, scaled up on failover)
```

**Route 53 Failover**:

```hcl
resource "aws_route53_health_check" "primary" {
  fqdn              = aws_lb.primary.dns_name
  port              = 443
  type              = "HTTPS"
  resource_path     = "/health"
  failure_threshold = 3
  request_interval  = 30
}

resource "aws_route53_record" "primary" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "api.petforce.com"
  type    = "A"

  set_identifier = "primary"
  failover_routing_policy {
    type = "PRIMARY"
  }

  health_check_id = aws_route53_health_check.primary.id

  alias {
    name                   = aws_lb.primary.dns_name
    zone_id                = aws_lb.primary.zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "secondary" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "api.petforce.com"
  type    = "A"

  set_identifier = "secondary"
  failover_routing_policy {
    type = "SECONDARY"
  }

  alias {
    name                   = aws_lb.secondary.dns_name
    zone_id                = aws_lb.secondary.zone_id
    evaluate_target_health = true
  }
}
```

**How It Works**:

1. Route 53 health checks primary ALB every 30 seconds
2. If 3 consecutive failures, Route 53 flips DNS to secondary region
3. Secondary RDS replica is promoted to primary (manual or automated)
4. ECS tasks in secondary region are scaled up

### Disaster Recovery Runbook

**Scenario: Primary region (us-east-1) goes down**

1. **Verify Outage** (2 minutes)

   ```bash
   # Check Route 53 health check status
   aws route53 get-health-check-status --health-check-id <id>

   # Check RDS replication lag
   aws rds describe-db-instances --db-instance-identifier petforce-replica
   ```

2. **Promote RDS Replica** (5 minutes)

   ```bash
   aws rds promote-read-replica \
     --db-instance-identifier petforce-replica-us-west-2
   ```

3. **Scale Up Secondary ECS Tasks** (2 minutes)

   ```bash
   aws ecs update-service \
     --cluster petforce-us-west-2 \
     --service petforce-api \
     --desired-count 3
   ```

4. **Verify Secondary is Healthy** (5 minutes)

   ```bash
   # Check ALB target health
   aws elbv2 describe-target-health \
     --target-group-arn <secondary-tg-arn>

   # Test API
   curl -f https://api.petforce.com/health
   ```

5. **Notify Team** (2 minutes)
   ```bash
   # Post to Slack
   curl -X POST -H 'Content-type: application/json' \
     --data '{"text":"🚨 Failover to us-west-2 complete. Primary region down."}' \
     $SLACK_WEBHOOK_URL
   ```

**Total RTO: ~16 minutes**

---

## Infrastructure Checklist

Isabel uses this checklist to validate every infrastructure change:

### Pre-Deployment

- [ ] Infrastructure code in Git (no manual changes)
- [ ] Terraform plan reviewed (no unexpected deletions)
- [ ] Security groups follow least privilege (no 0.0.0.0/0 for internal services)
- [ ] Secrets in Secrets Manager (not hardcoded)
- [ ] Encryption enabled (RDS, S3, EBS, Secrets Manager)
- [ ] Multi-AZ for production resources (ALB, RDS, ECS)
- [ ] Auto-scaling configured (min/max capacity set)
- [ ] Health checks defined (ALB target groups, ECS tasks)
- [ ] Monitoring and alarms configured (CPU, memory, error rate)
- [ ] Cost tags applied (Project, Environment, CostCenter)

### Deployment

- [ ] Blue-green or canary deployment (not direct replacement)
- [ ] Database migrations backward compatible (old code can run on new schema)
- [ ] Rollback plan documented (how to revert in < 5 minutes)
- [ ] Deployment tested in staging first

### Post-Deployment

- [ ] Health checks passing (all targets healthy)
- [ ] Logs flowing to CloudWatch (no missing log streams)
- [ ] Metrics in CloudWatch (CPU, memory, request count)
- [ ] Alarms not firing (error rate, latency normal)
- [ ] Cost impact reviewed (no unexpected spend increase)

### Ongoing

- [ ] Quarterly right-sizing review (downsize over-provisioned resources)
- [ ] Monthly security patching (OS, container images, dependencies)
- [ ] Disaster recovery test (quarterly failover drill)
- [ ] Backup validation (monthly restore test)
- [ ] Access review (quarterly IAM audit)

---

## Summary

**Infrastructure Excellence Requires**:

1. **Infrastructure as Code** - Everything in Terraform/CDK, no manual changes
2. **Immutable Infrastructure** - Replace, don't patch
3. **Multi-AZ High Availability** - Design for failure
4. **Defense in Depth** - Network, application, and data security
5. **Observability** - Monitor everything, alert on anomalies
6. **Cost Optimization** - Right-size, use Savings Plans, auto-scale
7. **Disaster Recovery** - Backups, replication, runbooks

**Isabel's Motto**:

> "If it's not in code, it doesn't exist. If you can't monitor it, you can't fix it. If you haven't tested failover, you don't have high availability."

---

**Related Documentation**:

- [Kubernetes & Container Orchestration](./kubernetes.md)
- [Monitoring & Observability](./observability.md)
- [Security Best Practices](../security/README.md)
- [Cost Optimization Guide](./cost-optimization.md)
