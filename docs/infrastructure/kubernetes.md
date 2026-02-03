# Kubernetes Guide for PetForce

**Owner**: Isabel (Infrastructure Agent)
**Last Updated**: 2026-02-02

This guide provides comprehensive Kubernetes patterns, best practices, and production-ready configurations for PetForce.

---

## Table of Contents

1. [Kubernetes Architecture](#kubernetes-architecture)
2. [Core Resources](#core-resources)
3. [Production Deployment Patterns](#production-deployment-patterns)
4. [Configuration Management](#configuration-management)
5. [Networking](#networking)
6. [Storage](#storage)
7. [Security](#security)
8. [Scaling & Performance](#scaling--performance)
9. [Observability](#observability)
10. [Troubleshooting](#troubleshooting)

---

## Kubernetes Architecture

### Control Plane Components

```
┌────────────────────────────────────────────────────────────┐
│                    Control Plane (Master)                  │
│                                                            │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  API Server │  │  Scheduler   │  │  Controller  │     │
│  │  (kubectl)  │  │ (Pod → Node) │  │   Manager    │     │
│  └─────────────┘  └──────────────┘  └──────────────┘     │
│                                                            │
│  ┌──────────────────────────────────────────────┐         │
│  │              etcd (Cluster State)            │         │
│  └──────────────────────────────────────────────┘         │
└────────────────────────────────────────────────────────────┘
                            │
         ┌──────────────────┼──────────────────┐
         │                  │                  │
┌────────▼─────────┐ ┌──────▼──────────┐ ┌────▼─────────────┐
│   Worker Node 1  │ │  Worker Node 2  │ │  Worker Node 3   │
│                  │ │                 │ │                  │
│  ┌────────────┐  │ │  ┌────────────┐ │ │  ┌────────────┐  │
│  │  Kubelet   │  │ │  │  Kubelet   │ │ │  │  Kubelet   │  │
│  │ (Node Mgr) │  │ │  │ (Node Mgr) │ │ │  │ (Node Mgr) │  │
│  └────────────┘  │ │  └────────────┘ │ │  └────────────┘  │
│                  │ │                 │ │                  │
│  ┌────────────┐  │ │  ┌────────────┐ │ │  ┌────────────┐  │
│  │ Container  │  │ │  │ Container  │ │ │  │ Container  │  │
│  │  Runtime   │  │ │  │  Runtime   │ │ │  │  Runtime   │  │
│  │(containerd)│  │ │  │(containerd)│ │ │  │(containerd)│  │
│  └────────────┘  │ │  └────────────┘ │ │  └────────────┘  │
│                  │ │                 │ │                  │
│  ┌────────────┐  │ │  ┌────────────┐ │ │  ┌────────────┐  │
│  │   Pods     │  │ │  │   Pods     │ │ │  │   Pods     │  │
│  └────────────┘  │ │  └────────────┘ │ │  └────────────┘  │
└──────────────────┘ └─────────────────┘ └──────────────────┘
```

**Control Plane Components**:

- **API Server** - Front-end for Kubernetes control plane (all kubectl commands go here)
- **etcd** - Distributed key-value store (cluster state, configuration)
- **Scheduler** - Assigns pods to nodes (considers resources, affinity rules)
- **Controller Manager** - Runs controllers (ReplicaSet, Deployment, Service controllers)

**Worker Node Components**:

- **Kubelet** - Agent on each node (starts/stops containers, reports node health)
- **Container Runtime** - Runs containers (containerd, CRI-O, Docker)
- **Kube Proxy** - Network proxy (implements Service networking)

---

## Core Resources

### Pods

**Smallest deployable unit** (one or more containers that share network and storage).

**Simple Pod**:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: petforce-api-pod
  labels:
    app: petforce-api
    version: v1.0.0
spec:
  containers:
    - name: api
      image: petforce/api:1.0.0
      ports:
        - containerPort: 3000
          protocol: TCP
      env:
        - name: NODE_ENV
          value: production
      resources:
        requests:
          memory: "256Mi"
          cpu: "250m"
        limits:
          memory: "512Mi"
          cpu: "500m"
```

**Multi-Container Pod** (sidecar pattern):

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: petforce-api-with-logging
spec:
  containers:
    # Main application container
    - name: api
      image: petforce/api:1.0.0
      ports:
        - containerPort: 3000
      volumeMounts:
        - name: logs
          mountPath: /var/log/app

    # Logging sidecar (ships logs to external system)
    - name: log-shipper
      image: fluent/fluent-bit:latest
      volumeMounts:
        - name: logs
          mountPath: /var/log/app
        - name: fluent-bit-config
          mountPath: /fluent-bit/etc/

  volumes:
    - name: logs
      emptyDir: {}
    - name: fluent-bit-config
      configMap:
        name: fluent-bit-config
```

**When to Use Multi-Container Pods**:

- Sidecar containers (logging, monitoring, proxies)
- Init containers (run before main container starts)
- Ambassador containers (proxy to external services)

### Deployments

**Manages ReplicaSets** (rolling updates, rollbacks).

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: petforce-api
  namespace: production
  labels:
    app: petforce-api
    tier: backend
spec:
  replicas: 3
  revisionHistoryLimit: 10 # Keep last 10 revisions for rollback

  selector:
    matchLabels:
      app: petforce-api

  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1 # Max 1 extra pod during update
      maxUnavailable: 0 # Never go below 3 replicas

  template:
    metadata:
      labels:
        app: petforce-api
        version: v1.2.3
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "3000"
        prometheus.io/path: "/metrics"

    spec:
      # Pod anti-affinity (spread pods across nodes)
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 100
              podAffinityTerm:
                labelSelector:
                  matchExpressions:
                    - key: app
                      operator: In
                      values:
                        - petforce-api
                topologyKey: kubernetes.io/hostname

      # Init container (wait for database)
      initContainers:
        - name: wait-for-db
          image: busybox:1.36
          command:
            - sh
            - -c
            - |
              until nc -z postgres.production.svc.cluster.local 5432; do
                echo "Waiting for database..."
                sleep 2
              done
              echo "Database is ready!"

      containers:
        - name: api
          image: petforce/api:1.2.3
          imagePullPolicy: IfNotPresent

          ports:
            - name: http
              containerPort: 3000
              protocol: TCP

          env:
            - name: NODE_ENV
              value: production
            - name: PORT
              value: "3000"
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: database-credentials
                  key: url

          envFrom:
            - configMapRef:
                name: petforce-config

          resources:
            requests:
              memory: "512Mi"
              cpu: "500m"
            limits:
              memory: "1Gi"
              cpu: "1000m"

          livenessProbe:
            httpGet:
              path: /health
              port: http
            initialDelaySeconds: 30
            periodSeconds: 10
            timeoutSeconds: 5
            failureThreshold: 3

          readinessProbe:
            httpGet:
              path: /ready
              port: http
            initialDelaySeconds: 5
            periodSeconds: 5
            timeoutSeconds: 3
            successThreshold: 1
            failureThreshold: 3

          lifecycle:
            preStop:
              exec:
                command:
                  - sh
                  - -c
                  - sleep 15 # Allow time for load balancer to drain connections

          volumeMounts:
            - name: tmp
              mountPath: /tmp

      volumes:
        - name: tmp
          emptyDir: {}

      # Security context
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        fsGroup: 1000

      # Graceful shutdown
      terminationGracePeriodSeconds: 30

      # Image pull secrets (for private registries)
      imagePullSecrets:
        - name: dockerhub-credentials
```

**Key Deployment Features**:

- **Rolling Updates** - Zero downtime deployments
- **Rollback** - Revert to previous version with one command
- **Pod Anti-Affinity** - Spread pods across nodes (high availability)
- **Init Containers** - Wait for dependencies before starting
- **Probes** - Automated health checking and restarts

### StatefulSets

**For stateful applications** (databases, caches) that need:

- Stable network identities (pod names don't change)
- Stable persistent storage (volumes follow pod)
- Ordered deployment and scaling

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: redis
  namespace: production
spec:
  serviceName: redis
  replicas: 3
  selector:
    matchLabels:
      app: redis

  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
        - name: redis
          image: redis:7-alpine
          ports:
            - containerPort: 6379
              name: client
          volumeMounts:
            - name: data
              mountPath: /data

  volumeClaimTemplates:
    - metadata:
        name: data
      spec:
        accessModes: ["ReadWriteOnce"]
        storageClassName: gp3
        resources:
          requests:
            storage: 10Gi
```

**StatefulSet Pod Names** (predictable):

```
redis-0 (first pod, always starts first)
redis-1 (second pod, waits for redis-0)
redis-2 (third pod, waits for redis-1)
```

**Headless Service** (for StatefulSet):

```yaml
apiVersion: v1
kind: Service
metadata:
  name: redis
  namespace: production
spec:
  clusterIP: None # Headless (no load balancing)
  selector:
    app: redis
  ports:
    - port: 6379
      targetPort: 6379
```

**Access Individual Pods**:

```bash
# Connect to specific replica
redis-0.redis.production.svc.cluster.local:6379
redis-1.redis.production.svc.cluster.local:6379
redis-2.redis.production.svc.cluster.local:6379
```

### DaemonSets

**Run one pod per node** (logging agents, monitoring, network plugins).

```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: fluentd
  namespace: kube-system
spec:
  selector:
    matchLabels:
      app: fluentd
  template:
    metadata:
      labels:
        app: fluentd
    spec:
      tolerations:
        # Run on all nodes, including master
        - key: node-role.kubernetes.io/control-plane
          operator: Exists
          effect: NoSchedule

      containers:
        - name: fluentd
          image: fluent/fluentd:v1.16-1
          resources:
            limits:
              memory: 200Mi
            requests:
              cpu: 100m
              memory: 200Mi
          volumeMounts:
            - name: varlog
              mountPath: /var/log
            - name: varlibdockercontainers
              mountPath: /var/lib/docker/containers
              readOnly: true

      volumes:
        - name: varlog
          hostPath:
            path: /var/log
        - name: varlibdockercontainers
          hostPath:
            path: /var/lib/docker/containers
```

**Use Cases**:

- Log collection (Fluentd, Logstash)
- Monitoring agents (Node Exporter, Datadog Agent)
- Network plugins (Calico, Weave)

---

## Production Deployment Patterns

### Blue-Green Deployments

**Two identical environments** (switch traffic between them).

```yaml
# Blue deployment (current production)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: petforce-api-blue
  labels:
    app: petforce-api
    version: blue
spec:
  replicas: 3
  selector:
    matchLabels:
      app: petforce-api
      version: blue
  template:
    metadata:
      labels:
        app: petforce-api
        version: blue
    spec:
      containers:
        - name: api
          image: petforce/api:1.0.0 # Old version
          ports:
            - containerPort: 3000

---
# Green deployment (new version, initially zero replicas)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: petforce-api-green
  labels:
    app: petforce-api
    version: green
spec:
  replicas: 0 # Start with zero, scale up when ready
  selector:
    matchLabels:
      app: petforce-api
      version: green
  template:
    metadata:
      labels:
        app: petforce-api
        version: green
    spec:
      containers:
        - name: api
          image: petforce/api:2.0.0 # New version
          ports:
            - containerPort: 3000

---
# Service (initially points to blue)
apiVersion: v1
kind: Service
metadata:
  name: petforce-api
spec:
  selector:
    app: petforce-api
    version: blue # Change to 'green' when ready to switch
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000
```

**Deployment Process**:

```bash
# 1. Deploy green (new version)
kubectl apply -f green-deployment.yaml
kubectl scale deployment petforce-api-green --replicas=3

# 2. Wait for green to be healthy
kubectl wait --for=condition=available --timeout=300s deployment/petforce-api-green

# 3. Test green internally (port-forward)
kubectl port-forward deployment/petforce-api-green 3000:3000
curl http://localhost:3000/health

# 4. Switch traffic to green
kubectl patch service petforce-api -p '{"spec":{"selector":{"version":"green"}}}'

# 5. Monitor for issues
kubectl logs -f deployment/petforce-api-green

# 6. If all good, scale down blue
kubectl scale deployment petforce-api-blue --replicas=0

# 7. If issues, rollback (switch service back to blue)
kubectl patch service petforce-api -p '{"spec":{"selector":{"version":"blue"}}}'
```

### Canary Deployments

**Gradually shift traffic** to new version (5% → 25% → 50% → 100%).

**Using Istio**:

```yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: petforce-api
spec:
  hosts:
    - petforce-api
  http:
    - match:
        - headers:
            canary:
              exact: "true"
      route:
        - destination:
            host: petforce-api
            subset: v2

    - route:
        - destination:
            host: petforce-api
            subset: v1
          weight: 95
        - destination:
            host: petforce-api
            subset: v2
          weight: 5 # 5% traffic to canary

---
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: petforce-api
spec:
  host: petforce-api
  subsets:
    - name: v1
      labels:
        version: v1.0.0
    - name: v2
      labels:
        version: v2.0.0
```

**Using Flagger** (automated canary with metrics):

```yaml
apiVersion: flagger.app/v1beta1
kind: Canary
metadata:
  name: petforce-api
  namespace: production
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: petforce-api

  service:
    port: 80
    targetPort: 3000

  analysis:
    interval: 1m
    threshold: 5 # Number of failed checks before rollback
    maxWeight: 50
    stepWeight: 5

    metrics:
      - name: request-success-rate
        thresholdRange:
          min: 99
        interval: 1m

      - name: request-duration
        thresholdRange:
          max: 500
        interval: 1m

  webhooks:
    - name: load-test
      url: http://flagger-loadtester/
      timeout: 5s
      metadata:
        cmd: "hey -z 1m -q 10 -c 2 http://petforce-api-canary/health"
```

**What Flagger Does**:

1. Deploys canary version
2. Sends 5% traffic to canary
3. Monitors success rate (must be > 99%) and latency (must be < 500ms)
4. If metrics are good, increases traffic by 5% every 1 minute
5. If metrics are bad, automatically rolls back
6. Continues until 50% traffic on canary
7. Promotes canary to primary

### Rolling Updates (Default)

**Built into Kubernetes Deployments**.

```yaml
spec:
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1 # Max 1 extra pod during update (25% of replicas)
      maxUnavailable: 0 # Never go below desired count
```

**What Happens** (with 4 replicas):

```
Initial state: 4 pods running v1.0

Step 1: Create 1 new pod (v2.0)
├── v1.0 pod 1 ✅
├── v1.0 pod 2 ✅
├── v1.0 pod 3 ✅
├── v1.0 pod 4 ✅
└── v2.0 pod 1 🔄 (starting)

Step 2: Once v2.0 pod 1 is ready, delete 1 v1.0 pod
├── v1.0 pod 2 ✅
├── v1.0 pod 3 ✅
├── v1.0 pod 4 ✅
└── v2.0 pod 1 ✅

Step 3: Create another v2.0 pod
├── v1.0 pod 2 ✅
├── v1.0 pod 3 ✅
├── v1.0 pod 4 ✅
├── v2.0 pod 1 ✅
└── v2.0 pod 2 🔄 (starting)

... repeat until all pods are v2.0
```

**Rollback**:

```bash
# Rollback to previous version
kubectl rollout undo deployment/petforce-api

# Rollback to specific revision
kubectl rollout history deployment/petforce-api
kubectl rollout undo deployment/petforce-api --to-revision=3
```

---

## Configuration Management

### ConfigMaps

**Non-sensitive configuration data**.

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: petforce-config
  namespace: production
data:
  # Key-value pairs
  LOG_LEVEL: "info"
  MAX_UPLOAD_SIZE: "10485760" # 10 MB
  RATE_LIMIT_REQUESTS: "100"
  RATE_LIMIT_WINDOW: "60"

  # File-like content
  nginx.conf: |
    user nginx;
    worker_processes auto;
    error_log /var/log/nginx/error.log warn;
    pid /var/run/nginx.pid;

    events {
      worker_connections 1024;
    }

    http {
      include /etc/nginx/mime.types;
      default_type application/octet-stream;

      log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';

      access_log /var/log/nginx/access.log main;

      sendfile on;
      tcp_nopush on;
      keepalive_timeout 65;

      include /etc/nginx/conf.d/*.conf;
    }
```

**Use ConfigMap in Pod** (environment variables):

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: petforce-api
spec:
  containers:
    - name: api
      image: petforce/api:latest

      # Option 1: Load all keys as env vars
      envFrom:
        - configMapRef:
            name: petforce-config

      # Option 2: Load specific keys
      env:
        - name: LOG_LEVEL
          valueFrom:
            configMapKeyRef:
              name: petforce-config
              key: LOG_LEVEL
```

**Use ConfigMap in Pod** (volume mount):

```yaml
spec:
  containers:
    - name: nginx
      image: nginx:1.25
      volumeMounts:
        - name: nginx-config
          mountPath: /etc/nginx/nginx.conf
          subPath: nginx.conf

  volumes:
    - name: nginx-config
      configMap:
        name: petforce-config
```

### Secrets

**Sensitive data** (passwords, API keys, certificates).

```bash
# Create secret from literal
kubectl create secret generic database-credentials \
  --from-literal=username=petforce_user \
  --from-literal=password=sup3rs3cr3t \
  --from-literal=url=postgresql://petforce_user:sup3rs3cr3t@postgres:5432/petforce

# Create secret from file
kubectl create secret generic tls-cert \
  --from-file=tls.crt=./cert.pem \
  --from-file=tls.key=./key.pem

# Create secret from YAML (base64 encoded)
apiVersion: v1
kind: Secret
metadata:
  name: database-credentials
type: Opaque
data:
  username: cGV0Zm9yY2VfdXNlcg== # base64 of 'petforce_user'
  password: c3VwM3JzM2NyM3Q=     # base64 of 'sup3rs3cr3t'
```

**Use Secret in Pod**:

```yaml
spec:
  containers:
    - name: api
      image: petforce/api:latest

      env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: database-credentials
              key: url

      # Or mount as file
      volumeMounts:
        - name: db-credentials
          mountPath: /etc/secrets
          readOnly: true

  volumes:
    - name: db-credentials
      secret:
        secretName: database-credentials
```

**Encrypt Secrets at Rest** (AWS EKS):

```yaml
# Enable envelope encryption with KMS
apiVersion: v1
kind: EncryptionConfiguration
resources:
  - resources:
      - secrets
    providers:
      - kms:
          name: aws-kms
          endpoint: unix:///var/run/kmsplugin/socket.sock
          cachesize: 1000
          timeout: 3s
      - identity: {}
```

### External Secrets Operator

**Sync secrets from AWS Secrets Manager/Vault/etc.**

```yaml
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: aws-secrets-manager
  namespace: production
spec:
  provider:
    aws:
      service: SecretsManager
      region: us-east-1
      auth:
        jwt:
          serviceAccountRef:
            name: external-secrets-sa

---
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: database-credentials
  namespace: production
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: aws-secrets-manager
    kind: SecretStore

  target:
    name: database-credentials
    creationPolicy: Owner

  data:
    - secretKey: url
      remoteRef:
        key: petforce/database-url
```

**What This Does**:

- Fetches secret from AWS Secrets Manager every 1 hour
- Creates/updates Kubernetes Secret `database-credentials`
- Pods use it like any other Kubernetes Secret

---

## Networking

### Services

**Stable network endpoint** for pods.

**ClusterIP** (internal only):

```yaml
apiVersion: v1
kind: Service
metadata:
  name: petforce-api
spec:
  type: ClusterIP # Default, internal traffic only
  selector:
    app: petforce-api
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000
```

**NodePort** (expose on each node's IP):

```yaml
apiVersion: v1
kind: Service
metadata:
  name: petforce-api
spec:
  type: NodePort
  selector:
    app: petforce-api
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000
      nodePort: 30080 # Accessible on <NodeIP>:30080
```

**LoadBalancer** (cloud provider LB):

```yaml
apiVersion: v1
kind: Service
metadata:
  name: petforce-api
  annotations:
    service.beta.kubernetes.io/aws-load-balancer-type: "nlb" # Network Load Balancer
    service.beta.kubernetes.io/aws-load-balancer-scheme: "internet-facing"
spec:
  type: LoadBalancer
  selector:
    app: petforce-api
  ports:
    - protocol: TCP
      port: 443
      targetPort: 3000
```

### Ingress

**HTTP routing to multiple services** (like ALB).

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: petforce-ingress
  namespace: production
  annotations:
    kubernetes.io/ingress.class: "nginx"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  tls:
    - hosts:
        - api.petforce.com
        - www.petforce.com
      secretName: petforce-tls

  rules:
    # API traffic
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

    # Web traffic
    - host: www.petforce.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: petforce-web
                port:
                  number: 80

          # Static assets to different service
          - path: /static
            pathType: Prefix
            backend:
              service:
                name: petforce-cdn
                port:
                  number: 80
```

**Advanced Routing** (header-based, cookie-based):

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: canary-ingress
  annotations:
    nginx.ingress.kubernetes.io/canary: "true"
    nginx.ingress.kubernetes.io/canary-by-header: "X-Canary"
    nginx.ingress.kubernetes.io/canary-weight: "10" # 10% traffic
spec:
  rules:
    - host: api.petforce.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: petforce-api-canary
                port:
                  number: 80
```

### Network Policies

**Pod-to-pod firewall rules**.

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: api-network-policy
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: petforce-api

  policyTypes:
    - Ingress
    - Egress

  ingress:
    # Allow traffic from ingress controller
    - from:
        - namespaceSelector:
            matchLabels:
              name: ingress-nginx
        - podSelector:
            matchLabels:
              app: nginx-ingress
      ports:
        - protocol: TCP
          port: 3000

  egress:
    # Allow DNS
    - to:
        - namespaceSelector:
            matchLabels:
              name: kube-system
        - podSelector:
            matchLabels:
              k8s-app: kube-dns
      ports:
        - protocol: UDP
          port: 53

    # Allow database access
    - to:
        - podSelector:
            matchLabels:
              app: postgres
      ports:
        - protocol: TCP
          port: 5432

    # Allow Redis access
    - to:
        - podSelector:
            matchLabels:
              app: redis
      ports:
        - protocol: TCP
          port: 6379

    # Allow HTTPS to external services
    - to:
        - podSelector: {} # Any pod
      ports:
        - protocol: TCP
          port: 443
```

**Default Deny All**:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: production
spec:
  podSelector: {}
  policyTypes:
    - Ingress
    - Egress
```

---

## Storage

### PersistentVolumes and PersistentVolumeClaims

**StorageClass** (defines storage types):

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: fast-ssd
provisioner: kubernetes.io/aws-ebs
parameters:
  type: gp3
  iops: "3000"
  throughput: "125"
  encrypted: "true"
  kmsKeyId: "arn:aws:kms:us-east-1:123456789012:key/..."
allowVolumeExpansion: true
volumeBindingMode: WaitForFirstConsumer
```

**PersistentVolumeClaim**:

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-pvc
  namespace: production
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: fast-ssd
  resources:
    requests:
      storage: 100Gi
```

**Use in StatefulSet**:

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
spec:
  serviceName: postgres
  replicas: 1
  template:
    spec:
      containers:
        - name: postgres
          image: postgres:15
          volumeMounts:
            - name: data
              mountPath: /var/lib/postgresql/data

  volumeClaimTemplates:
    - metadata:
        name: data
      spec:
        accessModes: ["ReadWriteOnce"]
        storageClassName: fast-ssd
        resources:
          requests:
            storage: 100Gi
```

---

## Security

### Pod Security Standards

**Baseline** (minimal restrictions):

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: production
  labels:
    pod-security.kubernetes.io/enforce: baseline
    pod-security.kubernetes.io/audit: restricted
    pod-security.kubernetes.io/warn: restricted
```

**Restricted** (hardened):

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: petforce-api
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 1000
    fsGroup: 1000
    seccompProfile:
      type: RuntimeDefault

  containers:
    - name: api
      image: petforce/api:latest
      securityContext:
        allowPrivilegeEscalation: false
        runAsNonRoot: true
        runAsUser: 1000
        capabilities:
          drop:
            - ALL
        readOnlyRootFilesystem: true

      volumeMounts:
        - name: tmp
          mountPath: /tmp
        - name: cache
          mountPath: /app/.cache

  volumes:
    - name: tmp
      emptyDir: {}
    - name: cache
      emptyDir: {}
```

### RBAC (Role-Based Access Control)

**ServiceAccount**:

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: petforce-api-sa
  namespace: production
```

**Role** (namespace-scoped):

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: pod-reader
  namespace: production
rules:
  - apiGroups: [""]
    resources: ["pods"]
    verbs: ["get", "list", "watch"]
  - apiGroups: [""]
    resources: ["configmaps"]
    verbs: ["get"]
```

**RoleBinding**:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: pod-reader-binding
  namespace: production
subjects:
  - kind: ServiceAccount
    name: petforce-api-sa
    namespace: production
roleRef:
  kind: Role
  name: pod-reader
  apiGroup: rbac.authorization.k8s.io
```

**ClusterRole** (cluster-wide):

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: node-reader
rules:
  - apiGroups: [""]
    resources: ["nodes"]
    verbs: ["get", "list", "watch"]
```

---

## Scaling & Performance

### Horizontal Pod Autoscaler (HPA)

**Scale based on CPU**:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: petforce-api-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: petforce-api

  minReplicas: 3
  maxReplicas: 20

  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70

  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Percent
          value: 50
          periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
        - type: Percent
          value: 100
          periodSeconds: 15
        - type: Pods
          value: 4
          periodSeconds: 15
      selectPolicy: Max
```

**Scale based on custom metrics** (requests per second):

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: petforce-api-hpa-custom
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: petforce-api

  minReplicas: 3
  maxReplicas: 50

  metrics:
    - type: Pods
      pods:
        metric:
          name: http_requests_per_second
        target:
          type: AverageValue
          averageValue: "1000" # Scale when > 1000 RPS per pod
```

### Vertical Pod Autoscaler (VPA)

**Automatically adjust resource requests/limits**:

```yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: petforce-api-vpa
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: petforce-api

  updatePolicy:
    updateMode: "Auto" # Recreate pods with new resource limits

  resourcePolicy:
    containerPolicies:
      - containerName: api
        minAllowed:
          cpu: 100m
          memory: 128Mi
        maxAllowed:
          cpu: 2000m
          memory: 2Gi
```

---

## Observability

### Logging

**Container logs** (stdout/stderr):

```bash
# View logs
kubectl logs -f deployment/petforce-api

# View logs from all pods
kubectl logs -f -l app=petforce-api

# View previous pod logs (after restart)
kubectl logs --previous pod-name

# Tail last 100 lines
kubectl logs --tail=100 pod-name
```

**Logging Stack** (Fluentd + Elasticsearch + Kibana):

```yaml
# Fluentd DaemonSet (already shown above)

# Elasticsearch StatefulSet
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: elasticsearch
spec:
  serviceName: elasticsearch
  replicas: 3
  selector:
    matchLabels:
      app: elasticsearch
  template:
    metadata:
      labels:
        app: elasticsearch
    spec:
      containers:
        - name: elasticsearch
          image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
          env:
            - name: discovery.type
              value: single-node
          volumeMounts:
            - name: data
              mountPath: /usr/share/elasticsearch/data
  volumeClaimTemplates:
    - metadata:
        name: data
      spec:
        accessModes: ["ReadWriteOnce"]
        resources:
          requests:
            storage: 100Gi
```

### Metrics

**Metrics Server** (required for HPA):

```bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
```

**Prometheus** (metrics collection):

```yaml
apiVersion: v1
kind: Service
metadata:
  name: prometheus
spec:
  selector:
    app: prometheus
  ports:
    - port: 9090

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: prometheus
spec:
  replicas: 1
  selector:
    matchLabels:
      app: prometheus
  template:
    metadata:
      labels:
        app: prometheus
    spec:
      containers:
        - name: prometheus
          image: prom/prometheus:latest
          args:
            - "--config.file=/etc/prometheus/prometheus.yml"
          ports:
            - containerPort: 9090
          volumeMounts:
            - name: config
              mountPath: /etc/prometheus
      volumes:
        - name: config
          configMap:
            name: prometheus-config
```

---

## Troubleshooting

### Common Issues

**Pod stuck in Pending**:

```bash
# Check events
kubectl describe pod pod-name

# Common causes:
# - Insufficient resources (CPU/memory)
# - PersistentVolumeClaim not bound
# - Node selector not matching any nodes
# - Image pull errors
```

**Pod stuck in CrashLoopBackOff**:

```bash
# View logs
kubectl logs pod-name
kubectl logs pod-name --previous

# Common causes:
# - Application crashes on startup
# - Liveness probe failing too soon
# - Missing environment variables/secrets
```

**Service not accessible**:

```bash
# Check endpoints
kubectl get endpoints service-name

# If empty, selector is wrong
kubectl get pods --show-labels
kubectl describe service service-name
```

---

**Related Documentation**:

- [Infrastructure Overview](./README.md)
- [Observability Guide](./observability.md)
- [Security Best Practices](../security/README.md)
