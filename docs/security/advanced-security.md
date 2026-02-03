# Advanced Security Practices

This document covers advanced security topics including threat modeling, penetration testing, security automation, and zero-trust architecture.

## Table of Contents

- [Threat Modeling](#threat-modeling)
- [Penetration Testing](#penetration-testing)
- [Security Automation](#security-automation)
- [Zero Trust Architecture](#zero-trust-architecture)
- [Advanced Authentication](#advanced-authentication)
- [Cryptography Best Practices](#cryptography-best-practices)
- [Supply Chain Security](#supply-chain-security)
- [Cloud Security](#cloud-security)
- [Container & Kubernetes Security](#container--kubernetes-security)
- [API Security Advanced](#api-security-advanced)
- [Security Performance](#security-performance)
- [Red Team vs Blue Team](#red-team-vs-blue-team)

## Threat Modeling

### STRIDE Methodology

**S**poofing, **T**ampering, **R**epudiation, **I**nformation Disclosure, **D**enial of Service, **E**levation of Privilege

#### Example: User Authentication Threat Model

```typescript
// Component: User Login
interface ThreatModel {
  asset: string;
  threats: Threat[];
  mitigations: Mitigation[];
}

interface Threat {
  type: "STRIDE"["S" | "T" | "R" | "I" | "D" | "E"];
  description: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  likelihood: "Low" | "Medium" | "High";
}

const loginThreatModel: ThreatModel = {
  asset: "User Authentication System",
  threats: [
    {
      type: "S", // Spoofing
      description: "Attacker impersonates legitimate user",
      severity: "Critical",
      likelihood: "High",
    },
    {
      type: "T", // Tampering
      description: "Attacker modifies authentication token",
      severity: "Critical",
      likelihood: "Medium",
    },
    {
      type: "R", // Repudiation
      description: "User denies performing action",
      severity: "Medium",
      likelihood: "Low",
    },
    {
      type: "I", // Information Disclosure
      description: "Password leaked in logs or error messages",
      severity: "Critical",
      likelihood: "Medium",
    },
    {
      type: "D", // Denial of Service
      description: "Brute force attack locks out legitimate users",
      severity: "High",
      likelihood: "High",
    },
    {
      type: "E", // Elevation of Privilege
      description: "Regular user gains admin access",
      severity: "Critical",
      likelihood: "Low",
    },
  ],
  mitigations: [
    // Spoofing mitigations
    {
      threat: "S",
      control: "Multi-factor authentication",
      implementation: "TOTP-based MFA with backup codes",
    },
    {
      threat: "S",
      control: "Strong password policy",
      implementation: "Min 8 chars, complexity requirements, breach detection",
    },
    // Tampering mitigations
    {
      threat: "T",
      control: "Cryptographically signed tokens",
      implementation: "JWT with RS256 signature algorithm",
    },
    {
      threat: "T",
      control: "Short-lived tokens",
      implementation: "1 hour expiration, refresh token rotation",
    },
    // Repudiation mitigations
    {
      threat: "R",
      control: "Comprehensive audit logging",
      implementation:
        "All authentication events logged with timestamp, IP, device",
    },
    // Information Disclosure mitigations
    {
      threat: "I",
      control: "Secure error handling",
      implementation: "Generic error messages, detailed logs in secure storage",
    },
    {
      threat: "I",
      control: "Encrypted storage",
      implementation:
        "Passwords hashed with bcrypt, sensitive data encrypted at rest",
    },
    // Denial of Service mitigations
    {
      threat: "D",
      control: "Rate limiting",
      implementation: "5 attempts per 15 minutes per IP/account",
    },
    {
      threat: "D",
      control: "Progressive delays",
      implementation: "Exponential backoff after failures",
    },
    // Elevation of Privilege mitigations
    {
      threat: "E",
      control: "Principle of least privilege",
      implementation: "Default role: member, explicit grants for admin/owner",
    },
    {
      threat: "E",
      control: "Authorization checks",
      implementation: "Middleware validates permissions on every request",
    },
  ],
};
```

### Attack Tree Analysis

```typescript
// Attack Tree: Compromise User Account

interface AttackNode {
  goal: string;
  children?: AttackNode[];
  likelihood?: "Low" | "Medium" | "High";
  impact?: "Low" | "Medium" | "High" | "Critical";
  mitigations?: string[];
}

const accountCompromiseTree: AttackNode = {
  goal: "Compromise User Account",
  children: [
    {
      goal: "Steal Credentials",
      children: [
        {
          goal: "Phishing Attack",
          likelihood: "High",
          impact: "Critical",
          mitigations: [
            "User education and training",
            "Email authentication (SPF, DKIM, DMARC)",
            "Link preview in emails",
            "Report phishing mechanism",
          ],
        },
        {
          goal: "Credential Stuffing",
          likelihood: "High",
          impact: "Critical",
          mitigations: [
            "Rate limiting on login",
            "CAPTCHA after failures",
            "Monitor for breach databases",
            "Force password reset for breached passwords",
          ],
        },
        {
          goal: "Keylogger/Malware",
          likelihood: "Medium",
          impact: "Critical",
          mitigations: [
            "MFA requirement",
            "Device fingerprinting",
            "Anomaly detection",
          ],
        },
      ],
    },
    {
      goal: "Bypass Authentication",
      children: [
        {
          goal: "Brute Force Password",
          likelihood: "Low",
          impact: "Critical",
          mitigations: [
            "Account lockout",
            "Strong password policy",
            "Progressive delays",
          ],
        },
        {
          goal: "Session Hijacking",
          likelihood: "Medium",
          impact: "Critical",
          mitigations: [
            "Secure cookie flags (HttpOnly, Secure, SameSite)",
            "Token rotation",
            "IP binding",
            "Device fingerprinting",
          ],
        },
        {
          goal: "Authentication Bypass Vulnerability",
          likelihood: "Low",
          impact: "Critical",
          mitigations: [
            "Security code reviews",
            "Penetration testing",
            "Automated security scanning (SAST/DAST)",
          ],
        },
      ],
    },
    {
      goal: "Social Engineering",
      children: [
        {
          goal: "Pretexting (Support Call)",
          likelihood: "Medium",
          impact: "High",
          mitigations: [
            "Identity verification process",
            "Support staff training",
            "Call recording and monitoring",
          ],
        },
        {
          goal: "Password Reset Attack",
          likelihood: "Medium",
          impact: "High",
          mitigations: [
            "Security questions (if used) are not guessable",
            "Email + SMS verification for reset",
            "Alert user of password change",
          ],
        },
      ],
    },
  ],
};
```

### Data Flow Diagram (DFD) Analysis

```typescript
// Identify trust boundaries in data flows
interface DataFlow {
  from: string;
  to: string;
  data: string;
  protocol: string;
  trustBoundary: boolean;
  threats: string[];
  controls: string[];
}

const authenticationFlow: DataFlow[] = [
  {
    from: "User Browser",
    to: "CDN/WAF",
    data: "Login credentials",
    protocol: "HTTPS",
    trustBoundary: true, // Internet → DMZ
    threats: [
      "Man-in-the-middle attack",
      "Credential interception",
      "DDoS attack",
    ],
    controls: [
      "TLS 1.3 with strong ciphers",
      "Certificate pinning (mobile)",
      "WAF rate limiting",
      "DDoS protection",
    ],
  },
  {
    from: "CDN/WAF",
    to: "Load Balancer",
    data: "Login credentials",
    protocol: "HTTPS",
    trustBoundary: false, // Within DMZ
    threats: ["Traffic inspection", "Load balancer compromise"],
    controls: ["End-to-end encryption", "Mutual TLS", "Network segmentation"],
  },
  {
    from: "Load Balancer",
    to: "API Server",
    data: "Login credentials",
    protocol: "HTTPS",
    trustBoundary: true, // DMZ → Application Zone
    threats: ["Lateral movement", "Privilege escalation"],
    controls: [
      "Network ACLs",
      "Service mesh (mTLS)",
      "Least privilege service accounts",
    ],
  },
  {
    from: "API Server",
    to: "Database",
    data: "User lookup, password hash verification",
    protocol: "PostgreSQL/TLS",
    trustBoundary: true, // Application → Data Zone
    threats: ["SQL injection", "Data exfiltration", "Unauthorized access"],
    controls: [
      "Parameterized queries",
      "Database firewall",
      "Encryption at rest",
      "Database audit logs",
    ],
  },
  {
    from: "API Server",
    to: "Redis Cache",
    data: "Session data",
    protocol: "Redis/TLS",
    trustBoundary: false, // Within Application Zone
    threats: ["Cache poisoning", "Session theft"],
    controls: [
      "Encrypted sessions",
      "Short TTL",
      "Authenticated Redis connections",
    ],
  },
  {
    from: "API Server",
    to: "User Browser",
    data: "Authentication token",
    protocol: "HTTPS",
    trustBoundary: true, // Application Zone → Internet
    threats: ["Token theft", "Token replay"],
    controls: [
      "Secure, HttpOnly, SameSite cookies",
      "Short-lived access tokens",
      "Refresh token rotation",
    ],
  },
];
```

## Penetration Testing

### Manual Penetration Testing Checklist

```typescript
// Penetration testing automation
interface PenetrationTest {
  category: string;
  tests: Test[];
}

interface Test {
  name: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  automated: boolean;
  procedure: string;
  expected: string;
}

const penetrationTests: PenetrationTest[] = [
  {
    category: "Authentication & Session Management",
    tests: [
      {
        name: "Password brute force resistance",
        severity: "Critical",
        automated: true,
        procedure: "Attempt 100 logins with different passwords",
        expected: "Account locked after 5 attempts, IP rate limited",
      },
      {
        name: "Session fixation",
        severity: "High",
        automated: false,
        procedure: "Set session ID before login, check if same after login",
        expected: "New session ID generated on successful login",
      },
      {
        name: "Session timeout",
        severity: "Medium",
        automated: true,
        procedure: "Wait 24 hours with no activity, attempt to use session",
        expected: "Session expired, authentication required",
      },
      {
        name: "Concurrent sessions",
        severity: "Medium",
        automated: true,
        procedure: "Login from multiple devices simultaneously",
        expected: "All sessions valid or policy-enforced limit",
      },
    ],
  },
  {
    category: "Authorization",
    tests: [
      {
        name: "Horizontal privilege escalation",
        severity: "Critical",
        automated: true,
        procedure: "User A attempts to access User B's data",
        expected: "403 Forbidden, no data leaked",
      },
      {
        name: "Vertical privilege escalation",
        severity: "Critical",
        automated: true,
        procedure: "Regular user attempts admin-only action",
        expected: "403 Forbidden, action not performed",
      },
      {
        name: "IDOR (Insecure Direct Object Reference)",
        severity: "Critical",
        automated: true,
        procedure:
          "Modify IDs in URLs/requests to access other users' resources",
        expected: "Authorization check prevents access",
      },
      {
        name: "Path traversal",
        severity: "High",
        automated: true,
        procedure: "Attempt ../../../etc/passwd in file paths",
        expected: "Input validation blocks traversal",
      },
    ],
  },
  {
    category: "Input Validation",
    tests: [
      {
        name: "SQL injection",
        severity: "Critical",
        automated: true,
        procedure: "Inject SQL in all input fields: ' OR '1'='1",
        expected: "Parameterized queries prevent injection",
      },
      {
        name: "XSS (Reflected)",
        severity: "High",
        automated: true,
        procedure: "Inject <script>alert(1)</script> in inputs",
        expected: "Output encoding prevents script execution",
      },
      {
        name: "XSS (Stored)",
        severity: "Critical",
        automated: true,
        procedure: "Store malicious script in database, view on page",
        expected: "Sanitization prevents stored XSS",
      },
      {
        name: "XXE (XML External Entity)",
        severity: "High",
        automated: true,
        procedure: "Upload XML with external entity reference",
        expected: "XML parser configured to disable external entities",
      },
      {
        name: "File upload - executable",
        severity: "Critical",
        automated: true,
        procedure: "Upload .php, .exe, .sh files",
        expected: "File type validation rejects executables",
      },
      {
        name: "File upload - size bomb",
        severity: "Medium",
        automated: true,
        procedure: "Upload 100MB file",
        expected: "File size limit enforced (e.g., 5MB)",
      },
    ],
  },
  {
    category: "API Security",
    tests: [
      {
        name: "Rate limiting",
        severity: "High",
        automated: true,
        procedure: "Send 1000 requests in 1 minute",
        expected: "429 Too Many Requests after threshold",
      },
      {
        name: "Mass assignment",
        severity: "High",
        automated: true,
        procedure: 'Add "role": "admin" to registration request',
        expected: "Schema validation prevents mass assignment",
      },
      {
        name: "GraphQL introspection in production",
        severity: "Medium",
        automated: true,
        procedure: "Query __schema",
        expected: "Introspection disabled in production",
      },
      {
        name: "API versioning bypass",
        severity: "Medium",
        automated: false,
        procedure: "Attempt to access deprecated API versions",
        expected: "Old versions return 410 Gone or redirect",
      },
    ],
  },
  {
    category: "Cryptography",
    tests: [
      {
        name: "TLS version",
        severity: "High",
        automated: true,
        procedure: "Connect with TLS 1.0, 1.1",
        expected: "Only TLS 1.2+ accepted",
      },
      {
        name: "Weak cipher suites",
        severity: "High",
        automated: true,
        procedure: "Attempt connection with weak ciphers (RC4, DES)",
        expected: "Only strong ciphers accepted",
      },
      {
        name: "Password storage",
        severity: "Critical",
        automated: false,
        procedure: "Dump database, check password hashes",
        expected: "Passwords hashed with bcrypt/argon2",
      },
      {
        name: "Sensitive data in transit",
        severity: "Critical",
        automated: false,
        procedure: "Intercept traffic, check for plaintext secrets",
        expected: "All sensitive data encrypted",
      },
    ],
  },
];

// Automated penetration testing
async function runAutomatedPentests() {
  const results = [];

  for (const category of penetrationTests) {
    for (const test of category.tests) {
      if (!test.automated) continue;

      const result = await executeTest(test);
      results.push(result);

      if (result.status === "FAIL") {
        await alertSecurityTeam("Pentest failed", {
          test: test.name,
          severity: test.severity,
          details: result.details,
        });
      }
    }
  }

  return generatePentestReport(results);
}
```

### Automated Security Scanning

```typescript
// SAST (Static Application Security Testing)
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

async function runSastScan(): Promise<SastReport> {
  // Run Semgrep (open-source SAST)
  const { stdout } = await execAsync("semgrep --config=auto --json src/");

  const results = JSON.parse(stdout);

  // Parse results
  const findings = results.results.map((r: any) => ({
    severity: r.extra.severity,
    rule: r.check_id,
    file: r.path,
    line: r.start.line,
    message: r.extra.message,
    fix: r.extra.fix,
  }));

  // Filter critical/high findings
  const criticalFindings = findings.filter(
    (f) => f.severity === "ERROR" || f.severity === "WARNING",
  );

  if (criticalFindings.length > 0) {
    throw new Error(`SAST scan found ${criticalFindings.length} issues`);
  }

  return { findings, status: "PASS" };
}

// DAST (Dynamic Application Security Testing)
async function runDastScan(): Promise<DastReport> {
  // Run OWASP ZAP (open-source DAST)
  const { stdout } = await execAsync(
    "zap-cli quick-scan --self-contained --spider -r https://staging.petforce.app",
  );

  const findings = parseZapReport(stdout);

  const highRiskFindings = findings.filter((f) => f.risk === "High");

  if (highRiskFindings.length > 0) {
    throw new Error(
      `DAST scan found ${highRiskFindings.length} high-risk issues`,
    );
  }

  return { findings, status: "PASS" };
}

// Dependency scanning
async function runDependencyScan(): Promise<DependencyReport> {
  // npm audit
  const { stdout } = await execAsync("npm audit --json");
  const auditResults = JSON.parse(stdout);

  const vulnerabilities = Object.values(auditResults.vulnerabilities).filter(
    (v: any) => v.severity === "high" || v.severity === "critical",
  );

  if (vulnerabilities.length > 0) {
    throw new Error(
      `Found ${vulnerabilities.length} high/critical vulnerabilities`,
    );
  }

  return { vulnerabilities: [], status: "PASS" };
}
```

## Security Automation

### Automated Vulnerability Remediation

```typescript
// Automated security patching
async function automateSecurityPatches() {
  // 1. Scan for vulnerabilities
  const vulns = await runDependencyScan();

  // 2. Attempt automated fixes
  for (const vuln of vulns.vulnerabilities) {
    if (vuln.fixAvailable) {
      // Create branch
      await exec(`git checkout -b security-patch-${vuln.name}`);

      // Apply fix
      await exec(`npm audit fix --force`);

      // Run tests
      const testsPass = await runTests();

      if (testsPass) {
        // Create PR
        await createPullRequest({
          title: `Security: Update ${vuln.name} to fix ${vuln.cve}`,
          body: `
Automated security patch for ${vuln.name}.

**Vulnerability**: ${vuln.cve}
**Severity**: ${vuln.severity}
**Current Version**: ${vuln.currentVersion}
**Fixed Version**: ${vuln.fixedVersion}

This PR was automatically created by the security automation system.
          `,
          labels: ["security", "automated", vuln.severity],
        });
      } else {
        // Tests failed, create issue for manual review
        await createIssue({
          title: `Security patch failed tests: ${vuln.name}`,
          body: `Automated patching failed. Manual intervention required.`,
          labels: ["security", "needs-review"],
        });
      }

      // Return to main
      await exec("git checkout main");
    }
  }
}
```

### Security CI/CD Pipeline

```yaml
# .github/workflows/security.yml
name: Security Checks

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
  schedule:
    # Run daily at 2 AM
    - cron: "0 2 * * *"

jobs:
  sast:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Run Semgrep
        uses: returntocorp/semgrep-action@v1
        with:
          config: auto

  dependency-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Run npm audit
        run: npm audit --audit-level=high

      - name: Run Snyk
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

  secrets-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0 # Full history for scanning

      - name: Run TruffleHog
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: main
          head: HEAD

  container-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Build Docker image
        run: docker build -t petforce:test .

      - name: Run Trivy scan
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: petforce:test
          severity: "CRITICAL,HIGH"

  dast:
    runs-on: ubuntu-latest
    if: github.event_name == 'schedule' # Only on scheduled runs
    steps:
      - name: ZAP Scan
        uses: zaproxy/action-full-scan@v0.4.0
        with:
          target: "https://staging.petforce.app"
```

## Zero Trust Architecture

### Principle: Never Trust, Always Verify

```typescript
// Zero Trust authentication
async function zeroTrustAuth(req: Request): Promise<AuthContext> {
  // 1. Verify user identity
  const user = await verifyToken(req.headers.authorization);
  if (!user) throw new UnauthorizedError();

  // 2. Verify device
  const device = await verifyDevice(req.headers["user-agent"], req.ip);
  if (!device.trusted) {
    await requireMfa(user.id);
  }

  // 3. Check risk score
  const riskScore = await calculateRiskScore({
    user,
    device,
    location: await getLocation(req.ip),
    behavior: await analyzeBehavior(user.id),
  });

  if (riskScore > 70) {
    // High risk - additional verification
    await requireStepUpAuth(user.id);
  }

  // 4. Context-based authorization
  const context: AuthContext = {
    user,
    device,
    riskScore,
    permissions: await getUserPermissions(user.id),
    constraints: {
      ipWhitelist: await getIpWhitelist(user.id),
      timeRestrictions: await getTimeRestrictions(user.id),
      mfaRequired: riskScore > 50,
    },
  };

  return context;
}

// Continuous authentication
async function continuousAuth(sessionId: string) {
  // Re-verify session every 5 minutes
  setInterval(
    async () => {
      const session = await getSession(sessionId);

      // Check for anomalies
      const anomalies = await detectAnomalies(session.userId);
      if (anomalies.length > 0) {
        await invalidateSession(sessionId);
        await notifyUser(session.userId, "Suspicious activity detected");
      }

      // Update risk score
      const newRiskScore = await calculateRiskScore(session);
      if (newRiskScore > session.riskScore + 20) {
        // Significant risk increase
        await requireReAuth(session.userId);
      }
    },
    5 * 60 * 1000,
  );
}
```

### Micro-segmentation

```typescript
// Network segmentation with service mesh
interface ServicePolicy {
  from: string;
  to: string;
  allowed: boolean;
  conditions?: {
    method?: string[];
    path?: string[];
    headers?: Record<string, string>;
  };
}

const servicePolicies: ServicePolicy[] = [
  // Web app can call API gateway
  {
    from: "web-app",
    to: "api-gateway",
    allowed: true,
    conditions: {
      method: ["GET", "POST", "PUT", "DELETE"],
    },
  },
  // API gateway can call auth service
  {
    from: "api-gateway",
    to: "auth-service",
    allowed: true,
  },
  // Auth service can access user database
  {
    from: "auth-service",
    to: "user-db",
    allowed: true,
  },
  // Direct access to database denied
  {
    from: "web-app",
    to: "user-db",
    allowed: false,
  },
  // Lateral movement denied
  {
    from: "auth-service",
    to: "household-service",
    allowed: false,
  },
];

// Enforce with service mesh (Istio example)
function generateIstioPolicy(policy: ServicePolicy): string {
  return `
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: ${policy.from}-to-${policy.to}
spec:
  selector:
    matchLabels:
      app: ${policy.to}
  action: ${policy.allowed ? "ALLOW" : "DENY"}
  rules:
  - from:
    - source:
        principals: ["cluster.local/ns/default/sa/${policy.from}"]
    ${policy.conditions?.method ? `to:\n    - operation:\n        methods: ${JSON.stringify(policy.conditions.method)}` : ""}
  `;
}
```

## Advanced Authentication

### Passwordless Authentication

```typescript
// WebAuthn / FIDO2 implementation
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";

// Register security key
async function registerSecurityKey(userId: string) {
  // Generate challenge
  const options = generateRegistrationOptions({
    rpName: "PetForce",
    rpID: "petforce.app",
    userID: userId,
    userName: (await getUser(userId)).email,
    attestationType: "none",
    authenticatorSelection: {
      authenticatorAttachment: "cross-platform", // USB security key
      userVerification: "required",
    },
  });

  // Store challenge
  await storeChallenge(userId, options.challenge);

  return options;
}

async function verifySecurityKey(userId: string, credential: any) {
  const challenge = await getChallenge(userId);

  const verification = await verifyRegistrationResponse({
    credential,
    expectedChallenge: challenge,
    expectedOrigin: "https://petforce.app",
    expectedRPID: "petforce.app",
  });

  if (verification.verified) {
    // Store credential
    await db.insert(securityKeys).values({
      userId,
      credentialId: verification.registrationInfo.credentialID,
      publicKey: verification.registrationInfo.credentialPublicKey,
      counter: verification.registrationInfo.counter,
    });
  }

  return verification;
}

// Login with security key
async function loginWithSecurityKey(userId: string, credential: any) {
  const storedKey = await db.query.securityKeys.findFirst({
    where: eq(securityKeys.credentialId, credential.id),
  });

  if (!storedKey) {
    throw new AuthError("Security key not registered");
  }

  // Verify assertion
  const verification = await verifyAuthenticationResponse({
    credential,
    expectedChallenge: await getChallenge(userId),
    expectedOrigin: "https://petforce.app",
    expectedRPID: "petforce.app",
    authenticator: {
      credentialID: storedKey.credentialId,
      credentialPublicKey: storedKey.publicKey,
      counter: storedKey.counter,
    },
  });

  if (verification.verified) {
    // Update counter
    await db
      .update(securityKeys)
      .set({ counter: verification.authenticationInfo.newCounter })
      .where(eq(securityKeys.id, storedKey.id));

    return createSession(userId);
  }

  throw new AuthError("Security key verification failed");
}
```

### Biometric Authentication

```typescript
// iOS/Android biometric authentication
interface BiometricAuthResult {
  success: boolean;
  biometricType: "fingerprint" | "face" | "iris";
  userId: string;
}

async function setupBiometricAuth(userId: string, deviceId: string) {
  // Generate device-specific keypair
  const { publicKey, privateKey } = await generateKeyPair();

  // Store public key on server
  await db.insert(biometricKeys).values({
    userId,
    deviceId,
    publicKey,
    createdAt: new Date(),
  });

  // Store private key in device secure enclave
  await storeInSecureEnclave(deviceId, privateKey);

  return { publicKey };
}

async function authenticateWithBiometric(
  deviceId: string,
  biometricData: string,
): Promise<BiometricAuthResult> {
  // Verify biometric with device
  const biometricVerified = await verifyBiometric(deviceId, biometricData);
  if (!biometricVerified) {
    throw new AuthError("Biometric verification failed");
  }

  // Sign challenge with device private key
  const challenge = generateChallenge();
  const signature = await signWithSecureEnclave(deviceId, challenge);

  // Verify signature with stored public key
  const storedKey = await db.query.biometricKeys.findFirst({
    where: eq(biometricKeys.deviceId, deviceId),
  });

  const isValid = await verifySignature(
    challenge,
    signature,
    storedKey.publicKey,
  );

  if (!isValid) {
    throw new AuthError("Signature verification failed");
  }

  return {
    success: true,
    biometricType: await getBiometricType(deviceId),
    userId: storedKey.userId,
  };
}
```

## Cryptography Best Practices

### Key Management

```typescript
// AWS KMS for key management
import { KMSClient, EncryptCommand, DecryptCommand } from "@aws-sdk/client-kms";

const kms = new KMSClient({ region: "us-east-1" });

async function encryptWithKMS(
  plaintext: string,
  keyId: string,
): Promise<string> {
  const command = new EncryptCommand({
    KeyId: keyId,
    Plaintext: Buffer.from(plaintext),
  });

  const response = await kms.send(command);
  return Buffer.from(response.CiphertextBlob).toString("base64");
}

async function decryptWithKMS(ciphertext: string): Promise<string> {
  const command = new DecryptCommand({
    CiphertextBlob: Buffer.from(ciphertext, "base64"),
  });

  const response = await kms.send(command);
  return Buffer.from(response.Plaintext).toString("utf8");
}

// Envelope encryption for large data
async function envelopeEncrypt(data: Buffer): Promise<EncryptedData> {
  // 1. Generate data key
  const dataKey = crypto.randomBytes(32); // 256-bit AES key

  // 2. Encrypt data with data key
  const encrypted = encryptAES(data, dataKey);

  // 3. Encrypt data key with KMS master key
  const encryptedDataKey = await encryptWithKMS(
    dataKey.toString("base64"),
    process.env.KMS_KEY_ID,
  );

  return {
    encryptedData: encrypted,
    encryptedDataKey,
  };
}

async function envelopeDecrypt(encryptedData: EncryptedData): Promise<Buffer> {
  // 1. Decrypt data key with KMS
  const dataKey = Buffer.from(
    await decryptWithKMS(encryptedData.encryptedDataKey),
    "base64",
  );

  // 2. Decrypt data with data key
  return decryptAES(encryptedData.encryptedData, dataKey);
}
```

### Certificate Management

```typescript
// Automated certificate rotation
async function rotateTlsCertificate() {
  // 1. Request new certificate from Let's Encrypt
  const newCert = await requestCertificate("petforce.app");

  // 2. Validate certificate
  if (!validateCertificate(newCert)) {
    throw new Error("Certificate validation failed");
  }

  // 3. Deploy new certificate
  await deployCertificate(newCert);

  // 4. Update load balancer
  await updateLoadBalancer(newCert);

  // 5. Wait for propagation
  await sleep(60000); // 1 minute

  // 6. Verify new certificate is served
  const served = await checkCertificate("https://petforce.app");
  if (served.fingerprint !== newCert.fingerprint) {
    // Rollback
    await rollbackCertificate();
    throw new Error("Certificate deployment failed");
  }

  // 7. Clean up old certificate (after 7 days grace period)
  setTimeout(
    () => {
      cleanupOldCertificate(newCert.previousFingerprint);
    },
    7 * 24 * 60 * 60 * 1000,
  );

  logger.info("TLS certificate rotated successfully", {
    domain: "petforce.app",
    expiry: newCert.expiryDate,
  });
}

// Run rotation 30 days before expiry
async function scheduleAutoRotation() {
  const currentCert = await getCurrentCertificate();
  const daysUntilExpiry = differenceInDays(currentCert.expiryDate, new Date());

  if (daysUntilExpiry <= 30) {
    await rotateTlsCertificate();
  }

  // Check daily
  setTimeout(scheduleAutoRotation, 24 * 60 * 60 * 1000);
}
```

## Supply Chain Security

### Software Bill of Materials (SBOM)

```typescript
// Generate SBOM
import { execSync } from "child_process";

function generateSbom(): Sbom {
  // Use CycloneDX for SBOM generation
  execSync("cyclonedx-npm --output-file sbom.json");

  const sbom = JSON.parse(fs.readFileSync("sbom.json", "utf8"));

  // Verify all dependencies
  for (const component of sbom.components) {
    // Check for known vulnerabilities
    const vulns = await checkVulnerabilities(component);
    if (vulns.length > 0) {
      logger.warn("Vulnerability found in dependency", {
        component: component.name,
        vulnerabilities: vulns,
      });
    }

    // Verify package integrity
    const integrity = await verifyPackageIntegrity(component);
    if (!integrity.verified) {
      throw new Error(`Package integrity check failed: ${component.name}`);
    }
  }

  return sbom;
}

// Store SBOM with release
async function publishSbomWithRelease(version: string, sbom: Sbom) {
  // Sign SBOM
  const signature = await signSbom(sbom);

  // Upload to artifact repository
  await uploadToArtifactRepo({
    type: "sbom",
    version,
    content: sbom,
    signature,
  });

  logger.info("SBOM published", { version });
}
```

## Red Team vs Blue Team

### Red Team Exercises

```typescript
// Simulated attack scenarios
interface AttackScenario {
  name: string;
  objective: string;
  techniques: string[];
  detection: string[];
}

const redTeamScenarios: AttackScenario[] = [
  {
    name: "Credential Stuffing Attack",
    objective: "Compromise user accounts using leaked credentials",
    techniques: [
      "Obtain credential dump from dark web",
      "Use automated tool to test credentials",
      "Bypass rate limiting using distributed IPs",
    ],
    detection: [
      "Rate limiting triggers",
      "Multiple failed login attempts",
      "Unusual login patterns (time, location)",
      "CAPTCHA challenges",
    ],
  },
  {
    name: "Privilege Escalation",
    objective: "Elevate regular user to admin",
    techniques: [
      "Exploit IDOR vulnerability",
      "Manipulate request parameters",
      "Bypass authorization checks",
    ],
    detection: [
      "Authorization failures logged",
      "Unusual permission changes",
      "Admin actions from regular user account",
    ],
  },
  {
    name: "Data Exfiltration",
    objective: "Extract sensitive user data",
    techniques: [
      "SQL injection to dump database",
      "API abuse to scrape data",
      "Insider threat scenario",
    ],
    detection: [
      "Abnormal database queries",
      "Large data transfers",
      "API rate limiting",
      "DLP (Data Loss Prevention) alerts",
    ],
  },
];

// Execute red team exercise
async function runRedTeamExercise(scenario: AttackScenario) {
  logger.info("Red team exercise started", { scenario: scenario.name });

  const detections = [];

  for (const technique of scenario.techniques) {
    try {
      await executeTechnique(technique);
    } catch (error) {
      // Detection successful
      detections.push({
        technique,
        detected: true,
        method: error.message,
      });
    }
  }

  // Generate report
  return {
    scenario: scenario.name,
    objectiveMet: detections.length < scenario.techniques.length,
    detections,
    recommendations: generateRecommendations(detections),
  };
}
```

### Blue Team Response

```typescript
// Automated incident response playbook
async function handleDetectedAttack(alert: SecurityAlert) {
  // 1. Triage
  const severity = calculateSeverity(alert);

  // 2. Immediate containment
  if (severity === "Critical") {
    await emergencyContainment(alert);
  }

  // 3. Investigate
  const investigation = await investigate(alert);

  // 4. Respond based on attack type
  switch (alert.type) {
    case "credential_stuffing":
      await handleCredentialStuffing(alert, investigation);
      break;
    case "privilege_escalation":
      await handlePrivilegeEscalation(alert, investigation);
      break;
    case "data_exfiltration":
      await handleDataExfiltration(alert, investigation);
      break;
  }

  // 5. Document and learn
  await documentIncident(alert, investigation);
  await updatePlaybooks(alert.type, investigation.lessons);
}

async function handleCredentialStuffing(
  alert: SecurityAlert,
  investigation: Investigation,
) {
  // Block attacker IPs
  await blockIps(investigation.sourceIps);

  // Lock compromised accounts
  await lockAccounts(investigation.affectedUsers);

  // Force password reset
  await forcePasswordReset(investigation.affectedUsers);

  // Enable MFA for affected users
  await enableMfa(investigation.affectedUsers);

  // Monitor for further attempts
  await increaseMonitoring(investigation.sourceIps);
}
```

---

**Samantha's Advanced Security Wisdom**: "The best security is layered, automated, and continuously evolving. Today's defenses are tomorrow's vulnerabilities—stay vigilant, stay updated."
