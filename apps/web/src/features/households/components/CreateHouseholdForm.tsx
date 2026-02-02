/**
 * Create Household Form Component
 *
 * Form for creating a new household with name and optional description.
 * User becomes the household leader upon creation.
 *
 * Features:
 * - Name input (required, max 100 chars)
 * - Description input (optional, max 500 chars, textarea)
 * - Character count display
 * - Loading state during creation
 * - Error handling with clear messages
 * - Success callback for navigation
 *
 * Design:
 * - Follows existing form patterns from EmailPasswordForm
 * - Uses Input and Button UI components
 * - Animated error states with framer-motion
 * - Clean, accessible markup
 */

import { FormEvent, useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useHouseholdStore } from '@petforce/auth';
import { useAuthStore } from '@petforce/auth';
import { motion, AnimatePresence } from 'framer-motion';

export interface CreateHouseholdFormProps {
  /** Callback when household is successfully created */
  onSuccess?: () => void;
  /** Callback to cancel/go back */
  onCancel?: () => void;
}

/**
 * Form for creating a new household
 *
 * @example
 * ```tsx
 * <CreateHouseholdForm
 *   onSuccess={() => navigate('/dashboard')}
 *   onCancel={() => navigate('/onboarding/household')}
 * />
 * ```
 */
export function CreateHouseholdForm({ onSuccess, onCancel }: CreateHouseholdFormProps) {
  const { user } = useAuthStore();
  const { createHousehold, loading, error, clearError } = useHouseholdStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const MAX_NAME_LENGTH = 100;
  const MAX_DESCRIPTION_LENGTH = 500;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    clearError();

    // Validation
    if (!name.trim()) {
      setValidationError('Household name is required');
      return;
    }

    if (name.length > MAX_NAME_LENGTH) {
      setValidationError(`Household name must be ${MAX_NAME_LENGTH} characters or less`);
      return;
    }

    if (description.length > MAX_DESCRIPTION_LENGTH) {
      setValidationError(`Description must be ${MAX_DESCRIPTION_LENGTH} characters or less`);
      return;
    }

    if (!user?.id) {
      setValidationError('You must be logged in to create a household');
      return;
    }

    // Create household
    await createHousehold(user.id, name.trim(), description.trim() || undefined);

    // Check if creation was successful (no error in store)
    const currentError = useHouseholdStore.getState().error;
    if (!currentError) {
      onSuccess?.();
    }
  };

  const displayError = validationError || error?.message;

  return (
    <form onSubmit={handleSubmit} className="space-y-6" aria-label="Create household form">
      {/* Form Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-gray-900 font-heading" id="form-title">
          Create Your Household
        </h2>
        <p className="text-gray-600" id="form-description">
          Give your household a name and description. You'll become the household leader and can
          invite family members to join.
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
              <p className="text-sm text-red-800 font-medium">Error Creating Household</p>
              <p className="text-sm text-red-700 mt-1">{displayError}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Household Name */}
      <div>
        <Input
          label="Household Name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., The Zeder House, Smith Family Pets"
          required
          maxLength={MAX_NAME_LENGTH}
          disabled={loading}
          aria-describedby="name-helper"
        />
        <div className="flex justify-between items-center mt-1.5">
          <p id="name-helper" className="text-sm text-gray-500">
            Choose a name that identifies your household
          </p>
          <span className="text-xs text-gray-400">
            {name.length}/{MAX_NAME_LENGTH}
          </span>
        </div>
      </div>

      {/* Description (Optional) */}
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700 mb-1.5"
        >
          Description <span className="text-gray-400">(Optional)</span>
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g., Our family home with 2 dogs, 3 cats, and 1 bird"
          rows={4}
          maxLength={MAX_DESCRIPTION_LENGTH}
          disabled={loading}
          className={`
            w-full px-4 py-2.5 rounded-lg border
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-offset-1
            disabled:bg-gray-100 disabled:cursor-not-allowed
            border-gray-300 focus:border-primary-500 focus:ring-primary-200
            resize-none
          `}
          aria-describedby="description-helper"
        />
        <div className="flex justify-between items-center mt-1.5">
          <p id="description-helper" className="text-sm text-gray-500">
            Optional details about your household and pets
          </p>
          <span className="text-xs text-gray-400">
            {description.length}/{MAX_DESCRIPTION_LENGTH}
          </span>
        </div>
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
            <p className="text-sm text-primary-900 font-medium">What happens next?</p>
            <ul className="text-sm text-primary-800 space-y-1">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>You'll become the household leader</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>You can invite family members using an invite code</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>You'll manage member permissions and household settings</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Everyone can track pet care tasks together</span>
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
            aria-label="Cancel household creation"
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={loading}
          disabled={loading || !name.trim()}
          className="w-full sm:flex-1"
          aria-label={loading ? 'Creating household, please wait' : 'Create household'}
          aria-describedby="form-title form-description"
        >
          {loading ? 'Creating Household...' : 'Create Household'}
        </Button>
      </div>
    </form>
  );
}
