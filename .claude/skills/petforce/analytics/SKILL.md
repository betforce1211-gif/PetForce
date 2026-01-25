# Analytics Skill for PetForce

This skill provides analytics patterns, dashboard checklists, metrics definitions, and reporting standards for building data visualizations and analytics features in PetForce.

## Dashboard Design Patterns

### Executive Summary Layout
```
┌──────────────────────────────────────────────────────────────┐
│  KPI    │   KPI    │   KPI    │   KPI    │   KPI            │
├─────────┴──────────┴──────────┴──────────┴──────────────────┤
│                                                              │
│              Primary Trend Chart                             │
│                                                              │
├────────────────────────────┬─────────────────────────────────┤
│                            │                                 │
│   Secondary Chart 1        │    Secondary Chart 2            │
│                            │                                 │
└────────────────────────────┴─────────────────────────────────┘
```

### Comparison Focus Layout
```
┌──────────────────────────────────────────────────────────────┐
│  Filters: [Date Range ▼] [Region ▼] [Product ▼]             │
├────────────────────────────┬─────────────────────────────────┤
│                            │                                 │
│                            │   Breakdown / Detail            │
│   Main Comparison          │   Chart                         │
│   Chart                    │                                 │
│                            ├─────────────────────────────────┤
│                            │                                 │
│                            │   Supporting Data               │
│                            │                                 │
└────────────────────────────┴─────────────────────────────────┘
```

### Monitoring / Operations Layout
```
┌──────────────────────────────────────────────────────────────┐
│ Status: ● OK   │  Alerts: 2 ⚠️  │  Last Updated: 12:34      │
├──────────┬──────────┬──────────┬──────────┬──────────────────┤
│ Metric 1 │ Metric 2 │ Metric 3 │ Metric 4 │ Metric 5         │
│ ▁▃▅▇█▇▅  │ ▁▂▃▄▅▆▇  │ ▇▆▅▄▃▂▁  │ ▄▄▅▅▆▆▇  │ ▂▂▃▃▄▄▅         │
├──────────┴──────────┴──────────┴──────────┴──────────────────┤
│                                                              │
│              Real-time Activity Feed / Log                   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Chart Selection Matrix

### When to Use Each Chart Type

| Use Case | Chart Type | When to Use |
|----------|-----------|-------------|
| Compare categories | Bar Chart | Discrete data, ranking items, deviation from baseline |
| Show trends over time | Line Chart | Continuous time series, comparing multiple series |
| Parts of a whole | Pie/Donut | ≤6 segments, showing proportions that sum to 100% |
| Show correlation | Scatter Plot | Two continuous variables, looking for patterns |
| Exact values matter | Table | Multiple attributes per item, needs sorting/filtering |
| Single important metric | KPI Card | Dashboard summary, comparing to goal/previous |
| Distribution | Histogram | Frequency distribution of continuous data |
| Statistical summary | Box Plot | Show quartiles, outliers, and distribution shape |
| Geographic data | Choropleth Map | Values by region, location-based insights |
| Flow between stages | Sankey/Funnel | Conversion stages, user journeys |

## Color Palettes

### Categorical (for distinct categories)
```
Primary:   #2563EB  (Blue)
Secondary: #7C3AED  (Purple)
Pink:      #DB2777  (Pink)
Orange:    #EA580C  (Orange)
Green:     #16A34A  (Green)
```

### Status Colors
```
Success: #16A34A  (Positive change, goals met)
Warning: #EAB308  (Attention needed)
Error:   #DC2626  (Negative change, issues)
Neutral: #6B7280  (Baseline, unchanged)
```

### Sequential (Low to High)
```
Blue: #EFF6FF → #BFDBFE → #60A5FA → #2563EB → #1E40AF
Green: #F0FDF4 → #BBF7D0 → #4ADE80 → #16A34A → #166534
```

### Diverging (Negative to Positive)
```
Red-Blue: #DC2626 → #FCA5A5 → #F5F5F5 → #93C5FD → #2563EB
```

## Dashboard Quality Checklist

Use this checklist when designing or reviewing dashboards:

### Content
- [ ] Clear title that explains what dashboard shows
- [ ] Most important metrics visible without scrolling
- [ ] KPIs have context (vs. goal, vs. previous period)
- [ ] Data is current (show last updated timestamp)
- [ ] No vanity metrics - every chart serves a purpose

### Layout
- [ ] Visual hierarchy guides the eye
- [ ] Related information grouped together
- [ ] Adequate whitespace between elements
- [ ] Consistent alignment and spacing
- [ ] Responsive design for different screens

### Interactivity
- [ ] Filters are intuitive and clearly labeled
- [ ] Drill-down available where needed
- [ ] Tooltips provide additional context
- [ ] Loading states for async data
- [ ] Error states handled gracefully

### Accessibility
- [ ] Color is not the only indicator
- [ ] Text contrast meets WCAG AA (4.5:1)
- [ ] Charts have alt text / aria labels
- [ ] Keyboard navigation works
- [ ] Screen reader compatible

### Performance
- [ ] Initial load under 3 seconds
- [ ] Charts render progressively
- [ ] Large datasets are paginated/sampled
- [ ] Caching implemented for expensive queries

## Metrics Definitions

### Revenue Metrics
- **MRR (Monthly Recurring Revenue)**: Sum of all subscription revenue in a month
- **ARR (Annual Recurring Revenue)**: MRR × 12
- **Revenue Growth Rate**: ((Current - Previous) / Previous) × 100
- **Net Revenue Retention**: (Starting MRR + Expansion - Churn) / Starting MRR
- **ARPU (Average Revenue Per User)**: Total Revenue / Total Users

### Customer Metrics
- **Total Customers**: Count of active customer accounts
- **New Customers**: New signups in period
- **Churn Rate**: (Customers Lost / Starting Customers) × 100
- **Customer Lifetime Value (LTV)**: ARPU / Churn Rate
- **LTV:CAC Ratio**: LTV / Customer Acquisition Cost

### Product Metrics
- **DAU/WAU/MAU**: Daily/Weekly/Monthly Active Users
- **DAU/MAU Ratio (Stickiness)**: (DAU / MAU) × 100
- **Session Duration**: Average time per session
- **Sessions per User**: Total Sessions / Total Users
- **Feature Adoption Rate**: (Users Using Feature / Total Users) × 100

### Engagement Metrics
- **Activation Rate**: (Activated Users / Signups) × 100
- **Time to Activate**: Median time from signup to first value moment
- **Retention Rate**: (Users Still Active / Starting Users) × 100
- **Resurrection Rate**: (Returned Churned Users / Total Churned) × 100

## PetForce-Specific Metrics

### Pet Health Metrics
- **Active Pets**: Count of pets with records updated in last 30 days
- **Medication Adherence**: (Doses Given / Doses Scheduled) × 100
- **Vet Visit Compliance**: (Visits Completed / Visits Due) × 100
- **Weight Trend**: Change in pet weight over time (by species)
- **Activity Level**: Average daily activity minutes by pet type

### Customer Success Metrics
- **Customer Health Score**: Weighted score based on usage, engagement, satisfaction
- **Health Score Distribution**: Count/% of Green/Yellow/Red customers
- **NPS (Net Promoter Score)**: % Promoters - % Detractors
- **CSAT (Customer Satisfaction)**: Average satisfaction rating
- **Support Ticket Volume**: Count of tickets by category over time

### Usage Metrics
- **Login Frequency**: Average logins per user per week
- **Feature Usage**: % of users using each major feature
- **Mobile vs Desktop**: Split of sessions by device type
- **Time to Value**: Median time from signup to first completed action

## Analytics Feature Tiers

### Tier 1: Basic (All Plans)
- Pre-built dashboards
- Standard metrics
- Date range filtering
- CSV export

### Tier 2: Pro (Mid-tier Plans)
- Custom date ranges
- Comparison periods
- Additional filters
- Scheduled reports (email)
- Chart customization

### Tier 3: Enterprise (Top Plans)
- Custom dashboards (build your own)
- Custom metrics
- API access to data
- White-label / embed
- Advanced exports (PDF, Excel)
- Real-time data
- Data retention options

## Chart Component Standards

### KPI Card Props
```typescript
interface KPICardProps {
  title: string;
  value: number | string;
  format?: 'number' | 'currency' | 'percent';
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'flat';
    isGood?: boolean;
  };
  comparison?: {
    label: string;
    value: number | string;
  };
  sparkline?: number[];
  loading?: boolean;
}
```

### Time Series Chart Props
```typescript
interface TimeSeriesChartProps {
  data: Array<{
    date: Date | string;
    value: number;
    series?: string;
  }>;
  title: string;
  yAxisLabel?: string;
  showLegend?: boolean;
  comparison?: {
    enabled: boolean;
    periodLabel: string;
  };
  annotations?: Array<{
    date: Date;
    label: string;
  }>;
  goal?: {
    value: number;
    label: string;
  };
}
```

## Data Aggregation Patterns

### Time Granularity Selection
```typescript
// Automatic granularity based on date range
function getOptimalGranularity(startDate: Date, endDate: Date): TimeGranularity {
  const daysDiff = differenceInDays(endDate, startDate);

  if (daysDiff <= 2) return 'hour';
  if (daysDiff <= 30) return 'day';
  if (daysDiff <= 90) return 'week';
  if (daysDiff <= 365) return 'month';
  if (daysDiff <= 730) return 'quarter';
  return 'year';
}
```

### Common Calculations
```typescript
// Growth rate
function calculateGrowthRate(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

// Moving average
function calculateMovingAverage(data: number[], window: number): number[] {
  return data.map((_, index, arr) => {
    const start = Math.max(0, index - window + 1);
    const slice = arr.slice(start, index + 1);
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  });
}

// Percentile
function calculatePercentile(data: number[], percentile: number): number {
  const sorted = [...data].sort((a, b) => a - b);
  const index = (percentile / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);

  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}
```

## Performance Guidelines

### Data Limits
- Line charts: ≤1000 points per series
- Bar charts: ≤50 categories
- Scatter plots: ≤5000 points (use sampling above)
- Tables: Paginate at 100 rows

### Optimization Techniques
- Pre-aggregate data on backend
- Use virtualization for large datasets
- Lazy load off-screen charts
- Cache query results
- Use appropriate granularity

## Accessibility Requirements

### WCAG AA Compliance
- [ ] 4.5:1 contrast ratio for text
- [ ] Not relying on color alone (use patterns/labels)
- [ ] Charts have descriptive titles
- [ ] Axes are labeled
- [ ] Tooltips are keyboard accessible
- [ ] Screen reader text provided
- [ ] Focus states visible
- [ ] Tested with colorblind simulator

### Color Blindness Considerations
- Never use red/green as only differentiators
- Test with colorblind simulator tools
- Provide patterns in addition to colors
- Use shape/position as additional indicators

## Embedded Analytics Architecture

### Security Model
```
Customer's Application
  ↓ (JWT Token)
Analytics API
  • Validates JWT token
  • Enforces row-level security
  • Returns only customer's data
  • Rate limiting per customer
  • Caching for performance
  ↓
Analytics Data Store
  • Pre-aggregated metrics
  • Partitioned by customer
  • Optimized for read queries
```

### Implementation Options
- **iframe**: Simple embedding, full isolation
- **SDK Component**: React/Vue/Angular components
- **API-only**: Build your own UI with our data API

## Reporting Standards

### Scheduled Reports
- **Daily**: Operational metrics, health checks
- **Weekly**: Team dashboards, engagement summaries
- **Monthly**: Executive summary, revenue reports, customer health
- **Quarterly**: Trend analysis, cohort retention, strategic metrics

### Export Formats
- **CSV**: Raw data for analysis in Excel/SQL
- **XLSX**: Formatted spreadsheet with charts
- **PDF**: Branded report for stakeholders
- **PNG/SVG**: Chart images for presentations

### Report Components
1. **Executive Summary**: Key takeaways in 3-5 bullet points
2. **KPI Overview**: Table of key metrics with trends
3. **Visualizations**: 3-5 charts showing main insights
4. **Details**: Supporting data tables
5. **Appendix**: Methodology, data sources, notes

## Integration with Other Agents

### Ana ↔ Peter (Product)
- Receive requirements for analytics features
- Provide feasibility and design input
- Create specs for customer-facing analytics

### Ana ↔ Engrid (Engineering)
- Provide component specifications
- Review chart implementations
- Optimize for performance

### Ana ↔ Larry (Logging)
- Identify metrics to track
- Design monitoring dashboards
- Visualize log patterns

### Ana ↔ Casey (Customer Success)
- Build customer health dashboards
- Visualize NPS/CSAT trends
- Track engagement metrics
- Surface churn risk indicators

## Common Anti-Patterns to Avoid

### Chart Selection Mistakes
- ❌ Pie charts with >6 segments
- ❌ 3D effects on any charts
- ❌ Truncated Y-axis to exaggerate changes
- ❌ Rainbow color palettes for sequential data
- ❌ Using tables when a chart would be clearer

### Dashboard Design Mistakes
- ❌ Too many charts (decision paralysis)
- ❌ No clear hierarchy (everything looks important)
- ❌ Charts without context (no comparisons or goals)
- ❌ Ignoring mobile layout
- ❌ Raw data without aggregation

### Performance Mistakes
- ❌ Loading all data upfront
- ❌ No caching strategy
- ❌ Rendering thousands of data points
- ❌ Missing loading states
- ❌ No error handling

## Quick Reference: Chart Decision Tree

```
What do you want to show?
├── Comparison
│   ├── Few items (≤10) → Bar Chart
│   └── Many items (>10) → Horizontal Bar
├── Trend/Change
│   ├── Continuous data → Line Chart
│   └── Discrete data → Bar Chart
├── Composition
│   ├── Few segments (≤6) → Pie/Donut
│   └── Many segments → Treemap or Bar
├── Distribution
│   └── Histogram or Box Plot
├── Relationship
│   └── Scatter Plot
├── Geographic
│   └── Choropleth Map
└── Single Value
    └── KPI Card or Gauge
```

## Resources

### PetForce Context
- See `@/PRODUCT-VISION.md` for product philosophy
- See `ana-analytics-agent/checklists/dashboard-checklist.md` for full validation checklist
- See `ana-analytics-agent/.ana.yml` for configuration options
- See `ana-analytics-agent/templates/` for code templates

### External References
- [D3.js](https://d3js.org/) - Data visualization library
- [Recharts](https://recharts.org/) - React charting library
- [Chart.js](https://www.chartjs.org/) - Simple yet flexible charts
- [WCAG 2.1 AA](https://www.w3.org/WAI/WCAG21/quickref/) - Accessibility guidelines
- [Color Contrast Checker](https://webaim.org/resources/contrastchecker/) - Test contrast ratios
