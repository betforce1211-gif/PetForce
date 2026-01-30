# PetForce Design Skill

Comprehensive UI/UX design guidance for PetForce. This skill provides design system standards, component specifications, accessibility requirements, and cross-platform design patterns.

## Product Philosophy

**Core Principle**: "Pets are part of the family, so let's take care of them as simply as we can."

Design principles:
- **Effortless Interactions** - Maximum 3 steps for any critical pet care action
- **Compassionate Language** - Especially for sensitive situations (illness, loss)
- **Proactive Guidance** - Surface preventive information before problems arise
- **Joyful Moments** - Celebrate the bond between pets and families
- **Accessibility for All** - Every pet family, regardless of technical skill or ability, should be able to use PetForce

## Design System

### Design Tokens

**Always use design tokens** - never hard-code values.

Token hierarchy:
1. **Primitive tokens** - Raw values (colors, spacing, typography)
2. **Semantic tokens** - Purpose-based (background-primary, text-secondary)
3. **Component tokens** - Specific usage (button-padding, card-shadow)

Token naming convention: `Category-Property-Variant-State`

Examples:
- `color-text-primary`
- `color-background-secondary`
- `spacing-component-gap`
- `radius-button-default`
- `shadow-card-hover`

### Color System

**Primary Palette** (Blue):
- 50-900 scale for full range
- Default: #3B82F6 (blue-500)
- Use for brand, interactive elements

**Neutral Palette** (Gray):
- 50-950 scale
- Use for text, backgrounds, borders

**Semantic Colors**:
- **Success** (Green): Positive feedback, confirmations
- **Warning** (Amber): Caution, important information
- **Error** (Red): Problems, destructive actions
- **Info** (Blue): Informational messages

### Typography Scale

```
Display 1:  48px / 1.1  / Bold     - Hero headlines
Display 2:  36px / 1.2  / Bold     - Page titles
H1:         30px / 1.2  / Semibold - Section headers
H2:         24px / 1.3  / Semibold - Subsection headers
H3:         20px / 1.4  / Semibold - Card titles
H4:         18px / 1.4  / Medium   - Component headers
Body Large: 18px / 1.6  / Regular  - Lead paragraphs
Body:       16px / 1.6  / Regular  - Default text
Body Small: 14px / 1.5  / Regular  - Secondary text
Label:      14px / 1.4  / Medium   - Form labels
Caption:    12px / 1.4  / Regular  - Helper text
```

**Font Families**:
- Sans: Inter (primary), system fallbacks
- Mono: JetBrains Mono, Fira Code (code blocks)

### Spacing System

Base unit: **4px**

Common values:
- `spacing-1`: 4px
- `spacing-2`: 8px
- `spacing-3`: 12px
- `spacing-4`: 16px
- `spacing-6`: 24px
- `spacing-8`: 32px
- `spacing-12`: 48px

## Component Specifications

### Button Component

**Variants**:
- **Primary**: High emphasis, filled brand color - Use for main actions, CTAs
- **Secondary**: Medium emphasis, outlined - Use for secondary actions
- **Tertiary**: Low emphasis, text only - Use for inline actions
- **Destructive**: Red, signals danger - Use for delete, remove, cancel

**Sizes**:
- Small: 32px height, 12px padding, 13px text
- Medium: 40px height, 16px padding, 14px text (default)
- Large: 48px height, 20px padding, 16px text

**States**: Default → Hover → Active → Focus → Disabled → Loading

**Rules**:
- Only one primary button per section
- Icons: 16px for small, 20px for medium/large
- Min width: 80px
- Touch target: Minimum 44x44px

### Input Component

**Anatomy**:
- Label (with required indicator if needed)
- Input field (with optional icon)
- Helper text or error message

**States**:
- Default: Gray border (#E5E7EB)
- Hover: Darker border (#D1D5DB)
- Focus: Blue border + ring (#3B82F6)
- Error: Red border + error message (#EF4444)
- Disabled: Gray background, reduced opacity
- Read-only: No border, background only

**Sizes**:
- Small: 36px height, 14px text
- Medium: 44px height, 16px text (default)
- Large: 52px height, 18px text

**Variations**: Text, Password, Search, Number, Textarea, Select, Combobox

### Card Component

**Anatomy**:
- Optional media (image, video)
- Optional overline (category)
- Card title (heading)
- Supporting text (description)
- Optional actions (buttons)

**Variants**:
- Elevated: Shadow, white background
- Outlined: Border, no shadow
- Filled: Subtle background, no border

**Spacing**:
- Padding: 16px (compact) / 24px (default) / 32px (spacious)
- Gap: 12px between elements
- Radius: 8px (default) / 12px (prominent)

## Interactive States Checklist

For EVERY interactive component:
- [ ] Default
- [ ] Hover (desktop)
- [ ] Focus (keyboard)
- [ ] Active/Pressed
- [ ] Disabled
- [ ] Loading
- [ ] Error
- [ ] Success (if applicable)
- [ ] Empty (if applicable)

## Accessibility Requirements

### WCAG AA Compliance (Minimum)

**Color Contrast**:
- Normal text (<18px): 4.5:1 minimum
- Large text (≥18px bold or ≥24px): 3.0:1 minimum
- UI components: 3.0:1 minimum
- Focus indicators: 3.0:1 minimum

**Quick Checks**:
- ✅ #374151 on white: 10:1 (great)
- ✅ #6B7280 on white: 5:1 (good for large)
- ⚠️ #9CA3AF on white: 2.9:1 (fails for text)
- ❌ #D1D5DB on white: 1.8:1 (fails)

**Touch Targets**:
- iOS: 44 x 44 pt minimum
- Android: 48 x 48 dp minimum
- Web: 44 x 44 px minimum (mobile)
- Spacing: 8px minimum between targets

**Accessibility Checklist**:
- [ ] Color contrast ≥ 4.5:1 (text)
- [ ] Color contrast ≥ 3:1 (UI)
- [ ] Not color-only indicators
- [ ] Touch targets ≥ 44px
- [ ] Focus indicators visible
- [ ] Keyboard navigable
- [ ] Screen reader labels (ARIA)
- [ ] Reduced motion support
- [ ] Text resizable to 200%
- [ ] Error messages clear

## Responsive Design

### Breakpoints

```
xs:   0-479px      - Small phones
sm:   480-639px    - Large phones
md:   640-767px    - Small tablets
lg:   768-1023px   - Tablets
xl:   1024-1279px  - Laptops
2xl:  1280px+      - Desktops
```

### Layout Patterns

**Mobile → Tablet → Desktop**:
- Navigation: Hamburger → Tab bar → Full nav
- Cards: Stack → 2 columns → 3-4 columns
- Tables: Cards → Scroll → Full table
- Modals: Full screen → Centered → Side panel

## Platform-Specific Guidelines

### iOS
- Safe area insets (notch, home indicator)
- 44pt minimum touch targets
- SF Pro font or system
- Large titles pattern
- Tab bar: 49pt height
- Nav bar: 44pt height
- Rounded corners: 10-13pt

### Android
- Material Design 3 guidelines
- 48dp minimum touch targets
- Roboto or system font
- Bottom nav: 80dp height
- App bar: 64dp height
- FAB for primary actions
- Rounded corners: 12-16dp

### Web
- 44px minimum touch targets (mobile)
- Hover states required (desktop)
- Keyboard navigation essential
- Focus visible on all interactive
- Responsive breakpoints
- Skip links for navigation

## Animation Guidelines

### Duration
- Micro (feedback): 100-150ms - Button press, toggle
- Small (state): 200-250ms - Hover, focus, small reveal
- Medium (transition): 300-400ms - Page transitions, modals
- Large (complex): 400-600ms - Complex sequences

### Easing
- **ease-out**: Elements entering (fast start, slow end)
- **ease-in**: Elements leaving (slow start, fast end)
- **ease-in-out**: State changes (smooth both ends)
- **linear**: Progress indicators only

### Rules
- ✅ Keep animations under 500ms
- ✅ Use consistent timing across similar interactions
- ✅ Respect prefers-reduced-motion
- ✅ Make animations skippable if blocking
- ❌ Don't animate just because you can
- ❌ Don't use bouncy/playful animations for serious actions
- ❌ Don't animate large layout shifts

### Reduced Motion Support
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Design Review Checklist

### Design Tokens & Consistency
- [ ] Design tokens used consistently (no hard-coded values)
- [ ] All colors, spacing, typography reference design tokens
- [ ] Design system components used where applicable

### Interactive States
- [ ] All interactive states designed (default, hover, focus, active, disabled)
- [ ] Loading states designed for async operations
- [ ] Empty states designed for zero-data scenarios
- [ ] Error states designed with clear messaging

### Accessibility Compliance
- [ ] WCAG AA contrast ratios met (4.5:1 for text, 3.0:1 for UI)
- [ ] Color not used as only indicator (patterns/labels included)
- [ ] Touch targets meet minimum size (44pt iOS, 48dp Android, 44px Web)
- [ ] Focus indicators visible for keyboard navigation
- [ ] Screen reader labels and ARIA attributes specified

### Platform & Responsiveness
- [ ] Design considers all target platforms (mobile, tablet, desktop)
- [ ] Platform conventions respected (iOS vs Android patterns)
- [ ] Safe areas handled (notch, home indicator)
- [ ] Responsive breakpoints defined with layout behavior

### Documentation & Handoff
- [ ] Design specs documented for engineering handoff
- [ ] Component anatomy documented (sizes, spacing, behavior)
- [ ] Interaction patterns clearly specified
- [ ] Edge cases and error scenarios addressed

## Component Templates

### Button Template (React + Tailwind)

```tsx
// Base button with all variants and states
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center',
    'font-semibold transition-colors duration-150',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
  ],
  {
    variants: {
      variant: {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500',
        secondary: 'bg-white text-gray-900 border border-gray-300 hover:bg-gray-50',
        tertiary: 'bg-transparent text-blue-600 hover:bg-blue-50',
        destructive: 'bg-red-600 text-white hover:bg-red-700',
      },
      size: {
        sm: 'h-8 px-3 text-sm rounded-md',
        md: 'h-10 px-4 text-sm rounded-md',
        lg: 'h-12 px-5 text-base rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);
```

### Design Tokens Template

```typescript
// Token hierarchy: Primitives → Semantic → Components
export const primitives = {
  colors: {
    blue: {
      500: '#3B82F6',
      600: '#2563EB',
      // ...
    },
    gray: {
      900: '#111827',
      600: '#4B5563',
      // ...
    },
  },
  spacing: {
    3: '12px',
    4: '16px',
    // ...
  },
};

export const semantic = {
  background: {
    primary: primitives.colors.white,
    brand: primitives.colors.blue[500],
  },
  text: {
    primary: primitives.colors.gray[900],
    brand: primitives.colors.blue[600],
  },
};

export const components = {
  button: {
    primary: {
      background: semantic.background.brand,
      text: semantic.text.inverse,
    },
  },
};
```

## Integration with Other Agents

### With Peter (Product Manager)
- Receive feature requirements
- Design user flows and wireframes
- Provide design feasibility input

### With Engrid (Engineering Lead)
- Provide detailed specs and tokens
- Review implementations
- Answer design questions

### With Ana (Analytics)
- Design dashboard layouts
- Create data visualization components
- Ensure chart accessibility

### With Tucker (QA)
- Define states to test
- Provide accessibility requirements
- Review implementations against specs

## Resources

### Design Configuration
See `.dexter.yml` in project root for:
- Brand identity
- Color system
- Typography scale
- Spacing tokens
- Component defaults
- Accessibility settings
- Platform targets

### Reference Files
- `dexter-design-agent/DEXTER.md` - Complete design system documentation
- `dexter-design-agent/CLAUDE.md` - Agent behavior and templates
- `dexter-design-agent/templates/Button.tsx.template` - Button component example
- `dexter-design-agent/templates/design-tokens.ts.template` - Token system example
