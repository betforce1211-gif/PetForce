# Registration Funnel Dashboard - Wireframes

**Version**: 1.0  
**Date**: 2026-01-25  
**Designer**: Ana (Analytics)  
**Reviewers**: Dexter (UX), Peter (Product)

## Desktop Layout (>1024px)

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 🐾 PetForce                                              [User] [☰]   ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                                                                        ┃
┃  Registration Funnel Health                   Last Updated: 12:34 PM  ┃
┃  Status: ● Healthy   │   Alerts: 2 ⚠️   │   Period: Last 24h ▼       ┃
┃                                                                        ┃
┣━━━━━━━━━━━━━━━┯━━━━━━━━━━━━━━━┯━━━━━━━━━━━━━━━┯━━━━━━━━━━━━━━━━━━━┫
┃               │               │               │                     ┃
┃  Started      │  Completed    │  Confirmed    │  First Login        ┃
┃  1,247        │  1,123        │  786          │  724                ┃
┃               │  90%          │  70% ⚠️       │  92%                ┃
┃  +12%         │  +10%         │  -5%          │  +8%                ┃
┃  ▁▂▃▄▅▆▇█▇▆▅ │  ▁▂▃▄▅▆▇█▇▆▅ │  ▁▂▃▄▃▂▁▂▃▄▅ │  ▁▂▃▄▅▆▇█▇▆▅        ┃
┃               │               │               │                     ┃
┣━━━━━━━━━━━━━━━┷━━━━━━━━━━━━━━━┷━━━━━━━━━━━━━━━┷━━━━━━━━━━━━━━━━━━━┫
┃                                                                        ┃
┃  Registration Funnel (24h)                                             ┃
┃                                                                        ┃
┃    Started      Completed       Confirmed       First Login           ┃
┃     1,247   →     1,123     →      786      →       724               ┃
┃             90%           70% ⚠️           92%                         ┃
┃                                                                        ┃
┃   [████████████▓▓▓▓▓▓▓▓▓▓]                                            ┃
┃              [████████████▓▓▓▓▓▓▓▓]                                   ┃
┃                        [████████████▓▓]                                ┃
┃                                 [█████████████]                        ┃
┃                                                                        ┃
┃   Biggest Drop: Completed → Confirmed (337 users, 30% loss)           ┃
┃   💡 Action: Check email delivery health below                        ┃
┃                                                                        ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                                                                        ┃
┃  Email Delivery Health                                                 ┃
┃                                                                        ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━┯━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                            │                                          ┃
┃  Emails Sent               │  Avg Time to Confirm                     ┃
┃  1,123                     │  12 minutes ✅                           ┃
┃                            │                                          ┃
┃  Links Clicked             │  Avg Time to Click                       ┃
┃  820 (73% click rate) ✅   │  8 minutes ✅                            ┃
┃                            │                                          ┃
┃  Confirmed                 │  Possible Spam Issues                    ┃
┃  786 (96% of clicks) ✅    │  40 emails (4%) ⚠️                       ┃
┃                            │  (sent >24h ago, not clicked)            ┃
┃                            │                                          ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━┷━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                                                                        ┃
┃  Login Success Rate (24h)                                              ┃
┃                                                                        ┃
┃  Attempts: 1,580        Success Rate: 89% ✅                           ┃
┃  Successes: 1,408                                                      ┃
┃  Failed: 172 (11%)      Top Failure: Unconfirmed email (48 users)     ┃
┃                                                                        ┃
┃  100% ┼                                                                ┃
┃       │     ╱╲  ╱╲                                                     ┃
┃    90%├────╱──╲╱──╲─────────────────  [Success Rate Line]             ┃
┃       │   ╱          ╲      ╱╲                                         ┃
┃    80%├──────────────╲────╱──╲                                        ┃
┃       │                 ╲╱                                             ┃
┃    70%├─ - - - - - - - - - - - - - -  [Warning Threshold]             ┃
┃       │                                                                ┃
┃     0%└────────────────────────────────────────────────────────       ┃
┃       12am   6am   12pm   6pm   12am                                   ┃
┃                                                                        ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                                                                        ┃
┃  Active Alerts (2)                                                     ┃
┃                                                                        ┃
┃  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  ┃
┃  ┃ ⚠️  WARNING                                                       ┃  ┃
┃  ┃ Confirmation rate at 70% threshold (last hour: 71%)              ┃  ┃
┃  ┃                                                                   ┃  ┃
┃  ┃ 💡 Recommendation: Monitor closely. Check email deliverability   ┃  ┃
┃  ┃ if rate drops below 70%.                                         ┃  ┃
┃  ┃                                                                   ┃  ┃
┃  ┃ [View Details] [Dismiss]                                         ┃  ┃
┃  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  ┃
┃                                                                        ┃
┃  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  ┃
┃  ┃ ⚠️  WARNING                                                       ┃  ┃
┃  ┃ 40 emails sent >24h ago with no link clicks (4%)                 ┃  ┃
┃  ┃                                                                   ┃  ┃
┃  ┃ 💡 Recommendation: Check spam filter settings or email           ┃  ┃
┃  ┃ deliverability with email service provider.                      ┃  ┃
┃  ┃                                                                   ┃  ┃
┃  ┃ [View Details] [Dismiss]                                         ┃  ┃
┃  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  ┃
┃                                                                        ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

## Tablet Layout (768px - 1024px)

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 🐾 PetForce                      [User] [☰] ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                                             ┃
┃  Registration Funnel Health                 ┃
┃  Status: ● Healthy   Alerts: 2 ⚠️           ┃
┃  Period: Last 24h ▼    Updated: 12:34 PM   ┃
┃                                             ┃
┣━━━━━━━━━━━━━━━━━━┯━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                  │                         ┃
┃  Started         │  Completed              ┃
┃  1,247           │  1,123 (90%)            ┃
┃  +12%            │  +10%                   ┃
┃  ▁▂▃▄▅▆▇█▇▆▅    │  ▁▂▃▄▅▆▇█▇▆▅           ┃
┃                  │                         ┃
┣━━━━━━━━━━━━━━━━━━┿━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                  │                         ┃
┃  Confirmed       │  First Login            ┃
┃  786 (70%) ⚠️    │  724 (92%)              ┃
┃  -5%             │  +8%                    ┃
┃  ▁▂▃▄▃▂▁▂▃▄▅    │  ▁▂▃▄▅▆▇█▇▆▅           ┃
┃                  │                         ┃
┣━━━━━━━━━━━━━━━━━━┷━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                                             ┃
┃  Registration Funnel                        ┃
┃                                             ┃
┃  Started → Completed → Confirmed → Login   ┃
┃   1,247     1,123       786        724     ┃
┃          90%       70%⚠️      92%           ┃
┃                                             ┃
┃  Biggest Drop: Completed → Confirmed       ┃
┃  💡 Check email delivery health            ┃
┃                                             ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                                             ┃
┃  Email Delivery Health                      ┃
┃                                             ┃
┃  Sent: 1,123  Clicked: 820 (73%)           ┃
┃  Confirmed: 786 (96% of clicks) ✅          ┃
┃  Avg Time to Click: 8 min                  ┃
┃  Avg Time to Confirm: 12 min               ┃
┃  Spam Issues: 40 (4%) ⚠️                    ┃
┃                                             ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                                             ┃
┃  Login Success Rate                         ┃
┃  89% ✅ (1,408 / 1,580 attempts)            ┃
┃                                             ┃
┃  [Line chart - full width]                  ┃
┃                                             ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                                             ┃
┃  Active Alerts (2)                          ┃
┃  [Alert cards stacked]                      ┃
┃                                             ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

## Mobile Layout (<768px)

```
┏━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 🐾 PetForce     [☰]    ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                        ┃
┃ Registration Funnel    ┃
┃ Status: ● Healthy      ┃
┃ Alerts: 2 ⚠️            ┃
┃ Last 24h (12:34 PM)    ┃
┃                        ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                        ┃
┃  Started               ┃
┃  1,247                 ┃
┃  +12% vs prev          ┃
┃  ▁▂▃▄▅▆▇█▇▆▅          ┃
┃                        ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                        ┃
┃  Completed             ┃
┃  1,123 (90%)           ┃
┃  +10% vs prev          ┃
┃  ▁▂▃▄▅▆▇█▇▆▅          ┃
┃                        ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                        ┃
┃  Confirmed ⚠️           ┃
┃  786 (70%)             ┃
┃  -5% vs prev           ┃
┃  ▁▂▃▄▃▂▁▂▃▄▅          ┃
┃                        ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                        ┃
┃  First Login           ┃
┃  724 (92%)             ┃
┃  +8% vs prev           ┃
┃  ▁▂▃▄▅▆▇█▇▆▅          ┃
┃                        ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                        ┃
┃  Funnel                ┃
┃  Started → Completed   ┃
┃   90%                  ┃
┃  Completed → Confirmed ┃
┃   70% ⚠️               ┃
┃  Confirmed → Login     ┃
┃   92%                  ┃
┃                        ┃
┃  Biggest Drop:         ┃
┃  Completed→Confirmed   ┃
┃                        ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                        ┃
┃  Email Health          ┃
┃  Sent: 1,123           ┃
┃  Clicked: 820 (73%)    ┃
┃  Confirmed: 786        ┃
┃  Spam: 40 (4%) ⚠️      ┃
┃                        ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                        ┃
┃  Login Success         ┃
┃  89% ✅                 ┃
┃  1,408 / 1,580         ┃
┃                        ┃
┃  [Small line chart]    ┃
┃                        ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                        ┃
┃  Alerts (2)            ┃
┃                        ┃
┃  ⚠️ Confirmation 70%   ┃
┃  [View]                ┃
┃                        ┃
┃  ⚠️ 40 spam issues     ┃
┃  [View]                ┃
┃                        ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━┛
```

## Component Specifications

### 1. KPI Card

```
┏━━━━━━━━━━━━━━━━━━┓
┃ Started          ┃ ← Title
┃ 1,247            ┃ ← Large number (value)
┃ +12% vs prev     ┃ ← Trend (green if positive, red if negative)
┃ ▁▂▃▄▅▆▇█▇▆▅     ┃ ← Sparkline (last 24 hours)
┗━━━━━━━━━━━━━━━━━━┛

┏━━━━━━━━━━━━━━━━━━┓
┃ Confirmed    ⚠️  ┃ ← Title with status icon
┃ 786 (70%)        ┃ ← Value with percentage
┃ -5% vs prev      ┃ ← Trend (red because negative)
┃ ▁▂▃▄▃▂▁▂▃▄▅     ┃ ← Sparkline shows decline
┗━━━━━━━━━━━━━━━━━━┛
```

**Colors**:
- Title: #1F2937 (gray-800)
- Value: #111827 (gray-900)
- Positive trend: #16A34A (green-600)
- Negative trend: #DC2626 (red-600)
- Sparkline: #2563EB (blue-600)
- Warning icon: #EAB308 (yellow-500)

### 2. Funnel Chart

```
Started      Completed     Confirmed     First Login
  1,247  →     1,123    →     786     →      724
         90%           70%⚠️          92%

[████████████████████]
            [████████████████]
                      [██████████]
                            [██████████]

Biggest Drop: Completed → Confirmed (337 users, 30% loss)
💡 Action: Check email delivery health below
```

**Visual Design**:
- Bars: Blue gradient (#2563EB → #1E40AF)
- Warning stage: Red outline (#DC2626)
- Drop-off percentage: Bold, colored by health
- Action recommendation: Light blue background (#EFF6FF)

### 3. Alert Card

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ ⚠️  WARNING                                       ┃ ← Header (yellow bg)
┃ Confirmation rate at 70% threshold                ┃ ← Title
┃                                                   ┃
┃ Last hour: 45 confirmed / 63 completed = 71%     ┃ ← Details
┃                                                   ┃
┃ 💡 Recommendation: Monitor closely. Check email  ┃ ← Action
┃ deliverability if rate drops below 70%.           ┃
┃                                                   ┃
┃ [View Details] [Dismiss]                          ┃ ← Actions
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

**Colors**:
- Warning: #FEF3C7 background (yellow-100), #EAB308 border (yellow-500)
- Critical: #FEE2E2 background (red-100), #DC2626 border (red-600)

### 4. Status Badge

```
Healthy:  ● Healthy      (Green dot + text)
Warning:  ● Warning      (Yellow dot + text)
Critical: ● Critical     (Red dot + text)
```

**Colors**:
- Healthy: #16A34A (green-600)
- Warning: #EAB308 (yellow-500)
- Critical: #DC2626 (red-600)

## Color Palette Reference

### Primary Colors
```
Blue:    #2563EB  (Primary)
Purple:  #7C3AED  (Secondary)
Pink:    #DB2777  (Accent)
```

### Status Colors
```
Success: #16A34A  (Green-600)
Warning: #EAB308  (Yellow-500)
Error:   #DC2626  (Red-600)
Neutral: #6B7280  (Gray-500)
```

### Text Colors
```
Primary:   #111827  (Gray-900) - Main headings
Secondary: #1F2937  (Gray-800) - Labels
Tertiary:  #4B5563  (Gray-600) - Supporting text
Muted:     #9CA3AF  (Gray-400) - Timestamps, metadata
```

### Background Colors
```
Page:      #FFFFFF  (White)
Card:      #F9FAFB  (Gray-50)
Hover:     #F3F4F6  (Gray-100)
Success:   #F0FDF4  (Green-50)
Warning:   #FEF3C7  (Yellow-100)
Error:     #FEE2E2  (Red-100)
```

## Interactive States

### KPI Card Hover
- Border: Add #2563EB 2px border
- Shadow: Add subtle shadow
- Cursor: Pointer (indicates clickable)
- Behavior: Click to drill down into time-series

### Alert Dismiss
- Button hover: Darken background 10%
- Button click: Fade out alert card
- Behavior: Store dismissal in localStorage

### Period Selector
```
[Last 24h ▼]  ← Dropdown
Options:
- Last hour
- Last 24 hours (default)
- Last 7 days
- Last 30 days
- Custom range...
```

## Accessibility Features

### Screen Reader Text
```html
<div aria-label="Registration funnel dashboard">
  <div role="status" aria-live="polite">
    Dashboard updated at 12:34 PM.
    1,247 registrations started.
    Confirmation rate: 70% (warning threshold).
    2 active alerts.
  </div>
</div>
```

### Keyboard Navigation
- Tab: Navigate between KPI cards
- Enter: Open card drill-down
- Esc: Close drill-down
- Arrow keys: Navigate within charts

### Color-blind Friendly
- Icons + Text + Color (triple coding)
- Not relying on red/green alone
- Patterns in charts (stripes, dots)

## Responsive Breakpoints

```css
/* Mobile-first approach */
@media (max-width: 767px) {
  /* Stack all elements vertically */
  /* Simplify charts */
  /* Hide sparklines (show trend % only) */
}

@media (min-width: 768px) and (max-width: 1023px) {
  /* 2-column KPI grid */
  /* Simplified funnel */
}

@media (min-width: 1024px) {
  /* 4-column KPI grid */
  /* Full funnel visualization */
  /* Side-by-side panels */
}
```

## Loading States

### KPI Card Loading
```
┏━━━━━━━━━━━━━━━━━━┓
┃ Started          ┃
┃ ░░░░             ┃ ← Skeleton loader (pulse animation)
┃ ░░░░░░░░         ┃
┃ ░░░░░░░░░░░░░░   ┃
┗━━━━━━━━━━━━━━━━━━┛
```

### Chart Loading
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                              ┃
┃     ⏳ Loading chart...      ┃
┃                              ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

## Error States

### Chart Error
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                              ┃
┃  ❌ Failed to load chart     ┃
┃                              ┃
┃  [Retry]                     ┃
┃                              ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

## Animation Guidelines

### Page Load
- KPI cards: Fade in staggered (100ms delay each)
- Charts: Slide up on appear
- Sparklines: Draw from left to right (500ms)

### Data Update
- Values: Count up animation (300ms)
- Trends: Pulse highlight (200ms)
- Charts: Smooth transition (400ms)

### Alert Appearance
- Slide down from top (300ms)
- Gentle bounce at end

## Print Styles

When printing dashboard:
- Remove background colors (except critical alerts)
- Expand all charts to full width
- Hide interactive elements (buttons, dropdowns)
- Show timestamp of print
- Page breaks between major sections

---

**Next Steps for Dexter**:
1. Review wireframes for usability
2. Validate responsive behavior makes sense
3. Suggest improvements to layout/hierarchy
4. Approve color palette for accessibility

**Questions for Dexter**:
1. Does the visual hierarchy work? (KPIs → Funnel → Details)
2. Is the mobile layout scannable enough?
3. Should we add any interactive tooltips?
4. Any concerns about color choices for accessibility?

---

**Version**: 1.0  
**Last Updated**: 2026-01-25  
**Status**: READY FOR DEXTER REVIEW
