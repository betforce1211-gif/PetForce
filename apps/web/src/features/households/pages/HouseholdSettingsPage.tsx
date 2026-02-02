/**
 * Household Settings Page
 *
 * Settings page for household leaders to manage household configuration:
 * - Regenerate invite code
 * - View/manage household info
 * - Send email invites (future)
 * - Leave household or transfer leadership
 *
 * Route: /household/settings
 *
 * Leader-only page with destructive actions requiring confirmation.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  useHouseholdStore,
  selectIsLeader,
  selectCanManageMembers,
} from '@petforce/auth';
import { useAuthStore } from '@petforce/auth';
import { motion, AnimatePresence } from 'framer-motion';

export default function HouseholdSettingsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    household,
    loading,
    error,
    fetchHousehold,
    regenerateInviteCode,
    leaveHousehold,
  } = useHouseholdStore();

  const isLeader = useHouseholdStore(selectIsLeader);
  const canManageMembers = useHouseholdStore(selectCanManageMembers);

  const [copiedCode, setCopiedCode] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  // Fetch household data on mount
  useEffect(() => {
    if (user?.id) {
      fetchHousehold(user.id);
    }
  }, [user?.id, fetchHousehold]);

  // Redirect non-leaders
  useEffect(() => {
    if (!loading && !isLeader) {
      navigate('/dashboard/household');
    }
  }, [loading, isLeader, navigate]);

  /**
   * Handle regenerate invite code
   */
  const handleRegenerateCode = async () => {
    if (!household?.id || !user?.id) return;
    await regenerateInviteCode(household.id, user.id, 7); // 7 days expiration
  };

  /**
   * Handle copy invite code
   */
  const handleCopyCode = () => {
    if (!household?.inviteCode) return;
    navigator.clipboard.writeText(household.inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  /**
   * Handle leave household
   */
  const handleLeaveHousehold = async () => {
    if (!household?.id || !user?.id) return;
    await leaveHousehold(household.id, user.id);
    navigate('/onboarding/household');
  };

  if (loading && !household) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 p-4">
        <div className="max-w-4xl mx-auto py-8">
          <div className="text-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading settings...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!household || !isLeader) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 p-4">
      <div className="max-w-4xl mx-auto py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {/* Header */}
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 font-heading">
                Household Settings
              </h1>
              <p className="text-gray-600 mt-1">{household.name}</p>
            </div>
            <Button variant="outline" onClick={() => navigate('/dashboard/household')}>
              Back to Dashboard
            </Button>
          </header>

          {/* Error Display */}
          {error && (
            <Card padding="lg" className="bg-red-50 border-red-200">
              <div className="flex items-start gap-3">
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
                <div>
                  <p className="text-sm text-red-800 font-medium">Error</p>
                  <p className="text-sm text-red-700 mt-1">{error.message}</p>
                </div>
              </div>
            </Card>
          )}

          {/* Invite Code Management */}
          <Card padding="lg">
            <h2 className="text-xl font-bold text-gray-900 font-heading mb-4">
              Invite Code Management
            </h2>
            <p className="text-gray-600 mb-6">
              Share this code with family members to invite them to your household.
            </p>

            {household.inviteCode && (
              <div className="space-y-4">
                {/* Current Code Display */}
                <div className="bg-primary-50 border border-primary-200 rounded-lg p-6">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-center sm:text-left">
                      <p className="text-sm text-gray-600 mb-2">Current Invite Code</p>
                      <code className="text-3xl font-mono font-bold text-primary-700">
                        {household.inviteCode}
                      </code>
                      {household.inviteCodeExpiresAt && (
                        <p className="text-sm text-gray-600 mt-2">
                          Expires: {new Date(household.inviteCodeExpiresAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={handleCopyCode}
                        disabled={loading}
                      >
                        {copiedCode ? 'Copied!' : 'Copy Code'}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Regenerate Code */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm text-yellow-800 font-medium mb-1">
                        Need a new invite code?
                      </p>
                      <p className="text-sm text-yellow-700 mb-3">
                        Regenerating the code will invalidate the current one. Anyone with the old
                        code won't be able to join.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRegenerateCode}
                        isLoading={loading}
                        disabled={loading}
                      >
                        Regenerate Invite Code
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Email Invites (Future Feature) */}
          <Card padding="lg">
            <h2 className="text-xl font-bold text-gray-900 font-heading mb-4">
              Email Invites
            </h2>
            <p className="text-gray-600 mb-4">
              Send personalized email invitations directly to family members.
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
              <svg
                className="w-12 h-12 text-gray-400 mx-auto mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <p className="text-gray-600 font-medium">Email invites coming soon</p>
              <p className="text-sm text-gray-500 mt-1">
                This feature is currently in development
              </p>
            </div>
          </Card>

          {/* Danger Zone */}
          <Card padding="lg" className="border-red-200">
            <h2 className="text-xl font-bold text-red-900 font-heading mb-4">
              Danger Zone
            </h2>
            <div className="space-y-4">
              {/* Leave Household */}
              <div className="flex items-start justify-between gap-4 p-4 border border-red-200 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">Leave Household</h3>
                  <p className="text-sm text-gray-600">
                    As the household leader, leaving will require selecting a new leader from
                    existing members.
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowLeaveConfirm(true)}
                  className="flex-shrink-0 text-red-600 border-red-300 hover:bg-red-50"
                >
                  Leave
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Leave Confirmation Dialog */}
      <AnimatePresence>
        {showLeaveConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowLeaveConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 font-heading">
                      Leave Household?
                    </h3>
                    <p className="text-sm text-gray-600">This action cannot be undone</p>
                  </div>
                </div>

                <p className="text-gray-700">
                  Are you sure you want to leave this household? As the leader, you'll need to
                  select a successor or the household will be disbanded.
                </p>

                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                  <strong>Note:</strong> Successor selection and household disbanding features are
                  coming soon. For now, only members (not leaders) can leave households.
                </p>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowLeaveConfirm(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleLeaveHousehold}
                    isLoading={loading}
                    className="flex-1 bg-red-600 hover:bg-red-700 focus:ring-red-500"
                    disabled
                  >
                    Leave Household
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
