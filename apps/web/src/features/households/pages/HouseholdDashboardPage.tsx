/**
 * Household Dashboard Page
 *
 * Main household view showing:
 * - Household info (name, description, invite code for leaders)
 * - Member list
 * - Pending join requests (leader only)
 * - Quick actions (invite members, manage settings)
 *
 * Route: /dashboard/household
 *
 * This is the central hub for household management and collaboration.
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useHouseholdStore, selectIsLeader, selectPendingRequestCount } from '@petforce/auth';
import { useAuthStore } from '@petforce/auth';
import { motion } from 'framer-motion';

export default function HouseholdDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    household,
    members,
    pendingRequests,
    userRole,
    memberCount,
    loading,
    error,
    fetchHousehold,
  } = useHouseholdStore();

  const isLeader = useHouseholdStore(selectIsLeader);
  const pendingCount = useHouseholdStore(selectPendingRequestCount);

  // Fetch household data on mount
  useEffect(() => {
    if (user?.id) {
      fetchHousehold(user.id);
    }
  }, [user?.id, fetchHousehold]);

  // If no household, redirect to onboarding
  useEffect(() => {
    if (!loading && !household && !error) {
      navigate('/onboarding/household');
    }
  }, [loading, household, error, navigate]);

  if (loading && !household) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 p-4">
        <div className="max-w-6xl mx-auto py-8">
          <div className="text-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading your household...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 p-4">
        <div className="max-w-6xl mx-auto py-8">
          <Card padding="lg">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 font-heading mb-2">
                  Error Loading Household
                </h2>
                <p className="text-gray-600">{error.message}</p>
              </div>
              <Button variant="primary" onClick={() => navigate('/onboarding/household')}>
                Go to Household Onboarding
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (!household) {
    return null; // Will redirect to onboarding
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 p-4">
      <div className="max-w-6xl mx-auto py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {/* Header */}
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center">
                <span className="text-2xl">🏠</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 font-heading">
                  {household.name}
                </h1>
                <p className="text-gray-600">
                  {memberCount} {memberCount === 1 ? 'member' : 'members'} • You are a{' '}
                  {userRole === 'leader' ? 'Leader' : 'Member'}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => navigate('/dashboard')}>
                Back to Dashboard
              </Button>
              {isLeader && (
                <Button variant="primary" onClick={() => navigate('/household/settings')}>
                  Manage Household
                </Button>
              )}
            </div>
          </header>

          {/* Household Info Card */}
          <Card padding="lg">
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900 font-heading">
                Household Information
              </h2>

              {household.description && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Description</p>
                  <p className="text-gray-600">{household.description}</p>
                </div>
              )}

              {/* Invite Code (Leader only) */}
              {isLeader && household.inviteCode && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Invite Code</p>
                  <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <code className="text-2xl font-mono font-bold text-primary-700">
                          {household.inviteCode}
                        </code>
                        {household.inviteCodeExpiresAt && (
                          <p className="text-sm text-gray-600 mt-1">
                            Expires:{' '}
                            {new Date(household.inviteCodeExpiresAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(household.inviteCode!);
                        }}
                      >
                        Copy Code
                      </Button>
                    </div>
                    <p className="text-sm text-gray-600 mt-3">
                      Share this code with family members to invite them to your household
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Pending Requests (Leader only) */}
          {isLeader && pendingCount > 0 && (
            <Card padding="lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 font-heading">
                  Pending Join Requests
                  <span className="ml-2 px-2 py-1 bg-primary-100 text-primary-700 text-sm rounded-full">
                    {pendingCount}
                  </span>
                </h2>
              </div>
              <p className="text-gray-600 mb-4">
                Review and approve or reject requests from people who want to join your household
              </p>
              {/* Pending requests component will go here (Task 4.6) */}
              <div className="text-center py-6 bg-gray-50 rounded-lg">
                <p className="text-gray-500">
                  Pending requests component coming in Task 4.6
                </p>
              </div>
            </Card>
          )}

          {/* Members List */}
          <Card padding="lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 font-heading">
                Household Members
                <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                  {memberCount}
                </span>
              </h2>
            </div>
            {/* Member list component will go here (Task 4.5) */}
            <div className="text-center py-6 bg-gray-50 rounded-lg">
              <p className="text-gray-500">
                Member list component coming in Task 4.5
              </p>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card padding="lg">
            <h2 className="text-xl font-bold text-gray-900 font-heading mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Add Pet (placeholder) */}
              <button className="flex items-center gap-3 p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-primary-400 hover:bg-primary-50 transition-colors">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-xl">🐾</span>
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">Add Pet</p>
                  <p className="text-sm text-gray-600">Coming soon</p>
                </div>
              </button>

              {/* Care Tasks (placeholder) */}
              <button className="flex items-center gap-3 p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-secondary-400 hover:bg-secondary-50 transition-colors">
                <div className="w-10 h-10 bg-secondary-100 rounded-full flex items-center justify-center">
                  <span className="text-xl">✓</span>
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">Care Tasks</p>
                  <p className="text-sm text-gray-600">Coming soon</p>
                </div>
              </button>

              {/* Settings (leader only) */}
              {isLeader && (
                <button
                  onClick={() => navigate('/household/settings')}
                  className="flex items-center gap-3 p-4 rounded-lg border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Household Settings</p>
                    <p className="text-sm text-gray-600">Manage household</p>
                  </div>
                </button>
              )}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
