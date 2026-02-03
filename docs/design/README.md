# PetForce Design System

Comprehensive design system for building consistent, accessible, and delightful experiences across web and mobile platforms.

## Design Philosophy

**Dexter's Design Principles:**

1. **User-Centered** - Design for real pet owners, not assumptions
2. **Accessible First** - WCAG 2.1 AA compliance is mandatory, not optional
3. **Mobile-Optimized** - 60-80% of users are on mobile; optimize for small screens
4. **Touch-Friendly** - Minimum 44pt touch targets for all interactive elements
5. **Consistency** - Predictable patterns reduce cognitive load
6. **Delightful** - Subtle animations and transitions create joy
7. **Performance** - Fast interactions feel better than beautiful but slow ones

---

## Quick Start

### For Designers

1. **Download Design Kit**: [Figma Community](#) (coming soon)
2. **Review Design Tokens**: [Design Tokens](./design-tokens.md)
3. **Explore Components**: [Component Library](./components.md)
4. **Check Accessibility**: [Accessibility Guidelines](./accessibility.md)

### For Developers

```tsx
import { Button, Card, Input } from "@petforce/ui";

// All components follow design system automatically
<Button variant="primary" size="large">
  Create Household
</Button>;
```

---

## Documentation Structure

### Core Guidelines

1. [**Design Tokens**](./design-tokens.md) - Colors, typography, spacing, shadows
2. [**Component Library**](./components.md) - All UI components with usage examples
3. [**Accessibility**](./accessibility.md) - WCAG 2.1 AA compliance guidelines
4. [**Responsive Design**](./responsive-design.md) - Breakpoints and adaptive layouts
5. [**Interactions**](./interactions.md) - Animation, transitions, and micro-interactions

### Patterns

6. [**Forms**](./patterns/forms.md) - Form design patterns and validation
7. [**Navigation**](./patterns/navigation.md) - Navigation patterns across platforms
8. [**Data Display**](./patterns/data-display.md) - Tables, lists, and cards
9. [**Feedback**](./patterns/feedback.md) - Toasts, modals, and error states
10. [**Empty States**](./patterns/empty-states.md) - Onboarding and empty states

### Mobile

11. [**Mobile Design**](./mobile-design.md) - Platform-specific patterns (iOS/Android)
12. [**Touch Interactions**](./touch-interactions.md) - Gestures and touch targets

---

## Design Tokens

### Color Palette

Our color system is built for accessibility and consistency:

**Primary (Brand Green)**

- `primary-50`: #E6F7F3 (lightest)
- `primary-100`: #B3E8DC
- `primary-200`: #80D9C5
- `primary-500`: #2D9B87 (base)
- `primary-700`: #1F6B5C
- `primary-900`: #0F3A30 (darkest)

**Secondary (Pet Orange)**

- `secondary-50`: #FFF5E6
- `secondary-100`: #FFE0B3
- `secondary-500`: #FF9500
- `secondary-700`: #CC7700
- `secondary-900`: #664400

**Neutrals (Grays)**

- `neutral-0`: #FFFFFF (white)
- `neutral-50`: #F9FAFB
- `neutral-100`: #F3F4F6
- `neutral-200`: #E5E7EB
- `neutral-300`: #D1D5DB
- `neutral-500`: #6B7280
- `neutral-700`: #374151
- `neutral-900`: #111827 (near black)
- `neutral-1000`: #000000 (black)

**Semantic Colors**

- `success-500`: #10B981 (green)
- `warning-500`: #F59E0B (yellow)
- `error-500`: #EF4444 (red)
- `info-500`: #3B82F6 (blue)

### Typography

**Font Family**

- **Web**: Inter (primary), System UI (fallback)
- **Mobile**: SF Pro (iOS), Roboto (Android)

**Type Scale**

- `text-xs`: 12px / 0.75rem
- `text-sm`: 14px / 0.875rem
- `text-base`: 16px / 1rem (body text)
- `text-lg`: 18px / 1.125rem
- `text-xl`: 20px / 1.25rem
- `text-2xl`: 24px / 1.5rem
- `text-3xl`: 30px / 1.875rem
- `text-4xl`: 36px / 2.25rem

**Line Heights**

- `leading-tight`: 1.25
- `leading-normal`: 1.5 (body text)
- `leading-relaxed`: 1.75

**Font Weights**

- `font-normal`: 400 (body text)
- `font-medium`: 500 (emphasis)
- `font-semibold`: 600 (headings)
- `font-bold`: 700 (strong emphasis)

### Spacing Scale

Based on 4px base unit:

- `space-0`: 0px
- `space-1`: 4px
- `space-2`: 8px
- `space-3`: 12px
- `space-4`: 16px (base)
- `space-5`: 20px
- `space-6`: 24px
- `space-8`: 32px
- `space-10`: 40px
- `space-12`: 48px
- `space-16`: 64px
- `space-20`: 80px

### Border Radius

- `rounded-none`: 0px
- `rounded-sm`: 4px
- `rounded`: 8px (default)
- `rounded-lg`: 12px
- `rounded-xl`: 16px
- `rounded-full`: 9999px (circular)

### Shadows

- `shadow-sm`: 0 1px 2px rgba(0, 0, 0, 0.05)
- `shadow`: 0 1px 3px rgba(0, 0, 0, 0.1)
- `shadow-md`: 0 4px 6px rgba(0, 0, 0, 0.1)
- `shadow-lg`: 0 10px 15px rgba(0, 0, 0, 0.1)
- `shadow-xl`: 0 20px 25px rgba(0, 0, 0, 0.1)

---

## Component Library

### Buttons

**Variants:**

- `primary` - Main call-to-action (green)
- `secondary` - Secondary actions (gray)
- `danger` - Destructive actions (red)
- `ghost` - Minimal styling
- `link` - Text link style

**Sizes:**

- `small` - 32px height, 12px padding
- `medium` - 40px height, 16px padding (default)
- `large` - 48px height, 20px padding

**States:**

- `default` - Normal state
- `hover` - Mouse over / touch down
- `focus` - Keyboard focus (2px outline)
- `active` - Being pressed
- `disabled` - Cannot interact

**Example:**

```tsx
<Button variant="primary" size="large">
  Create Household
</Button>

<Button variant="secondary" size="medium" disabled>
  Cancel
</Button>
```

### Inputs

**Types:**

- Text input (single line)
- Text area (multi-line)
- Select dropdown
- Checkbox
- Radio button
- Toggle switch

**States:**

- `default` - Ready for input
- `focus` - Active input
- `filled` - Contains value
- `error` - Validation failed
- `disabled` - Cannot edit

**Example:**

```tsx
<Input
  label="Household Name"
  placeholder="e.g., The Smith Family"
  error="Name is required"
  helperText="Choose a memorable name for your household"
/>
```

### Cards

Containers for related content:

```tsx
<Card>
  <CardHeader>
    <h3>The Smith Household</h3>
    <Badge>3 members</Badge>
  </CardHeader>
  <CardBody>
    <p>Managing 2 dogs and 1 cat</p>
  </CardBody>
  <CardFooter>
    <Button>View Details</Button>
  </CardFooter>
</Card>
```

---

## Accessibility Standards

We follow **WCAG 2.1 Level AA** compliance:

### Color Contrast

- **Normal text**: 4.5:1 minimum
- **Large text** (18px+): 3:1 minimum
- **UI components**: 3:1 minimum

All color combinations are tested and meet standards.

### Keyboard Navigation

- **Tab**: Move focus forward
- **Shift+Tab**: Move focus backward
- **Enter/Space**: Activate buttons/links
- **Escape**: Close modals/dropdowns
- **Arrow keys**: Navigate lists/menus

### Screen Readers

- All images have `alt` text
- Interactive elements have labels
- Form inputs have associated labels
- ARIA attributes for complex components
- Semantic HTML elements

### Touch Targets

- **Minimum size**: 44pt × 44pt (iOS) / 48dp × 48dp (Android)
- **Spacing**: 8pt minimum between targets
- **Hit area**: Extends beyond visual bounds

---

## Responsive Design

### Breakpoints

```css
/* Mobile first */
xs: 0px      /* Mobile phones */
sm: 640px    /* Large phones, small tablets */
md: 768px    /* Tablets */
lg: 1024px   /* Laptops, desktops */
xl: 1280px   /* Large desktops */
2xl: 1536px  /* Extra large screens */
```

### Layout Patterns

**Mobile (xs-sm)**

- Single column
- Bottom navigation
- Full-width cards
- Stacked forms

**Tablet (md)**

- Two columns for lists
- Side navigation (landscape)
- Grid layouts (2×2)

**Desktop (lg+)**

- Three+ columns
- Persistent side navigation
- Grid layouts (3×3, 4×4)
- Multi-panel layouts

---

## Animation & Transitions

### Timing

- **Instant**: 0ms - Immediate feedback
- **Fast**: 150ms - Micro-interactions
- **Normal**: 300ms - Standard transitions (default)
- **Slow**: 500ms - Page transitions

### Easing

- `ease-in`: Start slow, accelerate
- `ease-out`: Start fast, decelerate (default)
- `ease-in-out`: Smooth acceleration/deceleration
- `linear`: Constant speed

### Common Patterns

**Fade In/Out**

```css
.fade-enter {
  opacity: 0;
}
.fade-enter-active {
  opacity: 1;
  transition: opacity 300ms ease-out;
}
```

**Slide In/Out**

```css
.slide-enter {
  transform: translateY(20px);
  opacity: 0;
}
.slide-enter-active {
  transform: translateY(0);
  opacity: 1;
  transition: all 300ms ease-out;
}
```

**Scale**

```css
.scale-enter {
  transform: scale(0.95);
  opacity: 0;
}
.scale-enter-active {
  transform: scale(1);
  opacity: 1;
  transition: all 200ms ease-out;
}
```

---

## Form Design Patterns

### Validation

**Real-time validation:**

- Show errors after field blur (not while typing)
- Show success checkmark when valid
- Disable submit until form is valid

**Error messages:**

- Specific, actionable feedback
- Near the field (not just at top)
- Icon + text for clarity

**Example:**

```tsx
<Input
  label="Email"
  type="email"
  value={email}
  onChange={handleChange}
  error={errors.email}
  success={isValidEmail(email)}
/>
```

### Field Order

1. Start with easiest fields
2. Group related fields
3. End with actions (submit)

### Helper Text

- Use for format examples
- Explain constraints (min/max length)
- Provide context for complex fields

---

## Empty States

Inform and guide users when there's no data:

**Components:**

- Icon (illustrative)
- Heading (what's missing)
- Description (why it's empty)
- Action button (what to do)

**Example:**

```tsx
<EmptyState
  icon={<HomeIcon />}
  title="No households yet"
  description="Create your first household to start managing your pets"
  action={<Button variant="primary">Create Household</Button>}
/>
```

---

## Error Handling

### Error Types

**Validation Errors**

- Inline with field
- Specific message
- How to fix it

**System Errors**

- Toast notification
- Generic message (don't expose internals)
- Retry action if applicable

**Network Errors**

- Toast with retry button
- Offline indicator
- Queue actions for retry

### Error Messages

✅ **Good:**

- "Email is required"
- "Password must be at least 8 characters"
- "This household name is already taken"

❌ **Bad:**

- "Invalid input"
- "Error 500"
- "Something went wrong"

---

## Loading States

### Skeleton Screens

Preferred over spinners for content:

```tsx
<Card>
  <Skeleton height={20} width="60%" />
  <Skeleton height={16} width="100%" />
  <Skeleton height={16} width="80%" />
</Card>
```

### Spinners

For actions and small areas:

```tsx
<Button loading>
  <Spinner size="small" />
  Creating...
</Button>
```

### Progress Indicators

For multi-step processes:

```tsx
<Progress value={60} max={100} />
<p>Step 3 of 5</p>
```

---

## Mobile-Specific Patterns

### Bottom Navigation

- 3-5 items maximum
- Active state clearly indicated
- Icons + labels (labels can hide on scroll)

### Swipe Gestures

- Swipe to delete (lists)
- Swipe between tabs
- Pull to refresh

### Touch Interactions

- Visual feedback on touch (ripple, highlight)
- Long-press for context menus
- Drag and drop for reordering

---

## Dark Mode

Full dark mode support with semantic tokens:

```css
/* Light mode (default) */
--background: #ffffff;
--text: #111827;
--border: #e5e7eb;

/* Dark mode */
@media (prefers-color-scheme: dark) {
  --background: #111827;
  --text: #f9fafb;
  --border: #374151;
}
```

**Guidelines:**

- Never pure black (#000000)
- Reduce shadow intensity
- Adjust contrast ratios
- Test in both modes

---

## Design Checklist

Before shipping any UI:

### Visual Design

- [ ] Follows design tokens (colors, spacing, typography)
- [ ] Consistent with existing patterns
- [ ] Responsive across all breakpoints
- [ ] Dark mode support (if applicable)

### Accessibility

- [ ] Color contrast meets WCAG AA (4.5:1)
- [ ] Touch targets ≥44pt × 44pt
- [ ] Keyboard navigation works
- [ ] Screen reader tested
- [ ] Focus indicators visible

### Interactions

- [ ] Hover states defined
- [ ] Focus states defined
- [ ] Loading states defined
- [ ] Error states defined
- [ ] Success states defined
- [ ] Disabled states defined

### Content

- [ ] Labels are clear and concise
- [ ] Error messages are specific
- [ ] Helper text provides value
- [ ] Empty states are informative
- [ ] Success messages confirm actions

### Performance

- [ ] Images optimized
- [ ] Icons are SVG (scalable)
- [ ] Animations are smooth (60fps)
- [ ] No layout shifts (CLS)

---

## Tools & Resources

### Design Tools

- **Figma** - Primary design tool
- **Figma Community** - Design system kit (coming soon)
- **Contrast Checker** - WCAG compliance testing

### Development Tools

- **Tailwind CSS** - Utility-first CSS (web)
- **React Native StyleSheet** - Native styling (mobile)
- **Storybook** - Component development (coming soon)

### Testing Tools

- **axe DevTools** - Accessibility testing
- **Lighthouse** - Performance and accessibility audits
- **VoiceOver** (iOS) / TalkBack (Android) - Screen reader testing

---

## Contributing to Design System

### Proposing New Components

1. **Check existing components** - Can you extend existing?
2. **Create Figma design** - Share for feedback
3. **Document usage** - When to use, when not to use
4. **Build component** - Follow code standards
5. **Add to Storybook** - Interactive documentation
6. **Add tests** - Accessibility and unit tests
7. **Create PR** - Include design rationale

### Updating Existing Components

1. **Document the problem** - Why change is needed
2. **Show examples** - Current vs. proposed
3. **Consider impact** - Who uses this component?
4. **Migration path** - How to update existing usage?
5. **Create PR** - Include before/after screenshots

---

## Related Documentation

- [Contributing Guide](../../CONTRIBUTING.md)
- [Architecture Documentation](../ARCHITECTURE.md)
- [Accessibility Guidelines](./accessibility.md)
- [Component Library](./components.md)

---

Built with ❤️ by Dexter (UX Design Agent)

**Design is not just how it looks. It's how it works.** — Steve Jobs

**Every pixel serves a purpose. Every interaction delights.**
