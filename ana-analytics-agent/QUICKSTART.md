# Ana Analytics Agent - Quick Start Guide

Get beautiful dashboards and analytics set up in 10 minutes.

## Prerequisites

- React project (Next.js, Vite, CRA)
- Tailwind CSS (recommended) or CSS-in-JS
- A charting library (Recharts, Chart.js, or similar)

---

## Step 1: Install Dependencies

```bash
# Charting library (choose one)
npm install recharts
# or
npm install chart.js react-chartjs-2

# Utilities
npm install date-fns
```

---

## Step 2: Add Configuration

Copy the configuration file:

```bash
cp ana-analytics-agent/.ana.yml your-repo/
```

Update for your project:

```yaml
# .ana.yml
version: 1

visualization:
  colors:
    primary: '#3B82F6'    # Your brand color
    secondary: '#8B5CF6'
    success: '#10B981'
    warning: '#F59E0B'
    error: '#EF4444'

dashboards:
  defaults:
    refreshInterval: 300  # 5 minutes
    timezone: 'America/New_York'  # Your timezone
```

---

## Step 3: Set Up Components

### Copy the templates:

```bash
mkdir -p src/components/analytics
cp ana-analytics-agent/templates/*.template src/components/analytics/
# Rename to .tsx
mv src/components/analytics/chart-components.tsx.template src/components/analytics/chart-components.tsx
mv src/components/analytics/dashboard.tsx.template src/components/analytics/dashboard.tsx
```

### Create an index file:

```typescript
// src/components/analytics/index.ts
export * from './chart-components';
export { Dashboard } from './dashboard';
```

---

## Step 4: Create Your First KPI Card

```tsx
import { KPICard } from '@/components/analytics';

function RevenueCard() {
  return (
    <KPICard
      title="Monthly Revenue"
      value={125000}
      format="currency"
      trend={{
        value: 12,
        direction: 'up',
        isPositive: true,
      }}
      comparison={{
        label: 'vs last month',
        value: '$111,607',
      }}
      status="good"
    />
  );
}
```

---

## Step 5: Create a Metrics Row

```tsx
import { MetricRow } from '@/components/analytics';

function DashboardHeader() {
  return (
    <MetricRow
      metrics={[
        {
          title: 'Revenue',
          value: 125000,
          format: 'currency',
          trend: { value: 12, direction: 'up', isPositive: true },
          status: 'good',
        },
        {
          title: 'Customers',
          value: 2450,
          format: 'number',
          trend: { value: 8, direction: 'up', isPositive: true },
          status: 'good',
        },
        {
          title: 'Churn Rate',
          value: 2.3,
          format: 'percent',
          trend: { value: 0.5, direction: 'down', isPositive: true },
          status: 'good',
        },
        {
          title: 'NPS',
          value: 72,
          format: 'number',
          trend: { value: 5, direction: 'up', isPositive: true },
          status: 'good',
        },
      ]}
      columns={4}
    />
  );
}
```

---

## Step 6: Add a Chart

Using Recharts:

```tsx
import { ChartWrapper } from '@/components/analytics';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

function RevenueChart({ data }) {
  return (
    <ChartWrapper
      title="Revenue Trend"
      subtitle="Last 30 days"
    >
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#3B82F6"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartWrapper>
  );
}
```

---

## Step 7: Add Data Table

```tsx
import { DataTable, TrendBadge } from '@/components/analytics';

function TopCustomersTable({ customers }) {
  return (
    <DataTable
      data={customers}
      columns={[
        { key: 'name', header: 'Customer' },
        {
          key: 'revenue',
          header: 'Revenue',
          align: 'right',
          format: (value) => `$${value.toLocaleString()}`,
        },
        {
          key: 'growth',
          header: 'Growth',
          align: 'right',
          format: (value) => <TrendBadge value={value} />,
        },
        {
          key: 'status',
          header: 'Status',
          format: (value) => (
            <span className={`px-2 py-1 rounded text-xs ${
              value === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100'
            }`}>
              {value}
            </span>
          ),
        },
      ]}
      onRowClick={(row) => router.push(`/customers/${row.id}`)}
    />
  );
}
```

---

## Step 8: Create a Complete Dashboard

```tsx
import {
  MetricRow,
  ChartWrapper,
  DataTable,
  DateRangePicker,
} from '@/components/analytics';
import { useState } from 'react';

export function ExecutiveDashboard() {
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end: new Date(),
  });

  // Fetch your data
  const { data, loading } = useDashboardData(dateRange);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Executive Dashboard</h1>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      {/* KPIs */}
      <section className="mb-6">
        <MetricRow metrics={data?.kpis ?? []} />
      </section>

      {/* Charts */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <ChartWrapper title="Revenue Trend" loading={loading}>
            {/* Your chart here */}
          </ChartWrapper>
        </div>
        <div>
          <ChartWrapper title="Revenue by Segment" loading={loading}>
            {/* Your pie chart here */}
          </ChartWrapper>
        </div>
      </section>

      {/* Table */}
      <section>
        <ChartWrapper title="Top Customers" loading={loading}>
          <DataTable data={data?.customers ?? []} columns={columns} />
        </ChartWrapper>
      </section>
    </div>
  );
}
```

---

## Common Patterns

### Formatting Values

```tsx
// Currency
format="currency"  // $1,234.56

// Percentage
format="percent"   // 12.5%

// Compact numbers
format="compact"   // 1.2M, 45K

// Custom formatting
format={(value) => `${value} items`}
```

### Status Colors

```tsx
// Use status prop to indicate health
status="good"      // Green accent
status="warning"   // Yellow accent
status="bad"       // Red accent
status="neutral"   // Gray (default)
```

### Trend Indicators

```tsx
trend={{
  value: 12,           // The change amount
  direction: 'up',     // 'up' | 'down' | 'flat'
  isPositive: true,    // Is this direction good?
}}
```

### Loading States

```tsx
// All components support loading prop
<KPICard loading={isLoading} {...props} />
<ChartWrapper loading={isLoading}>{children}</ChartWrapper>
<DataTable loading={isLoading} data={data} columns={columns} />
```

---

## Chart Selection Cheat Sheet

| Want to show... | Use this chart |
|-----------------|----------------|
| Trend over time | Line chart |
| Compare categories | Bar chart |
| Parts of whole | Pie (≤5) or Bar |
| Single number | KPI Card |
| Progress to goal | Progress bar or Gauge |
| Correlation | Scatter plot |
| Distribution | Histogram |
| Ranking | Horizontal bar |

---

## Accessibility Checklist

- [ ] Colors have 4.5:1 contrast ratio
- [ ] Don't rely on color alone
- [ ] Charts have descriptive titles
- [ ] Tables have proper headers
- [ ] Interactive elements are keyboard accessible
- [ ] Loading states are announced

---

## Next Steps

1. 📖 Read the full [ANA.md](./ANA.md) documentation
2. 🎨 Customize the color palette in `.ana.yml`
3. 📊 Add your data sources and API endpoints
4. 📈 Define your metrics and KPIs
5. 🚀 Build customer-facing analytics

---

## Troubleshooting

### Charts not rendering?
- Check that your charting library is installed
- Ensure the container has a defined height
- Verify data format matches expected structure

### Colors not matching?
- Update `.ana.yml` with your brand colors
- Check Tailwind config includes custom colors
- Verify status colors are mapped correctly

### Data not loading?
- Check API endpoint configuration
- Verify authentication headers
- Check browser console for errors

---

*Ana: Data tells stories. Dashboards should make them impossible to ignore.* 📊
