// Password Strength Indicator - Visual feedback for password strength

import { useMemo } from 'react';
import { calculatePasswordStrength } from '@petforce/auth';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Props for the PasswordStrengthIndicator component
 */
export interface PasswordStrengthIndicatorProps {
  /** The password to evaluate for strength */
  password: string;
  /** Whether to show the detailed requirements checklist */
  showRequirements?: boolean;
}

/**
 * Visual password strength indicator with requirements checklist
 *
 * Displays:
 * - Animated strength meter bar (0-4 score, color-coded)
 * - Strength label (Weak, Fair, Good, Strong)
 * - Optional checklist showing only UNMET password requirements:
 *   - Minimum 8 characters
 *   - Contains uppercase letter
 *   - Contains lowercase letter
 *   - Contains number
 *
 * Features:
 * - Real-time password strength calculation
 * - Color-coded visual feedback
 * - Animated strength bar transitions
 * - Smart requirements display (only shows unmet requirements)
 * - Success state when all requirements met
 * - Hidden when password is empty
 * - Mobile-optimized vertical space usage
 *
 * Design Decision: Shows only unmet requirements to:
 * - Reduce visual clutter and vertical space (important for small viewports)
 * - Focus user attention on what still needs fixing
 * - Improve mobile UX by minimizing scrolling
 * - Maintain ARIA accessibility for screen readers
 *
 * @example
 * ```tsx
 * // Full indicator with requirements
 * <PasswordStrengthIndicator password={password} />
 *
 * // Only strength meter, no requirements
 * <PasswordStrengthIndicator password={password} showRequirements={false} />
 *
 * // In registration form
 * <Input
 *   type="password"
 *   value={password}
 *   onChange={(e) => setPassword(e.target.value)}
 * />
 * <PasswordStrengthIndicator password={password} />
 * ```
 */
export function PasswordStrengthIndicator({
  password,
  showRequirements = true,
}: PasswordStrengthIndicatorProps) {
  const strength = useMemo(() => calculatePasswordStrength(password), [password]);

  const requirements = useMemo(
    () => [
      { label: 'At least 8 characters', met: password.length >= 8 },
      { label: 'Contains uppercase letter', met: /[A-Z]/.test(password) },
      { label: 'Contains lowercase letter', met: /[a-z]/.test(password) },
      { label: 'Contains number', met: /[0-9]/.test(password) },
    ],
    [password]
  );

  if (!password) return null;

  const unmetRequirements = requirements.filter(req => !req.met);
  const allRequirementsMet = unmetRequirements.length === 0;

  return (
    <div className="mt-1 space-y-1">
      {/* Strength meter - Compact inline layout */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: strength.color }}
            initial={{ width: 0 }}
            animate={{ width: `${(strength.score / 4) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <span className="text-xs font-semibold whitespace-nowrap" style={{ color: strength.color }}>
          {strength.label}
        </span>
      </div>

      {/* Requirements checklist - Only show unmet requirements, compact inline display */}
      {showRequirements && (
        <AnimatePresence mode="wait">
          {allRequirementsMet ? (
            <motion.div
              key="all-met"
              className="flex items-center gap-1 text-xs text-green-700"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <div className="w-3 h-3 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-2 h-2 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <span className="font-medium">All requirements met</span>
            </motion.div>
          ) : (
            <motion.div
              key="unmet-list"
              className="text-xs text-gray-600"
              role="list"
              aria-label="Unmet password requirements"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <AnimatePresence>
                {unmetRequirements.map((req) => (
                  <motion.span
                    key={req.label}
                    className="inline-flex items-center gap-1 mr-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className="w-1 h-1 rounded-full bg-gray-400 flex-shrink-0" aria-hidden="true" />
                    <span>{req.label}</span>
                  </motion.span>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
