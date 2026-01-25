# Dexter Design Agent - Quick Start Guide

Set up a complete design system in 10 minutes.

## Prerequisites

- React/Vue/Svelte project
- Tailwind CSS (recommended) or CSS-in-JS
- TypeScript (recommended)

---

## Step 1: Install Dependencies

```bash
# Class variance authority for component variants
npm install class-variance-authority

# Utility for merging class names
npm install clsx tailwind-merge

# Optional: Icons
npm install lucide-react
```

Create the utility function:

```typescript
// src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

---

## Step 2: Set Up Design Tokens

### Copy the tokens template:

```bash
mkdir -p src/design-system
cp dexter-design-agent/templates/design-tokens.ts.template \
   src/design-system/tokens.ts
```

### Customize for your brand:

```typescript
// src/design-system/tokens.ts

// Update primary color to your brand
const primitives = {
  colors: {
    blue: {
      // Replace with your brand colors
      500: '#YOUR_BRAND_COLOR',
      600: '#YOUR_BRAND_DARKER',
      // ...
    },
  },
  // ...
};
```

---

## Step 3: Configure Tailwind

```javascript
// tailwind.config.js
const tokens = require('./src/design-system/tokens');

module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: tokens.primitives.colors.blue,
        gray: tokens.primitives.colors.gray,
        success: tokens.primitives.colors.green,
        warning: tokens.primitives.colors.amber,
        error: tokens.primitives.colors.red,
      },
      spacing: tokens.primitives.spacing,
      borderRadius: tokens.primitives.borderRadius,
      boxShadow: tokens.primitives.boxShadow,
      fontFamily: {
        sans: tokens.primitives.fontFamily.sans,
        mono: tokens.primitives.fontFamily.mono,
      },
    },
  },
  plugins: [],
};
```

---

## Step 4: Add Your First Component

### Copy the Button template:

```bash
cp dexter-design-agent/templates/Button.tsx.template \
   src/design-system/Button.tsx
```

### Use it in your app:

```tsx
import { Button } from '@/design-system/Button';

function MyComponent() {
  return (
    <div className="space-y-4">
      {/* Primary button */}
      <Button>Save Changes</Button>
      
      {/* Secondary button */}
      <Button variant="secondary">Cancel</Button>
      
      {/* With icon */}
      <Button leftIcon={<PlusIcon />}>Add Item</Button>
      
      {/* Loading state */}
      <Button loading>Saving...</Button>
      
      {/* Destructive */}
      <Button variant="destructive">Delete</Button>
    </div>
  );
}
```

---

## Step 5: Create More Components

### Input Component

```tsx
// src/design-system/Input.tsx
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s/g, '-');
    
    return (
      <div className="space-y-1.5">
        {label && (
          <label 
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700"
          >
            {label}
          </label>
        )}
        
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'block w-full h-11 px-4 rounded-md border',
            'text-gray-900 placeholder:text-gray-400',
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            error
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500',
            'disabled:bg-gray-100 disabled:cursor-not-allowed',
            className
          )}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={
            error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
          }
          {...props}
        />
        
        {error && (
          <p id={`${inputId}-error`} className="text-sm text-red-600">
            {error}
          </p>
        )}
        
        {hint && !error && (
          <p id={`${inputId}-hint`} className="text-sm text-gray-500">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
```

### Card Component

```tsx
// src/design-system/Card.tsx
import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'compact' | 'default' | 'spacious';
  hoverable?: boolean;
}

function Card({ 
  children, 
  className,
  padding = 'default',
  hoverable = false,
}: CardProps) {
  const paddingClasses = {
    compact: 'p-4',
    default: 'p-6',
    spacious: 'p-8',
  };
  
  return (
    <div
      className={cn(
        'bg-white rounded-lg border border-gray-200 shadow-sm',
        paddingClasses[padding],
        hoverable && 'transition-shadow hover:shadow-md',
        className
      )}
    >
      {children}
    </div>
  );
}

function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('mb-4', className)}>
      {children}
    </div>
  );
}

function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={cn('text-lg font-semibold text-gray-900', className)}>
      {children}
    </h3>
  );
}

function CardDescription({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn('text-sm text-gray-500 mt-1', className)}>
      {children}
    </p>
  );
}

function CardContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn(className)}>
      {children}
    </div>
  );
}

function CardFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('mt-4 pt-4 border-t border-gray-100 flex justify-end gap-3', className)}>
      {children}
    </div>
  );
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
```

---

## Step 6: Create an Index File

```typescript
// src/design-system/index.ts

// Tokens
export * from './tokens';

// Components
export * from './Button';
export * from './Input';
export * from './Card';

// Add more components as you build them
```

---

## Step 7: Use Your Design System

```tsx
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  tokens,
} from '@/design-system';

function LoginForm() {
  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>
          Sign in to your account to continue
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
        />
        
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
        />
      </CardContent>
      
      <CardFooter>
        <Button variant="tertiary">Forgot password?</Button>
        <Button>Sign in</Button>
      </CardFooter>
    </Card>
  );
}
```

---

## Component State Checklist

For every component, ensure you have:

- [ ] **Default** - Normal resting state
- [ ] **Hover** - Mouse over (desktop)
- [ ] **Focus** - Keyboard focus (with visible ring)
- [ ] **Active** - Being clicked/pressed
- [ ] **Disabled** - Cannot be interacted with
- [ ] **Loading** - Async operation in progress
- [ ] **Error** - Invalid state (for inputs)

---

## Accessibility Checklist

- [ ] Color contrast ≥ 4.5:1 for text
- [ ] Touch targets ≥ 44px
- [ ] Focus indicators visible
- [ ] All interactive elements keyboard accessible
- [ ] ARIA labels where needed
- [ ] Error messages linked to inputs

---

## Responsive Design Tips

```tsx
// Mobile-first approach
<div className="
  p-4          /* Mobile: 16px padding */
  md:p-6       /* Tablet: 24px padding */
  lg:p-8       /* Desktop: 32px padding */
">

// Stack on mobile, row on larger screens
<div className="
  flex flex-col    /* Mobile: vertical stack */
  md:flex-row      /* Tablet+: horizontal row */
  gap-4
">

// Hide on mobile, show on desktop
<nav className="
  hidden           /* Mobile: hidden */
  lg:flex          /* Desktop: visible */
">
```

---

## Next Steps

1. 📖 Read the full [DEXTER.md](./DEXTER.md) documentation
2. 🎨 Add more components (Modal, Select, Toast, etc.)
3. 🌙 Implement dark mode
4. 📱 Test on all screen sizes
5. ♿ Run accessibility audit

---

## Troubleshooting

### Styles not applying?
- Check Tailwind content paths include your components
- Verify the `cn()` utility is set up correctly
- Make sure tokens are imported in tailwind.config.js

### Colors look wrong?
- Verify token values match your Tailwind config
- Check color contrast for accessibility
- Test in light and dark mode

### Touch targets too small?
- Minimum 44px for mobile
- Add padding to increase tap area
- Use `min-h-[44px] min-w-[44px]`

---

*Dexter: Design is not just what it looks like. Design is how it works.* 🎨
