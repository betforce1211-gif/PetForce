# Accessibility Guidelines

Comprehensive guide to building accessible experiences that work for everyone.

## Why Accessibility Matters

**For Users:**

- 15% of the world population has some form of disability
- Temporary disabilities affect everyone (broken arm, bright sunlight)
- Aging affects vision, hearing, and motor skills
- Accessibility benefits all users (better UX, clearer content)

**For Business:**

- Legal requirement (ADA, Section 508, WCAG 2.1)
- Larger potential audience
- Better SEO (semantic HTML)
- Reduced support costs (clearer UI)

**For PetForce:**

- Pet care is for everyone
- We want every pet to receive the best care
- Inclusive design is better design

---

## WCAG 2.1 Level AA Compliance

We follow **Web Content Accessibility Guidelines (WCAG) 2.1 Level AA** as our minimum standard.

### Four Principles (POUR)

1. **Perceivable** - Information must be presentable to users
2. **Operable** - UI components must be operable
3. **Understandable** - Information and operation must be clear
4. **Robust** - Content must work across assistive technologies

---

## Color & Contrast

### Contrast Ratios

**Normal Text (<18px or <14px bold):**

- Minimum: 4.5:1
- Enhanced (AAA): 7:1

**Large Text (≥18px or ≥14px bold):**

- Minimum: 3:1
- Enhanced (AAA): 4.5:1

**UI Components (borders, icons, states):**

- Minimum: 3:1

### Testing Contrast

**Tools:**

- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Accessible Colors](https://accessible-colors.com/)
- Chrome DevTools (Inspect → Color Picker)

**Example:**

```css
/* ✅ Good - 7.28:1 ratio */
.button-primary {
  background: #2d9b87; /* primary-500 */
  color: #ffffff; /* white */
}

/* ❌ Bad - 2.1:1 ratio */
.text-muted {
  color: #d1d5db; /* neutral-300 */
  background: #ffffff; /* white */
}

/* ✅ Fixed - 4.52:1 ratio */
.text-muted {
  color: #6b7280; /* neutral-500 */
  background: #ffffff; /* white */
}
```

### Color Independence

Never rely on color alone to convey information:

```tsx
// ❌ Bad - Color only
<span style={{ color: 'red' }}>Error</span>
<span style={{ color: 'green' }}>Success</span>

// ✅ Good - Icon + color + text
<Alert variant="error">
  <ErrorIcon /> Error: Please check your input
</Alert>

<Alert variant="success">
  <CheckIcon /> Success: Household created
</Alert>
```

---

## Keyboard Navigation

All functionality must be accessible via keyboard.

### Tab Order

- **Logical order**: Follow visual order (top to bottom, left to right)
- **Tab**: Move focus forward
- **Shift+Tab**: Move focus backward
- **Skip to content**: Allow skipping navigation

### Focus Indicators

Always show visible focus indicators:

```css
/* ✅ Good - Clear focus indicator */
button:focus {
  outline: 2px solid #2d9b87;
  outline-offset: 2px;
}

/* ❌ Bad - No focus indicator */
button:focus {
  outline: none; /* NEVER DO THIS */
}
```

### Keyboard Shortcuts

| Key          | Action                           |
| ------------ | -------------------------------- |
| `Tab`        | Next focusable element           |
| `Shift+Tab`  | Previous focusable element       |
| `Enter`      | Activate button/link             |
| `Space`      | Activate button, toggle checkbox |
| `Escape`     | Close modal/dropdown             |
| `Arrow keys` | Navigate lists/menus             |
| `Home/End`   | First/last item in list          |

### Focus Management

**Modal Dialogs:**

```tsx
function Modal({ isOpen, onClose, children }) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Trap focus inside modal
      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );

      const firstElement = focusableElements?.[0] as HTMLElement;
      const lastElement = focusableElements?.[
        focusableElements.length - 1
      ] as HTMLElement;

      firstElement?.focus();

      const handleTabKey = (e: KeyboardEvent) => {
        if (e.key === "Tab") {
          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              e.preventDefault();
              lastElement?.focus();
            }
          } else {
            if (document.activeElement === lastElement) {
              e.preventDefault();
              firstElement?.focus();
            }
          }
        }
      };

      document.addEventListener("keydown", handleTabKey);
      return () => document.removeEventListener("keydown", handleTabKey);
    }
  }, [isOpen]);

  return (
    <div ref={modalRef} role="dialog" aria-modal="true">
      {children}
    </div>
  );
}
```

---

## Screen Readers

### Semantic HTML

Use semantic HTML elements:

```html
<!-- ✅ Good - Semantic -->
<header>
  <nav>
    <ul>
      <li><a href="/">Home</a></li>
    </ul>
  </nav>
</header>

<main>
  <article>
    <h1>Title</h1>
    <p>Content</p>
  </article>
</main>

<footer>
  <p>Copyright</p>
</footer>

<!-- ❌ Bad - Non-semantic -->
<div class="header">
  <div class="nav">
    <div class="link-container">
      <div class="link">Home</div>
    </div>
  </div>
</div>
```

### ARIA Attributes

Use ARIA when semantic HTML isn't enough:

**Common ARIA Attributes:**

```tsx
// Labels
<button aria-label="Close dialog">×</button>

// Descriptions
<input
  type="password"
  aria-describedby="password-requirements"
/>
<p id="password-requirements">
  Password must be at least 8 characters
</p>

// States
<button aria-expanded={isOpen}>
  Menu
</button>

// Live regions
<div aria-live="polite" aria-atomic="true">
  {statusMessage}
</div>

// Hidden content
<span aria-hidden="true">✓</span>
<span className="sr-only">Success</span>
```

### Screen Reader Only Text

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

Usage:

```tsx
<button>
  <TrashIcon aria-hidden="true" />
  <span className="sr-only">Delete household</span>
</button>
```

### Form Labels

Always associate labels with inputs:

```tsx
// ✅ Good - Explicit label
<label htmlFor="household-name">Household Name</label>
<input
  id="household-name"
  type="text"
  name="name"
/>

// ✅ Good - Implicit label
<label>
  Household Name
  <input type="text" name="name" />
</label>

// ❌ Bad - No label
<input type="text" placeholder="Household Name" />
```

### Alt Text

Provide meaningful alt text for images:

```tsx
// ✅ Good - Descriptive
<img
  src="/pets/fluffy.jpg"
  alt="Golden Retriever sitting on grass, looking happy"
/>

// ✅ Good - Decorative (empty alt)
<img
  src="/decorative-pattern.svg"
  alt=""
  role="presentation"
/>

// ❌ Bad - Generic
<img src="/pets/fluffy.jpg" alt="image" />

// ❌ Bad - Redundant
<img src="/pets/fluffy.jpg" alt="Image of a dog" />
```

---

## Touch Targets

### Minimum Size

**Mobile:**

- **iOS**: 44pt × 44pt minimum
- **Android**: 48dp × 48dp minimum
- **Web (mobile)**: 44px × 44px minimum

**Desktop:**

- **Web**: 24px × 24px minimum (larger is better)

### Spacing

Minimum **8px** between touch targets to prevent mis-taps.

```css
/* ✅ Good - Large enough with spacing */
.button {
  min-height: 44px;
  padding: 12px 16px;
  margin: 8px;
}

/* ❌ Bad - Too small and cramped */
.button {
  height: 28px;
  padding: 4px 8px;
  margin: 2px;
}
```

### Visual vs. Touch Area

Visual size can be smaller than touch area:

```tsx
// Visual icon is 20px, but touch area is 44px
<button
  style={{
    width: 44,
    height: 44,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  }}
>
  <Icon size={20} /> {/* Visual size */}
</button>
```

---

## Form Accessibility

### Error Handling

```tsx
<Input
  id="email"
  type="email"
  value={email}
  onChange={handleChange}
  error={errors.email}
  aria-invalid={!!errors.email}
  aria-describedby={errors.email ? "email-error" : undefined}
/>;

{
  errors.email && (
    <p id="email-error" role="alert">
      {errors.email}
    </p>
  );
}
```

### Required Fields

```tsx
<label htmlFor="household-name">
  Household Name
  <span aria-label="required">*</span>
</label>
<input
  id="household-name"
  type="text"
  required
  aria-required="true"
/>
```

### Field Groups

```tsx
<fieldset>
  <legend>Pet Information</legend>

  <label htmlFor="pet-name">Pet Name</label>
  <input id="pet-name" type="text" />

  <label htmlFor="pet-species">Species</label>
  <select id="pet-species">
    <option>Dog</option>
    <option>Cat</option>
  </select>
</fieldset>
```

---

## Dynamic Content

### Live Regions

Announce dynamic content changes to screen readers:

```tsx
// Polite - Wait for user to pause
<div aria-live="polite">
  {successMessage}
</div>

// Assertive - Interrupt immediately (use sparingly)
<div aria-live="assertive" role="alert">
  {errorMessage}
</div>

// Off - Don't announce (default)
<div aria-live="off">
  {regularContent}
</div>
```

### Loading States

```tsx
<button disabled={loading} aria-busy={loading}>
  {loading ? (
    <>
      <Spinner aria-hidden="true" />
      <span>Creating...</span>
    </>
  ) : (
    "Create Household"
  )}
</button>;

{
  loading && (
    <div role="status" aria-live="polite" className="sr-only">
      Creating household, please wait
    </div>
  );
}
```

---

## Navigation

### Skip Links

Allow users to skip repetitive content:

```tsx
<a
  href="#main-content"
  className="sr-only focus:not-sr-only"
>
  Skip to main content
</a>

<header>
  {/* Navigation */}
</header>

<main id="main-content">
  {/* Main content */}
</main>
```

### Breadcrumbs

```tsx
<nav aria-label="Breadcrumb">
  <ol>
    <li>
      <a href="/">Home</a>
    </li>
    <li>
      <a href="/households">Households</a>
    </li>
    <li aria-current="page">The Smith Household</li>
  </ol>
</nav>
```

### Landmarks

Use landmark roles:

```html
<header role="banner">
  <!-- Site header -->
</header>

<nav role="navigation" aria-label="Main navigation">
  <!-- Primary navigation -->
</nav>

<main role="main">
  <!-- Main content -->
</main>

<aside role="complementary">
  <!-- Sidebar -->
</aside>

<footer role="contentinfo">
  <!-- Site footer -->
</footer>
```

---

## Motion & Animation

### Respect User Preferences

```css
/* Reduce motion for users who prefer it */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

```tsx
// JavaScript
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

// Disable animations if user prefers
const animationDuration = prefersReducedMotion ? 0 : 300;
```

### Safe Animations

- Avoid rapid flashing (3+ times per second)
- Avoid parallax scrolling (motion sickness)
- Provide pause/stop controls for auto-playing content
- Don't autoplay videos with sound

---

## Testing Checklist

### Automated Testing

Run these tools on every page:

- [ ] **axe DevTools** - Browser extension
- [ ] **Lighthouse** - Chrome DevTools audit
- [ ] **WAVE** - Web accessibility evaluation tool
- [ ] **eslint-plugin-jsx-a11y** - JSX linting

### Manual Testing

#### Keyboard

- [ ] Tab through all interactive elements
- [ ] Focus indicators visible on all elements
- [ ] Logical tab order (follows visual flow)
- [ ] All features accessible via keyboard
- [ ] Escape closes modals/dropdowns
- [ ] No keyboard traps

#### Screen Reader

- [ ] VoiceOver (Mac/iOS) tested
- [ ] NVDA (Windows) tested
- [ ] TalkBack (Android) tested
- [ ] All content announced correctly
- [ ] Form labels associated properly
- [ ] Buttons/links have meaningful labels
- [ ] Images have appropriate alt text
- [ ] Headings in logical order (h1 → h2 → h3)

#### Visual

- [ ] Color contrast meets WCAG AA (4.5:1)
- [ ] Content readable at 200% zoom
- [ ] No horizontal scrolling at 320px width
- [ ] Text spacing can be adjusted
- [ ] Content understandable without color

#### Touch

- [ ] Touch targets ≥44pt × 44pt (iOS) or 48dp (Android)
- [ ] Adequate spacing between targets (8px+)
- [ ] Touch feedback on all interactive elements
- [ ] Swipe gestures have alternatives

---

## Common Patterns

### Modal Dialog

```tsx
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
>
  <h2 id="modal-title">Delete Household</h2>
  <p id="modal-description">
    Are you sure you want to delete this household? This action cannot be
    undone.
  </p>

  <button onClick={handleDelete}>Delete</button>
  <button onClick={handleCancel}>Cancel</button>
</div>
```

### Dropdown Menu

```tsx
<button aria-haspopup="true" aria-expanded={isOpen} onClick={toggleMenu}>
  Menu
</button>;

{
  isOpen && (
    <ul role="menu">
      <li role="menuitem">
        <button onClick={handleOption1}>Option 1</button>
      </li>
      <li role="menuitem">
        <button onClick={handleOption2}>Option 2</button>
      </li>
    </ul>
  );
}
```

### Tabs

```tsx
<div>
  <div role="tablist" aria-label="Household tabs">
    <button
      role="tab"
      aria-selected={activeTab === "members"}
      aria-controls="members-panel"
      id="members-tab"
      onClick={() => setActiveTab("members")}
    >
      Members
    </button>

    <button
      role="tab"
      aria-selected={activeTab === "pets"}
      aria-controls="pets-panel"
      id="pets-tab"
      onClick={() => setActiveTab("pets")}
    >
      Pets
    </button>
  </div>

  <div
    role="tabpanel"
    id="members-panel"
    aria-labelledby="members-tab"
    hidden={activeTab !== "members"}
  >
    {/* Members content */}
  </div>

  <div
    role="tabpanel"
    id="pets-panel"
    aria-labelledby="pets-tab"
    hidden={activeTab !== "pets"}
  >
    {/* Pets content */}
  </div>
</div>
```

---

## Resources

### Guidelines

- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [Inclusive Components](https://inclusive-components.design/)

### Testing Tools

- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE](https://wave.webaim.org/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

### Screen Readers

- **VoiceOver** (Mac/iOS) - Built-in (Cmd+F5)
- **NVDA** (Windows) - Free download
- **JAWS** (Windows) - Commercial
- **TalkBack** (Android) - Built-in

### Learning

- [Web Accessibility by Google](https://www.udacity.com/course/web-accessibility--ud891)
- [A11ycasts with Rob Dodson](https://www.youtube.com/playlist?list=PLNYkxOF6rcICWx0C9LVWWVqvHlYJyqw7g)
- [The A11Y Project](https://www.a11yproject.com/)

---

## Getting Help

**Questions about accessibility?**

- Post in #accessibility Slack channel
- Tag @dexter in GitHub issues
- Review accessibility section in PRs

**Found an accessibility issue?**

- Create issue with `accessibility` label
- Include screenshots and steps to reproduce
- Note which assistive technology is affected

---

Built with ❤️ by Dexter (UX Design Agent)

**Accessibility is not a feature. It's a necessity.**

**Every user deserves an excellent experience, regardless of ability.**
