/**
 * Member List Component
 *
 * Displays list of household members with their roles and join dates.
 * Leaders can remove members (except themselves).
 *
 * Features:
 * - Member avatars with initials
 * - Role badges (Leader/Member)
 * - Join date display
 * - Remove member action (leader only, not self)
 * - Confirmation dialog before removal
 * - Empty state when no members
 * - Responsive grid layout
 *
 * Design:
 * - Clean list/grid of member cards
 * - Visual distinction for leader
 * - Hover states for interactive elements
 * - Confirmation before destructive actions
 */

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useHouseholdStore, selectIsLeader } from '@petforce/auth';
import { useAuthStore } from '@petforce/auth';
import type { HouseholdMember } from '@petforce/auth';
import { motion, AnimatePresence } from 'framer-motion';

export interface MemberListProps {
  /** Optional className for styling */
  className?: string;
}

/**
 * Component to display and manage household members
 *
 * @example
 * ```tsx
 * <MemberList />
 * ```
 */
export function MemberList({ className = '' }: MemberListProps) {
  const { user } = useAuthStore();
  const { household, members, removeMember, loading } = useHouseholdStore();
  const isLeader = useHouseholdStore(selectIsLeader);

  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  /**
   * Get initials from email for avatar
   */
  const getInitials = (email: string): string => {
    const parts = email.split('@')[0].split(/[._-]/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return email.slice(0, 2).toUpperCase();
  };

  /**
   * Format join date
   */
  const formatJoinDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Joined today';
    if (diffInDays === 1) return 'Joined yesterday';
    if (diffInDays < 7) return `Joined ${diffInDays} days ago`;
    if (diffInDays < 30) return `Joined ${Math.floor(diffInDays / 7)} weeks ago`;
    return `Joined ${date.toLocaleDateString()}`;
  };

  /**
   * Handle remove member click
   */
  const handleRemoveClick = (memberId: string) => {
    setConfirmRemove(memberId);
  };

  /**
   * Confirm and execute member removal
   */
  const handleConfirmRemove = async (memberId: string) => {
    if (!household?.id || !user?.id) return;

    setRemovingMemberId(memberId);
    await removeMember(household.id, memberId, user.id);
    setRemovingMemberId(null);
    setConfirmRemove(null);
  };

  /**
   * Cancel removal
   */
  const handleCancelRemove = () => {
    setConfirmRemove(null);
  };

  if (members.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        </div>
        <p className="text-gray-600">No members yet</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Confirmation Dialog */}
      <AnimatePresence>
        {confirmRemove && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={handleCancelRemove}
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
                      Remove Member?
                    </h3>
                    <p className="text-sm text-gray-600">This action cannot be undone</p>
                  </div>
                </div>

                <p className="text-gray-700">
                  Are you sure you want to remove this member from your household? They will lose
                  access to all household pets and data.
                </p>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={handleCancelRemove}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => handleConfirmRemove(confirmRemove)}
                    isLoading={removingMemberId === confirmRemove}
                    className="flex-1 bg-red-600 hover:bg-red-700 focus:ring-red-500"
                  >
                    Remove Member
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Member Cards */}
      <div className="space-y-3">
        {members.map((member) => {
          const isCurrentUser = member.userId === user?.id;
          const canRemove = isLeader && !isCurrentUser;

          return (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
            >
              {/* Avatar */}
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                  member.role === 'leader'
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                <span className="font-bold">
                  {getInitials(member.userEmail || 'User')}
                </span>
              </div>

              {/* Member Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-gray-900 truncate">
                    {member.userEmail}
                    {isCurrentUser && (
                      <span className="text-sm text-gray-500 ml-2">(You)</span>
                    )}
                  </p>
                  <span
                    className={`px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0 ${
                      member.role === 'leader'
                        ? 'bg-primary-100 text-primary-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {member.role === 'leader' ? 'Leader' : 'Member'}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  {formatJoinDate(member.joinedAt)}
                </p>
              </div>

              {/* Actions */}
              {canRemove && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemoveClick(member.id)}
                  disabled={loading}
                  className="flex-shrink-0 text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400"
                >
                  Remove
                </Button>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
