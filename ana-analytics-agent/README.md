# 📊 Ana: The Analytics & Dashboard Agent

> *Data tells stories. Dashboards should make them impossible to ignore.*

Ana is a comprehensive analytics and dashboard system powered by Claude Code. She builds beautiful, actionable analytics for internal teams AND customer-facing dashboards that make products shine.

## ✨ Features

| Feature | Description |
|---------|-------------|
| **Internal Analytics** | Executive, operational, and team dashboards |
| **Customer-Facing** | Product analytics, usage dashboards, ROI tracking |
| **Chart Selection** | Expert guidance on choosing the right visualization |
| **Design System** | Consistent colors, layouts, and accessibility |
| **Metrics Library** | Pre-built calculations for common KPIs |
| **Templates** | Ready-to-use dashboard and chart components |

## 📁 Package Contents

```
ana-analytics-agent/
├── ANA.md                                    # Full analytics documentation
├── CLAUDE.md                                 # Claude Code agent configuration
├── README.md                                 # This file
├── QUICKSTART.md                             # 10-minute setup guide
├── .ana.yml                                  # Ana configuration file
└── templates/
    ├── chart-components.tsx.template         # React chart components
    └── dashboard.tsx.template                # Dashboard template
```

## 🚀 Quick Start

### 1. Copy files to your project

```bash
cp ana-analytics-agent/.ana.yml your-repo/
cp ana-analytics-agent/CLAUDE.md your-repo/
cp -r ana-analytics-agent/templates your-repo/src/components/analytics/
```

### 2. Install dependencies

```bash
npm install recharts date-fns
# or
npm install chart.js react-chartjs-2 date-fns
```

### 3. Use the components

```tsx
import { KPICard, MetricRow, ChartWrapper } from './components/analytics';

function MyDashboard() {
  return (
    <MetricRow
      metrics={[
        { title: 'Revenue', value: 125000, format: 'currency', status: 'good' },
        { title: 'Users', value: 2450, trend: { value: 12, direction: 'up', isPositive: true } },
      ]}
    />
  );
}
```

**[📖 Full Setup Guide →](./QUICKSTART.md)**

## 📊 Chart Selection Guide

| Data Type | Best Chart | When to Use |
|-----------|------------|-------------|
| Trend over time | 📈 Line | Show patterns, changes |
| Category comparison | 📊 Bar | Rank, compare values |
| Part of whole | 🥧 Pie/Donut | ≤5 categories, 100% total |
| Relationship | ⚫ Scatter | Correlation, patterns |
| Single metric | 🔢 KPI Card | Headline number |
| Progress | 🎯 Gauge/Progress | Goal tracking |
| Flow/Conversion | 🔀 Funnel/Sankey | User journeys |

## 🎨 Color Palette

### Status Colors
```
✅ Good:     #10B981 (Green)
⚠️ Warning:  #F59E0B (Yellow)
❌ Bad:      #EF4444 (Red)
ℹ️ Neutral:  #6B7280 (Gray)
```

### Chart Colors
```
Primary:    #3B82F6 (Blue)
Secondary:  #8B5CF6 (Purple)
Tertiary:   #EC4899 (Pink)
Quaternary: #F97316 (Orange)
```

## 📈 Metrics Library

### Revenue Metrics
- **MRR** - Monthly Recurring Revenue
- **ARR** - Annual Recurring Revenue
- **ARPU** - Average Revenue Per User
- **NRR** - Net Revenue Retention

### Customer Metrics
- **CAC** - Customer Acquisition Cost
- **LTV** - Customer Lifetime Value
- **Churn Rate** - Customer loss rate
- **NPS** - Net Promoter Score

### Engagement Metrics
- **DAU/MAU** - Active users
- **Stickiness** - DAU/MAU ratio
- **Session Duration** - Time in app
- **Feature Adoption** - Usage rate

## 🖥️ Dashboard Types

### Internal Dashboards
| Type | Audience | Refresh | Focus |
|------|----------|---------|-------|
| Executive | C-suite | Daily | KPIs, trends, goals |
| Operational | Managers | Real-time | Status, alerts |
| Analytical | Analysts | On-demand | Deep dives |
| Team | Departments | Daily | Team metrics |

### Customer-Facing Dashboards
| Type | Shows | Value |
|------|-------|-------|
| Usage | How they use product | Usage awareness |
| Performance | How well it works | Build trust |
| ROI/Value | Value delivered | Justify investment |
| Reporting | Exportable reports | Stakeholder communication |

## 🤖 Using with Claude Code

```
You: Create an executive dashboard for our SaaS metrics

Ana: 📊 Executive Dashboard Design

I'll create a dashboard focused on what leadership needs:

Layout:
┌─────────────────────────────────────────────────────────┐
│  [MRR]     [ARR]      [Customers]    [NRR]              │
│  $125K     $1.5M      2,450          108%               │
│  ↑12%      ↑15%       ↑8%            ↑2%                │
├─────────────────────────────────────────────────────────┤
│  Revenue Trend (12 months)          │ Revenue by Plan  │
│  📈                                 │ 🥧               │
├─────────────────────────────────────┴───────────────────┤
│  Top Customers Table                                    │
└─────────────────────────────────────────────────────────┘

Shall I generate the React components?
```

## 🎯 Ana's Commands

### Dashboard Commands
```bash
ana create dashboard "<name>" --type executive
ana add chart "<dashboard>" --type line --data revenue
ana preview "<dashboard>"
```

### Metrics Commands
```bash
ana metrics list
ana metrics calculate mrr --period "30d"
ana define metric "activation_rate" --formula "..."
```

### Analysis Commands
```bash
ana analyze trends --metric revenue
ana compare --periods "this-month,last-month"
ana forecast revenue --periods 12
```

## 🤝 Integration with Other Agents

| Agent | Integration |
|-------|-------------|
| **Larry** | Transforms logs into operational dashboards |
| **Peter** | Receives product metrics requirements |
| **Engrid** | Provides chart component specifications |
| **Thomas** | Documents dashboard features |

## 📋 Configuration

Ana uses `.ana.yml`:

```yaml
version: 1

visualization:
  colors:
    primary: '#3B82F6'
    success: '#10B981'
    warning: '#F59E0B'
    
dashboards:
  defaults:
    refreshInterval: 300
    timezone: 'UTC'
    
metrics:
  revenue:
    mrr:
      name: 'Monthly Recurring Revenue'
      format: 'currency'
```

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [ANA.md](./ANA.md) | Complete analytics documentation |
| [CLAUDE.md](./CLAUDE.md) | Claude Code configuration |
| [QUICKSTART.md](./QUICKSTART.md) | 10-minute setup guide |

## 📋 Templates

| Template | Use For |
|----------|---------|
| `chart-components.tsx.template` | KPI cards, sparklines, tables |
| `dashboard.tsx.template` | Complete dashboard layout |

---

<p align="center">
  <strong>Ana: Your Analytics Partner</strong><br>
  <em>Making data impossible to ignore.</em>
</p>

---

*Data tells stories. Dashboards should make them impossible to ignore.* 📊
