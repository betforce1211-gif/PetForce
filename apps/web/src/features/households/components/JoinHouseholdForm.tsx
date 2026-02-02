/**
 * Join Household Form Component
 *
 * Form for joining an existing household using an invite code.
 * User sends a join request that must be approved by the household leader.
 *
 * Features:
 * - Invite code input (format: XXXXX-XXXXX)
 * - Auto-formatting as user types
 * - Validation of invite code format
 * - Loading state during request submission
 * - Error handling for invalid/expired codes
 * - Success state showing "request pending approval"
 * - Info about approval process
 *
 * Design:
 * - Follows existing form patterns
 * - Clean, focused UI (single main input)
 * - Clear feedback about next steps after submission
 */

import { FormEvent, useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useHouseholdStore } from '@petforce/auth';
import { useAuthStore } from '@petforce/auth';
import { motion, AnimatePresence } from 'framer-motion';

export interface JoinHouseholdFormProps {
  /** Callback when join request is successfully submitted */
  onSuccess?: () => void;
  /** Callback to cancel/go back */
  onCancel?: () => void;
}

/**
 * Form for joining an existing household with an invite code
 *
 * @example
 * ```tsx
 * <JoinHouseholdForm
 *   onSuccess={() => navigate('/dashboard')}
 *   onCancel={() => navigate('/onboarding/household')}
 * />
 * ```
 */
export function JoinHouseholdForm({ onSuccess, onCancel }: JoinHouseholdFormProps) {
  const { user } = useAuthStore();
  const { joinHousehold, loading, error, clearError } = useHouseholdStore();

  const [inviteCode, setInviteCode] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [requestSent, setRequestSent] = useState(false);

  const INVITE_CODE_FORMAT = /^[A-Z0-9]{5}-[A-Z0-9]{5}$/;

  /**
   * Format invite code as user types: XXXXX-XXXXX
   */
  const formatInviteCode = (value: string): string => {
    // Remove all non-alphanumeric characters and convert to uppercase
    const cleaned = value.replace(/[^A-Z0-9]/gi, '').toUpperCase();

    // Add hyphen after 5th character
    if (cleaned.length <= 5) {
      return cleaned;
    }

    return `${cleaned.slice(0, 5)}-${cleaned.slice(5, 10)}`;
  };

  const handleInviteCodeChange = (value: string) => {
    const formatted = formatInviteCode(value);
    setInviteCode(formatted);
    setValidationError(null);
    clearError();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    clearError();
    setRequestSent(false);

    // Validation
    if (!inviteCode.trim()) {
      setValidationError('Invite code is required');
      return;
    }

    if (!INVITE_CODE_FORMAT.test(inviteCode)) {
      setValidationError('Invalid invite code format. Expected format: XXXXX-XXXXX');
      return;
    }

    if (!user?.id) {
      setValidationError('You must be logged in to join a household');
      return;
    }

    // Send join request
    await joinHousehold(user.id, inviteCode);

    // Check if request was successful (no error in store)
    const currentError = useHouseholdStore.getState().error;
    if (!currentError) {
      setRequestSent(true);
      // Call success callback after short delay to show success message
      setTimeout(() => {
        onSuccess?.();
      }, 2000);
    }
  };

  const displayError = validationError || error?.message;

  // Success state - request sent
  if (requestSent) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-6"
      >
        {/* Success Icon */}
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <svg
              className="w-10 h-10 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900 font-heading mb-2">
              Request Sent!
            </h3>
            <p className="text-gray-600">
              Your request to join the household has been sent to the household leader for approval.
            </p>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="space-y-2">
              <p className="text-sm text-blue-900 font-medium">What happens next?</p>
              <ul className="text-sm text-blue-800 space-y-1">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>The household leader will review your request</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>You'll be notified when they approve or reject it</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Once approved, you can start tracking pet care with your family</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <Button
          variant="primary"
          size="lg"
          onClick={onSuccess}
          className="w-full"
        >
          Go to Dashboard
        </Button>
      </motion.div>
    );
  }

  // Form state - entering invite code
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Form Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-gray-900 font-heading">
          Join a Household
        </h2>
        <p className="text-gray-600">
          Enter the invite code provided by your household leader to send a join request.
        </p>
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {displayError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3"
            role="alert"
          >
            <svg
              className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div className="flex-1">
              <p className="text-sm text-red-800 font-medium">Error Joining Household</p>
              <p className="text-sm text-red-700 mt-1">{displayError}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Invite Code Input */}
      <div>
        <Input
          label="Invite Code"
          type="text"
          value={inviteCode}
          onChange={(e) => handleInviteCodeChange(e.target.value)}
          placeholder="XXXXX-XXXXX"
          required
          maxLength={11} // 5 + hyphen + 5
          disabled={loading}
          className="text-center text-lg tracking-wider font-mono"
          aria-describedby="invite-code-helper"
        />
        <p id="invite-code-helper" className="text-sm text-gray-500 mt-1.5">
          Ask your household leader for the invite code
        </p>
      </div>

      {/* Info Box */}
      <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg
            className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="space-y-2">
            <p className="text-sm text-primary-900 font-medium">About joining households</p>
            <ul className="text-sm text-primary-800 space-y-1">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Invite codes are valid for 7 days by default</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>The household leader must approve your request</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>You can only be part of one household at a time</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>You can leave a household at any time</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col-reverse sm:flex-row gap-3">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={onCancel}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={loading}
          disabled={loading || !inviteCode.trim()}
          className="w-full sm:flex-1"
        >
          {loading ? 'Sending Request...' : 'Send Join Request'}
        </Button>
      </div>
    </form>
  );
}
