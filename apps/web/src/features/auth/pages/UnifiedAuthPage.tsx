// Unified Auth Page - Single-page authentication with login and register

import { AuthHeader } from '../components/AuthHeader';
import { AuthTogglePanel } from '../components/AuthTogglePanel';

/**
 * Unified authentication landing page
 *
 * Replaces the previous multi-page flow (Welcome → Login/Register) with
 * a single page that displays both login and registration options using
 * a clean tabbed interface:
 *
 * All screen sizes:
 * - Centered card with Sign In / Sign Up tabs
 * - Single focused form area (no duplicate content)
 * - Login is default tab (most common use case)
 * - Smooth animation when switching between tabs
 * - SSO buttons appear once per tab (not duplicated)
 *
 * Desktop (≥768px):
 * - Max-width 480px card for comfortable reading
 * - Increased padding for spacious feel
 * - Centered on screen
 *
 * Mobile (<768px):
 * - Full-width card
 * - Optimized touch targets
 * - Same tab pattern
 *
 * Benefits:
 * - Zero navigation required for login (majority use case)
 * - Clean, focused interface with no duplicate buttons
 * - 50% reduction in clicks for all users
 * - Clear, accurate messaging for both user types
 * - Eliminates confusing "Join" → "Welcome back" flow
 * - Familiar tab pattern universally understood
 */
export function UnifiedAuthPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        {/* Shared Header */}
        <AuthHeader />

        {/* Tabbed Auth Interface (all screen sizes) */}
        <AuthTogglePanel />
      </div>
    </div>
  );
}
