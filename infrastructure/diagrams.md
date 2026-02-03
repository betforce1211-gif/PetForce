# PetForce Infrastructure Diagrams

Visual documentation of PetForce's infrastructure architecture, deployment flows, and data flows.

---

## Table of Contents

1. [High-Level Architecture](#high-level-architecture)
2. [Network Architecture](#network-architecture)
3. [Kubernetes Architecture](#kubernetes-architecture)
4. [Deployment Flow](#deployment-flow)
5. [Data Flow](#data-flow)
6. [Monitoring Architecture](#monitoring-architecture)
7. [Security Architecture](#security-architecture)
8. [Disaster Recovery Flow](#disaster-recovery-flow)

---

## High-Level Architecture

```mermaid
graph TB
    subgraph "User Layer"
        WebUser[Web Browser]
        MobileUser[Mobile App]
    end

    subgraph "CDN Layer"
        CloudFlare[CloudFlare CDN]
    end

    subgraph "Load Balancer"
        ALB[Application Load Balancer]
    end

    subgraph "Application Layer - AWS ECS/Kubernetes"
        WebApp1[Web App Pod 1]
        WebApp2[Web App Pod 2]
        WebApp3[Web App Pod 3]
    end

    subgraph "Cache Layer"
        Redis[Redis Cache<br/>ElastiCache/K8s]
    end

    subgraph "Database Layer"
        Supabase[Supabase<br/>PostgreSQL + Auth + Storage]
    end

    subgraph "Monitoring"
        DataDog[DataDog APM]
        CloudWatch[CloudWatch Logs]
        Prometheus[Prometheus<br/>K8s only]
    end

    WebUser -->|HTTPS| CloudFlare
    MobileUser -->|HTTPS| CloudFlare
    CloudFlare -->|HTTPS| ALB
    ALB -->|HTTP| WebApp1
    ALB -->|HTTP| WebApp2
    ALB -->|HTTP| WebApp3
    WebApp1 <-->|Cache| Redis
    WebApp2 <-->|Cache| Redis
    WebApp3 <-->|Cache| Redis
    WebApp1 <-->|SQL + Auth| Supabase
    WebApp2 <-->|SQL + Auth| Supabase
    WebApp3 <-->|SQL + Auth| Supabase
    WebApp1 -->|Metrics + Logs| DataDog
    WebApp2 -->|Metrics + Logs| DataDog
    WebApp3 -->|Metrics + Logs| DataDog
    WebApp1 -->|Logs| CloudWatch
    WebApp2 -->|Logs| CloudWatch
    WebApp3 -->|Logs| CloudWatch
    WebApp1 -->|Metrics| Prometheus
    WebApp2 -->|Metrics| Prometheus
    WebApp3 -->|Metrics| Prometheus

    style WebUser fill:#e1f5ff
    style MobileUser fill:#e1f5ff
    style CloudFlare fill:#ffcc80
    style ALB fill:#a5d6a7
    style WebApp1 fill:#4fc3f7
    style WebApp2 fill:#4fc3f7
    style WebApp3 fill:#4fc3f7
    style Redis fill:#ef5350
    style Supabase fill:#9575cd
    style DataDog fill:#ffa726
    style CloudWatch fill:#ffa726
    style Prometheus fill:#ffa726
```

---

## Network Architecture

```mermaid
graph TB
    subgraph "VPC - 10.0.0.0/16"
        subgraph "Public Subnets - AZ1 (10.0.1.0/24)"
            NAT1[NAT Gateway 1]
            ALB1[ALB Node 1]
        end

        subgraph "Public Subnets - AZ2 (10.0.2.0/24)"
            NAT2[NAT Gateway 2]
            ALB2[ALB Node 2]
        end

        subgraph "Private Subnets - AZ1 (10.0.11.0/24)"
            ECS1[ECS Tasks AZ1]
            K8sNode1[K8s Nodes AZ1]
        end

        subgraph "Private Subnets - AZ2 (10.0.12.0/24)"
            ECS2[ECS Tasks AZ2]
            K8sNode2[K8s Nodes AZ2]
        end

        subgraph "Database Subnets - AZ1 (10.0.21.0/24)"
            Redis1[Redis Primary]
        end

        subgraph "Database Subnets - AZ2 (10.0.22.0/24)"
            Redis2[Redis Replica]
        end
    end

    Internet[Internet]
    Supabase[Supabase Cloud<br/>External]

    Internet -->|HTTPS| ALB1
    Internet -->|HTTPS| ALB2
    ALB1 --> ECS1
    ALB1 --> K8sNode1
    ALB2 --> ECS2
    ALB2 --> K8sNode2
    ECS1 --> NAT1
    ECS2 --> NAT2
    K8sNode1 --> NAT1
    K8sNode2 --> NAT2
    NAT1 -->|Outbound| Internet
    NAT2 -->|Outbound| Internet
    ECS1 <--> Redis1
    ECS2 <--> Redis2
    K8sNode1 <--> Redis1
    K8sNode2 <--> Redis2
    ECS1 <-->|TLS| Supabase
    ECS2 <-->|TLS| Supabase
    K8sNode1 <-->|TLS| Supabase
    K8sNode2 <-->|TLS| Supabase

    style Internet fill:#e1f5ff
    style ALB1 fill:#a5d6a7
    style ALB2 fill:#a5d6a7
    style NAT1 fill:#ffcc80
    style NAT2 fill:#ffcc80
    style ECS1 fill:#4fc3f7
    style ECS2 fill:#4fc3f7
    style K8sNode1 fill:#4fc3f7
    style K8sNode2 fill:#4fc3f7
    style Redis1 fill:#ef5350
    style Redis2 fill:#ef5350
    style Supabase fill:#9575cd
```

---

## Kubernetes Architecture

```mermaid
graph TB
    subgraph "Kubernetes Cluster - petforce"
        subgraph "Ingress Namespace"
            NginxIngress[Nginx Ingress Controller]
            CertManager[Cert Manager<br/>Let's Encrypt]
        end

        subgraph "petforce Namespace"
            subgraph "Web Deployment"
                WebPod1[petforce-web-1]
                WebPod2[petforce-web-2]
                WebPod3[petforce-web-3]
            end

            WebService[petforce-web-service<br/>ClusterIP]

            subgraph "Redis Deployment"
                RedisPod[redis]
                RedisPVC[PersistentVolumeClaim<br/>5Gi]
            end

            RedisService[redis-service<br/>ClusterIP]

            ConfigMap[petforce-config<br/>ConfigMap]
            Secrets[petforce-secrets<br/>Secret]

            HPA[HorizontalPodAutoscaler<br/>3-10 replicas]
        end

        subgraph "Monitoring Namespace"
            PrometheusOp[Prometheus Operator]
            Grafana[Grafana]
            AlertManager[Alert Manager]
        end

        subgraph "Logging Namespace"
            FluentBit[Fluent Bit]
        end
    end

    Users[Users<br/>Internet]
    SupabaseExt[Supabase<br/>External]
    DataDogExt[DataDog<br/>External]

    Users -->|HTTPS| NginxIngress
    NginxIngress --> WebService
    WebService --> WebPod1
    WebService --> WebPod2
    WebService --> WebPod3
    WebPod1 --> RedisService
    WebPod2 --> RedisService
    WebPod3 --> RedisService
    RedisService --> RedisPod
    RedisPod --> RedisPVC
    WebPod1 -->|TLS| SupabaseExt
    WebPod2 -->|TLS| SupabaseExt
    WebPod3 -->|TLS| SupabaseExt
    WebPod1 -.->|Env Vars| ConfigMap
    WebPod2 -.->|Env Vars| ConfigMap
    WebPod3 -.->|Env Vars| ConfigMap
    WebPod1 -.->|Secrets| Secrets
    WebPod2 -.->|Secrets| Secrets
    WebPod3 -.->|Secrets| Secrets
    HPA -.->|Scale| WebPod1
    HPA -.->|Scale| WebPod2
    HPA -.->|Scale| WebPod3
    PrometheusOp -->|Scrape| WebPod1
    PrometheusOp -->|Scrape| WebPod2
    PrometheusOp -->|Scrape| WebPod3
    FluentBit -->|Collect| WebPod1
    FluentBit -->|Collect| WebPod2
    FluentBit -->|Collect| WebPod3
    FluentBit -->|Ship| DataDogExt
    CertManager -.->|Manage| NginxIngress

    style Users fill:#e1f5ff
    style NginxIngress fill:#a5d6a7
    style WebPod1 fill:#4fc3f7
    style WebPod2 fill:#4fc3f7
    style WebPod3 fill:#4fc3f7
    style RedisPod fill:#ef5350
    style SupabaseExt fill:#9575cd
    style PrometheusOp fill:#ffa726
    style Grafana fill:#ffa726
    style FluentBit fill:#ffa726
```

---

## Deployment Flow

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant GitHub as GitHub
    participant Actions as GitHub Actions
    participant ECR as AWS ECR
    participant ECS as AWS ECS
    participant K8s as Kubernetes
    participant Health as Health Checks
    participant Monitor as Monitoring

    Dev->>GitHub: git push to main
    GitHub->>Actions: Trigger CI/CD Pipeline

    par Run Tests & Lint
        Actions->>Actions: npm test
        Actions->>Actions: npm run lint
        Actions->>Actions: npm run typecheck
    end

    Actions->>Actions: Build Docker Image
    Actions->>ECR: Push Image (tag: commit-sha)

    alt ECS Deployment
        Actions->>ECS: Update Task Definition
        ECS->>ECS: Start New Tasks
        ECS->>Health: Check /health/ready
        Health-->>ECS: 200 OK
        ECS->>ECS: Register with ALB
        ECS->>Monitor: Send Metrics
        ECS->>ECS: Drain Old Tasks
        ECS->>ECS: Stop Old Tasks
    else Kubernetes Deployment
        Actions->>K8s: kubectl apply -f deployment.yaml
        K8s->>K8s: Create New Pods
        K8s->>Health: Startup Probe /health/startup
        Health-->>K8s: 200 OK
        K8s->>Health: Readiness Probe /health/ready
        Health-->>K8s: 200 OK
        K8s->>K8s: Add to Service
        K8s->>Monitor: Send Metrics
        K8s->>K8s: Terminate Old Pods
    end

    Actions->>GitHub: Update Deployment Status
    Monitor->>Dev: Notify Success/Failure

    Note over Dev,Monitor: Blue/Green Deployment with Zero Downtime
```

---

## Data Flow - Household Creation

```mermaid
sequenceDiagram
    participant User as User (Browser)
    participant ALB as Load Balancer
    participant App as Web App
    participant Redis as Redis Cache
    participant Supabase as Supabase DB
    participant Analytics as Analytics
    participant Monitor as DataDog

    User->>ALB: POST /api/households/create
    ALB->>App: Route to available pod

    App->>Monitor: Track: household.create.started
    App->>Supabase: Check Auth Token
    Supabase-->>App: User Authenticated

    App->>Supabase: BEGIN TRANSACTION
    App->>Supabase: INSERT INTO households
    App->>Supabase: INSERT INTO household_members (leader)
    App->>Supabase: Generate invite code
    App->>Supabase: COMMIT TRANSACTION
    Supabase-->>App: Household Created

    App->>Redis: Cache Household Data (5min TTL)
    App->>Redis: Cache Member List

    App->>Analytics: Track Event: household_created
    App->>Monitor: Track: household.create.success

    App-->>ALB: 201 Created + Household Data
    ALB-->>User: Response

    Note over User,Monitor: Average Response Time: 150ms
```

---

## Monitoring Architecture

```mermaid
graph TB
    subgraph "Application Layer"
        App1[Web App 1]
        App2[Web App 2]
        App3[Web App 3]
    end

    subgraph "Metrics Collection"
        DataDogAgent[DataDog Agent]
        PrometheusAgent[Prometheus<br/>K8s Only]
        CloudWatchAgent[CloudWatch Agent<br/>ECS Only]
    end

    subgraph "Metrics Storage"
        DataDogBackend[DataDog Cloud]
        PrometheusDB[Prometheus TSDB]
        CloudWatchDB[CloudWatch Metrics]
    end

    subgraph "Visualization"
        DataDogDash[DataDog Dashboards]
        Grafana[Grafana<br/>K8s Only]
        CloudWatchDash[CloudWatch Dashboards]
    end

    subgraph "Alerting"
        DataDogAlerts[DataDog Monitors]
        PrometheusAlerts[Prometheus AlertManager]
        CloudWatchAlarms[CloudWatch Alarms]
    end

    subgraph "Notification"
        PagerDuty[PagerDuty]
        Slack[Slack]
        Email[Email]
    end

    App1 -->|Metrics + Traces| DataDogAgent
    App2 -->|Metrics + Traces| DataDogAgent
    App3 -->|Metrics + Traces| DataDogAgent
    App1 -->|Metrics| PrometheusAgent
    App2 -->|Metrics| PrometheusAgent
    App3 -->|Metrics| PrometheusAgent
    App1 -->|Logs + Metrics| CloudWatchAgent
    App2 -->|Logs + Metrics| CloudWatchAgent
    App3 -->|Logs + Metrics| CloudWatchAgent

    DataDogAgent --> DataDogBackend
    PrometheusAgent --> PrometheusDB
    CloudWatchAgent --> CloudWatchDB

    DataDogBackend --> DataDogDash
    PrometheusDB --> Grafana
    CloudWatchDB --> CloudWatchDash

    DataDogBackend --> DataDogAlerts
    PrometheusDB --> PrometheusAlerts
    CloudWatchDB --> CloudWatchAlarms

    DataDogAlerts --> PagerDuty
    PrometheusAlerts --> PagerDuty
    CloudWatchAlarms --> PagerDuty
    DataDogAlerts --> Slack
    PrometheusAlerts --> Slack
    CloudWatchAlarms --> Email

    style App1 fill:#4fc3f7
    style App2 fill:#4fc3f7
    style App3 fill:#4fc3f7
    style DataDogBackend fill:#ffa726
    style PrometheusDB fill:#ffa726
    style CloudWatchDB fill:#ffa726
    style PagerDuty fill:#ef5350
    style Slack fill:#a5d6a7
```

---

## Security Architecture

```mermaid
graph TB
    subgraph "Edge Security"
        CloudFlare[CloudFlare<br/>DDoS Protection + WAF]
        CertManager[SSL/TLS Certificates<br/>Let's Encrypt]
    end

    subgraph "Network Security"
        ALB[Application Load Balancer<br/>SSL Termination]
        SecurityGroups[Security Groups<br/>Firewall Rules]
        NetworkPolicy[Network Policies<br/>K8s Only]
    end

    subgraph "Application Security"
        RateLimiter[Rate Limiting<br/>Per IP/User]
        CORS[CORS Headers]
        CSP[Content Security Policy]
        Helmet[Security Headers<br/>Helmet.js]
    end

    subgraph "Authentication & Authorization"
        Supabase[Supabase Auth<br/>JWT Tokens]
        RBAC[Role-Based Access Control]
        MFA[Multi-Factor Auth<br/>Optional]
    end

    subgraph "Data Security"
        Encryption[Encryption at Rest<br/>AES-256]
        TLS[TLS in Transit]
        Secrets[Secret Management<br/>AWS Secrets / K8s Secrets]
    end

    subgraph "Monitoring & Compliance"
        AuditLogs[Audit Logs]
        SIEM[Security Monitoring<br/>DataDog Security]
        Compliance[GDPR/CCPA Compliance]
    end

    Internet[Internet<br/>Users]

    Internet -->|HTTPS| CloudFlare
    CloudFlare -->|DDoS + WAF| ALB
    ALB -->|SSL/TLS| SecurityGroups
    SecurityGroups --> NetworkPolicy
    NetworkPolicy --> RateLimiter
    RateLimiter --> CORS
    CORS --> CSP
    CSP --> Helmet
    Helmet --> Supabase
    Supabase --> RBAC
    RBAC --> MFA

    RateLimiter -.-> AuditLogs
    Supabase -.-> AuditLogs
    RBAC -.-> AuditLogs
    AuditLogs --> SIEM
    SIEM --> Compliance

    Secrets -.->|Inject| Helmet
    Encryption -.->|At Rest| Supabase
    TLS -.->|In Transit| ALB

    style Internet fill:#e1f5ff
    style CloudFlare fill:#ffa726
    style ALB fill:#a5d6a7
    style Supabase fill:#9575cd
    style Encryption fill:#ef5350
    style SIEM fill:#ffa726
```

---

## Disaster Recovery Flow

```mermaid
sequenceDiagram
    participant Primary as Primary Region<br/>us-east-1
    participant Backup as Backup Region<br/>us-west-2
    participant Supabase as Supabase Cloud<br/>Multi-Region
    participant S3 as S3 Backups<br/>Cross-Region
    participant Monitor as Monitoring
    participant Team as On-Call Team

    Note over Primary,Team: Normal Operation
    Primary->>Supabase: Write Data
    Supabase->>Supabase: Replicate to Standby
    Primary->>S3: Hourly Snapshots
    S3->>S3: Replicate to us-west-2

    Note over Primary,Team: Disaster Occurs
    Monitor->>Monitor: Detect Primary Failure
    Monitor->>Team: Alert: Primary Region Down
    Team->>Team: Assess Impact

    alt Region Failure
        Team->>Backup: Activate Standby Region
        Backup->>Supabase: Connect to Read Replica
        Supabase->>Supabase: Promote Replica to Primary
        Backup->>Backup: Scale Up Capacity
        Team->>DNS: Update DNS to us-west-2
        DNS-->>Users: Route to Backup Region
        Note over Backup,Team: RTO: 15 minutes
    else Data Corruption
        Team->>S3: Identify Last Good Backup
        Team->>Supabase: Restore from Backup
        Supabase->>Supabase: Restore Database
        Team->>Primary: Verify Data Integrity
        Team->>Monitor: Resume Normal Operation
        Note over Primary,Team: RPO: 1 hour
    end

    Note over Primary,Team: Recovery Complete
    Team->>Monitor: Update Status
    Monitor->>Users: Notify: Service Restored
```

---

## Cost Optimization Flow

```mermaid
graph TB
    subgraph "Cost Monitoring"
        Budget[AWS Budget Alerts]
        CostExplorer[AWS Cost Explorer]
        DataDogCost[DataDog Cost Tracking]
    end

    subgraph "Optimization Strategies"
        AutoScaling[Auto-Scaling<br/>Scale down during low traffic]
        SpotInstances[Spot Instances<br/>K8s Node Groups]
        ReservedInstances[Reserved Instances<br/>For baseline capacity]
        S3Lifecycle[S3 Lifecycle Policies<br/>Archive old backups]
        RedisOptimization[Redis Memory Optimization<br/>Eviction policies]
    end

    subgraph "Monitoring & Actions"
        ReviewMonthly[Monthly Cost Review]
        UnusedResources[Find Unused Resources]
        RightSizing[Right-Sizing Analysis]
        TagCompliance[Tag Compliance Check]
    end

    Budget --> ReviewMonthly
    CostExplorer --> ReviewMonthly
    DataDogCost --> ReviewMonthly
    ReviewMonthly --> UnusedResources
    ReviewMonthly --> RightSizing
    ReviewMonthly --> TagCompliance

    UnusedResources --> AutoScaling
    RightSizing --> SpotInstances
    RightSizing --> ReservedInstances
    TagCompliance --> S3Lifecycle
    TagCompliance --> RedisOptimization

    style Budget fill:#ffa726
    style AutoScaling fill:#a5d6a7
    style SpotInstances fill:#a5d6a7
    style ReservedInstances fill:#a5d6a7
    style ReviewMonthly fill:#4fc3f7
```

---

## Legend

### Node Colors

- 🟦 **Blue (#4fc3f7)**: Application/Service Nodes
- 🟩 **Green (#a5d6a7)**: Load Balancers/Routing
- 🟥 **Red (#ef5350)**: Cache/Database
- 🟪 **Purple (#9575cd)**: External Services
- 🟧 **Orange (#ffa726)**: Monitoring/Observability
- 🟨 **Yellow (#ffcc80)**: CDN/Edge Services
- 🔵 **Light Blue (#e1f5ff)**: Users/Clients

### Arrow Types

- **Solid Arrow (→)**: Data/Request Flow
- **Dashed Arrow (-.->)**: Configuration/Dependency
- **Bold Arrow (==>)**: High-Traffic Path

---

## Diagram Tools

These diagrams are created using [Mermaid](https://mermaid-js.github.io/), which is supported natively in:

- GitHub Markdown
- GitLab Markdown
- VS Code (with Mermaid extension)
- Many documentation platforms

To edit diagrams:

1. Copy the Mermaid code
2. Paste into [Mermaid Live Editor](https://mermaid.live/)
3. Edit and export as needed

---

## Related Documentation

- [Deployment Guide](./deploy.md)
- [Kubernetes Configuration](./kubernetes/deployment.yaml)
- [Monitoring & Alerting](./monitoring/alerts.yaml)
- [Health Checks](./health-checks.md)

---

Built with ❤️ by the PetForce Infrastructure Team
