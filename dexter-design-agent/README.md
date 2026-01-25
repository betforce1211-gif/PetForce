# 🎨 Dexter: The UX/UI Design Agent

> *Design is not just what it looks like. Design is how it works.*

Dexter is a passionate UX/UI Design agent powered by Claude Code. He obsesses over every pixel, ensuring beautiful, consistent, accessible experiences across every platform and device. When Dexter designs something, it's not just pretty—it works perfectly.

## ✨ Features

| Feature | Description |
|---------|-------------|
| **Design Systems** | Complete token-based design systems |
| **Component Specs** | Detailed specs with all states |
| **Cross-Platform** | iOS, Android, Web, Desktop |
| **Accessibility** | WCAG AA/AAA compliance |
| **Responsive** | Mobile-first, all breakpoints |
| **Design Tokens** | Exportable to any format |

## 📁 Package Contents

```
dexter-design-agent/
├── DEXTER.md                             # Full design documentation
├── CLAUDE.md                             # Claude Code agent configuration
├── README.md                             # This file
├── QUICKSTART.md                         # 10-minute setup guide
├── .dexter.yml                           # Dexter configuration file
└── templates/
    ├── design-tokens.ts.template         # Complete token system
    └── Button.tsx.template               # Example component
```

## 🚀 Quick Start

### 1. Copy files to your project

```bash
cp dexter-design-agent/.dexter.yml your-repo/
cp dexter-design-agent/CLAUDE.md your-repo/
cp -r dexter-design-agent/templates your-repo/src/design-system/
```

### 2. Customize your tokens

```yaml
# .dexter.yml
colors:
  primary:
    500: '#3B82F6'    # Your brand color
    600: '#2563EB'    # Darker shade
```

### 3. Use the design system

```tsx
import { tokens } from '@/design-system/tokens';
import { Button } from '@/design-system/Button';

// Use tokens
const style = {
  color: tokens.semantic.text.primary,
  padding: tokens.primitives.spacing[4],
};

// Use components
<Button variant="primary" size="md">
  Click me
</Button>
```

**[📖 Full Setup Guide →](./QUICKSTART.md)**

## 🎨 Design Token Layers

```
PRIMITIVE TOKENS (Raw values)
    ↓
SEMANTIC TOKENS (Purpose-based)
    ↓
COMPONENT TOKENS (Specific usage)
```

| Layer | Example | Use Case |
|-------|---------|----------|
| Primitive | `blue-500: #3B82F6` | Raw color value |
| Semantic | `text-primary: gray-900` | "Primary text color" |
| Component | `button-bg: blue-600` | "Button background" |

## 📊 Chart Selection Guide

| Show This... | Use This Chart |
|--------------|----------------|
| Trend | 📈 Line chart |
| Compare | 📊 Bar chart |
| Part of whole | 🥧 Pie (≤5 items) |
| Progress | 🎯 Gauge |
| Single value | 🔢 Big number |

## 📱 Cross-Platform Support

| Platform | Touch Target | Key Patterns |
|----------|--------------|--------------|
| iOS | 44pt | Safe area, large titles, tab bar |
| Android | 48dp | Material Design 3, FAB, bottom nav |
| Web Mobile | 44px | Hamburger menu, full-width inputs |
| Web Desktop | N/A | Hover states, keyboard nav |

## ♿ Accessibility

### Color Contrast Requirements
```
Normal text:     4.5:1 minimum
Large text:      3.0:1 minimum
UI components:   3.0:1 minimum
```

### Component Checklist
- [ ] All states designed (hover, focus, active, disabled)
- [ ] Color contrast verified
- [ ] Touch targets ≥ 44px
- [ ] Focus indicators visible
- [ ] Screen reader labels provided
- [ ] Keyboard navigable
- [ ] Reduced motion supported

## 🤖 Using with Claude Code

```
You: Design a card component for our product

Dexter: 🧩 Component Spec: Product Card

VARIANTS
┌─────────────────────────────┐
│  [Image]                    │
│  Category                   │
│  Product Title              │
│  $99.00        [Add to Cart]│
└─────────────────────────────┘

ANATOMY
• Image (aspect 16:9)
• Category (12px, gray-500)
• Title (16px semibold)
• Price (18px bold)
• Button (secondary, sm)

STATES
✓ Default
✓ Hover (shadow elevation)
✓ Focus (ring outline)
✓ Loading (skeleton)

SPACING
• Padding: 16px
• Gap: 12px
• Radius: 8px

RESPONSIVE
• Mobile: Full width, stack
• Tablet: 2 columns
• Desktop: 3-4 columns

Ready for implementation!
```

## 🎯 Dexter's Commands

### Design System
```bash
dexter create tokens --format css|scss|js
dexter export tokens --format figma|tailwind
```

### Components
```bash
dexter spec component "<n>"
dexter generate component "<n>" --framework react
```

### Audit
```bash
dexter audit accessibility
dexter audit contrast
dexter audit consistency
```

### User Flows
```bash
dexter flow create "<n>"
dexter flow export "<n>" --format mermaid
```

## 🤝 Integration with Other Agents

| Agent | Integration |
|-------|-------------|
| **Peter** | Receives requirements, provides design input |
| **Engrid** | Provides specs, reviews implementations |
| **Ana** | Designs dashboard layouts, chart components |
| **Tucker** | Defines states to test, accessibility requirements |

## 📋 Configuration

Dexter uses `.dexter.yml`:

```yaml
version: 1

colors:
  primary:
    500: '#3B82F6'
    
typography:
  fonts:
    sans: ['Inter', 'system-ui', 'sans-serif']
    
breakpoints:
  sm: '480px'
  md: '768px'
  lg: '1024px'
  
accessibility:
  level: 'AA'
  contrast:
    normalText: 4.5
```

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [DEXTER.md](./DEXTER.md) | Complete design documentation |
| [CLAUDE.md](./CLAUDE.md) | Claude Code configuration |
| [QUICKSTART.md](./QUICKSTART.md) | 10-minute setup guide |

## 📋 Templates

| Template | Use For |
|----------|---------|
| `design-tokens.ts.template` | Complete token system |
| `Button.tsx.template` | Button component example |

---

<p align="center">
  <strong>Dexter: Your Design Partner</strong><br>
  <em>Every pixel matters. Every interaction should feel magical.</em>
</p>

---

*Design is not just what it looks like. Design is how it works.* 🎨
