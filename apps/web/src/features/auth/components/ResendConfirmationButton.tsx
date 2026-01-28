// Resend Confirmation Email Button Component

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { resendConfirmationEmail } from '@petforce/auth';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Props for the ResendConfirmationButton component
 */
export interface ResendConfirmationButtonProps {
  /** Email address to resend confirmation to */
  email: string;
  /** Button visual variant */
  variant?: 'primary' | 'secondary' | 'outline';
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Additional CSS classes */
  className?: string;
}

/**
 * Button to resend email confirmation with rate limiting
 *
 * Features:
 * - Sends verification email to the specified email address
 * - Client-side rate limiting (5-minute cooldown)
 * - Countdown timer display when on cooldown
 * - Success/error message display with animations
 * - Loading state during API call
 * - Automatic success message dismissal after 5 seconds
 *
 * Rate Limiting:
 * - Client: 1 resend per 5 minutes
 * - Server: 3 requests per 15 minutes per email
 *
 * @example
 * ```tsx
 * // Basic usage
 * <ResendConfirmationButton email="user@example.com" />
 *
 * // Custom styling
 * <ResendConfirmationButton
 *   email={email}
 *   variant="primary"
 *   size="lg"
 *   className="mt-4"
 * />
 *
 * // In error context
 * {error?.code === 'EMAIL_NOT_CONFIRMED' && (
 *   <ResendConfirmationButton email={email} variant="outline" size="sm" />
 * )}
 * ```
 */
export function ResendConfirmationButton({
  email,
  variant = 'outline',
  size = 'md',
  className,
}: ResendConfirmationButtonProps) {
  const [isResending, setIsResending] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canResend, setCanResend] = useState(true);
  const [countdown, setCountdown] = useState(0);

  // Countdown timer for rate limiting
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && !canResend) {
      setCanResend(true);
    }
  }, [countdown, canResend]);

  const handleResend = async () => {
    if (!canResend || isResending) return;

    setIsResending(true);
    setError(null);
    setShowSuccess(false);

    try {
      const result = await resendConfirmationEmail(email);

      if (result.success) {
        setShowSuccess(true);
        setCanResend(false);
        setCountdown(300); // 5 minutes cooldown

        // Hide success message after 5 seconds
        setTimeout(() => setShowSuccess(false), 5000);
      } else if (result.error) {
        setError(result.error.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend email');
    } finally {
      setIsResending(false);
    }
  };

  const formatCountdown = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={className}>
      <Button
        variant={variant}
        size={size}
        onClick={handleResend}
        isLoading={isResending}
        disabled={!canResend || isResending}
        className="w-full"
      >
        {!canResend && countdown > 0
          ? `Resend in ${formatCountdown(countdown)}`
          : 'Resend verification email'}
      </Button>

      {/* Success message */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-start gap-2"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>
              <strong>Email sent!</strong> Check your inbox. It should arrive within 1-2 minutes.
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
