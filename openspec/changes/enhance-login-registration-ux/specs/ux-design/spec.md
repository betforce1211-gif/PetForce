# Capability: UX Design (Modifications)

## MODIFIED Requirements

### Requirement: Design Consistent User Flows

User flows MUST be consistent and intuitive across all features (existing requirement - adding authentication scenarios).

#### Scenario: Design authentication flow with progressive disclosure

**Given** Dexter is designing the authentication experience
**When** they create the user flow
**Then** the flow follows progressive disclosure principles (show only what's needed at each step)
**And** the flow has a maximum of 3 screens to complete registration
**And** each screen has one clear primary action
**And** navigation between steps is clear (back buttons, progress indicators if multi-step)
**And** the flow minimizes cognitive load (don't ask for unnecessary information)
**And** the design matches PetForce's "pets are family" philosophy (warm, welcoming, trustworthy)

#### Scenario: Design error recovery flows for authentication

**Given** Dexter is designing error states for authentication
**When** they design error messages
**Then** errors are shown inline near the relevant input (not only at the top of the form)
**And** errors use both color and icons (not color alone for accessibility)
**And** error messages are friendly and actionable (not blaming the user)
**And** recovery actions are clear (e.g., "Forgot password?" link, "Try again" button)
**And** the design prevents errors where possible (e.g., show password requirements upfront, check email exists in real-time)

## ADDED Requirements

### Requirement: Establish Authentication UI Patterns

Authentication screens MUST follow consistent design patterns that can be reused across features.

#### Scenario: Create reusable form patterns

**Given** Dexter is designing authentication forms
**When** they create form components
**Then** all forms follow a consistent structure:
  - Clear heading (e.g., "Welcome Back", "Join the Family")
  - Optional subheading with context
  - Form fields with labels, placeholders, and validation states
  - Primary action button (full-width on mobile, fixed-width on desktop)
  - Secondary actions or links (e.g., "Forgot password?", "Sign up instead")
**And** form fields have consistent styling:
  - Label above input
  - Input with border, padding, and appropriate border-radius
  - Focus state with colored border
  - Error state with red border and error message
  - Success state (if applicable) with green border and checkmark
**And** buttons follow the design system:
  - Primary button: solid background (teal), white text
  - Secondary button: outline style, colored text
  - Loading state: spinner replaces text, button disabled

#### Scenario: Design authentication method selector

**Given** Dexter is designing the auth method selection UI
**When** they create the selector component
**Then** it shows all 5 auth methods clearly:
  - Each method has an icon (email, magic link, Google logo, Apple logo, fingerprint)
  - Each method has a label (e.g., "Continue with Email", "Continue with Google")
  - Methods are visually distinct but equal in hierarchy
  - On mobile: methods stack vertically, full-width buttons
  - On desktop: methods can be in a grid (2 columns) or stacked
**And** the design is accessible:
  - Sufficient tap target size (min 44x44px)
  - Clear focus indicators
  - High contrast between button and background

#### Scenario: Design password strength indicator

**Given** Dexter is designing the password strength feedback
**When** they create the indicator component
**Then** it includes:
  - A visual meter (progress bar or segmented bar)
  - Color coding: red (Weak) → yellow (Fair) → green (Good) → teal (Strong)
  - Strength label (Weak, Fair, Good, Strong)
  - Requirements checklist below (with checkmarks as requirements are met)
**And** the indicator updates in real-time as the user types
**And** the design is encouraging, not punitive
**And** the color coding is accessible (uses icons or patterns in addition to color)

### Requirement: Design for Delight

Authentication MUST feel delightful, not like a chore, using micro-interactions and animations to create memorable moments.

#### Scenario: Design celebration moment for email verification

**Given** Dexter is designing the email verification success screen
**When** they create the success state
**Then** it includes:
  - A celebratory animation (confetti, checkmark with bounce, or similar)
  - A warm headline: "Welcome to the PetForce family!"
  - A friendly message explaining next steps
  - A clear call-to-action button: "Let's get started"
**And** the animation is brief (1-2 seconds)
**And** the animation is accessible (respects prefers-reduced-motion)
**And** the overall feeling is joyful and welcoming

#### Scenario: Design micro-interactions for form inputs

**Given** Dexter is designing form input states
**When** they design input interactions
**Then** inputs have subtle animations:
  - Label slides up when input is focused (if using floating labels)
  - Border color transitions smoothly on focus/blur
  - Checkmarks appear with a scale animation when password requirements are met
  - Error messages fade in (not appear instantly)
  - Success messages fade in with a subtle slide
**And** all animations are fast (< 300ms)
**And** animations respect prefers-reduced-motion

## Quality Checklist

When implementing or modifying this capability, ensure:

- [ ] All authentication screens follow consistent design patterns
- [ ] Forms are clean, uncluttered, and easy to understand
- [ ] Color palette aligns with "pets are family" philosophy (warm, approachable)
- [ ] Typography is readable (minimum 16px for body text)
- [ ] Spacing is generous (not cramped)
- [ ] UI is responsive across all breakpoints
- [ ] Micro-interactions enhance the experience without being distracting
- [ ] Animations respect prefers-reduced-motion
- [ ] Error states are friendly and actionable
- [ ] Success states feel celebratory
- [ ] Design files are organized and documented
- [ ] Design system is updated with new auth patterns

## Notes

These modifications extend the UX Design capability to include authentication-specific patterns. These patterns should be documented in the design system and made available as reusable components for future features.
