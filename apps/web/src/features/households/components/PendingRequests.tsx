/**
 * Pending Requests Component
 *
 * Displays pending join requests for household leaders to approve or reject.
 * Only visible to household leaders.
 *
 * Features:
 * - List of pending join requests with user info
 * - Request date display
 * - Approve/Reject actions
 * - Loading states during approval/rejection
 * - Empty state when no pending requests
 * - Success feedback after actions
 *
 * Design:
 * - Clean list of request cards
 * - Clear approve (green) and reject (red) actions
 * - Shows requester email and request date
 * - Responsive layout
 */

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useHouseholdStore } from '@petforce/auth';
import { useAuthStore } from '@petforce/auth';
import type { HouseholdJoinRequest } from '@petforce/auth';
import { motion } from 'framer-motion';

export interface PendingRequestsProps {
  /** Optional className for styling */
  className?: string;
}

/**
 * Component to display and manage pending join requests (leader only)
 *
 * @example
 * ```tsx
 * <PendingRequests />
 * ```
 */
export function PendingRequests({ className = '' }: PendingRequestsProps) {
  const { user } = useAuthStore();
  const { pendingRequests, approveRequest, rejectRequest, loading } = useHouseholdStore();

  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);

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
   * Format request date
   */
  const formatRequestDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours === 1) return '1 hour ago';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInHours < 48) return 'Yesterday';

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} days ago`;

    return date.toLocaleDateString();
  };

  /**
   * Handle approve request
   */
  const handleApprove = async (requestId: string) => {
    if (!user?.id) return;

    setProcessingRequestId(requestId);
    setActionType('approve');
    await approveRequest(requestId, user.id);
    setProcessingRequestId(null);
    setActionType(null);
  };

  /**
   * Handle reject request
   */
  const handleReject = async (requestId: string) => {
    if (!user?.id) return;

    setProcessingRequestId(requestId);
    setActionType('reject');
    await rejectRequest(requestId, user.id);
    setProcessingRequestId(null);
    setActionType(null);
  };

  if (pendingRequests.length === 0) {
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
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <p className="text-gray-600">No pending requests</p>
        <p className="text-sm text-gray-500 mt-1">
          Requests from people trying to join will appear here
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="space-y-3">
        {pendingRequests.map((request) => {
          const isProcessing = processingRequestId === request.id;
          const isApproving = isProcessing && actionType === 'approve';
          const isRejecting = isProcessing && actionType === 'reject';

          return (
            <motion.div
              key={request.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-4 p-4 rounded-lg border-2 border-primary-200 bg-primary-50"
            >
              {/* Avatar */}
              <div className="w-12 h-12 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center flex-shrink-0">
                <span className="font-bold">
                  {getInitials(request.requesterEmail || 'User')}
                </span>
              </div>

              {/* Request Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {request.requesterEmail}
                </p>
                <p className="text-sm text-gray-600">
                  Requested {formatRequestDate(request.requestedAt)}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleReject(request.id)}
                  disabled={isProcessing || loading}
                  isLoading={isRejecting}
                  className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400"
                >
                  {isRejecting ? 'Rejecting...' : 'Reject'}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleApprove(request.id)}
                  disabled={isProcessing || loading}
                  isLoading={isApproving}
                  className="bg-green-600 hover:bg-green-700 focus:ring-green-500"
                >
                  {isApproving ? 'Approving...' : 'Approve'}
                </Button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Info Message */}
      {pendingRequests.length > 0 && (
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
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
            <p className="text-sm text-blue-800">
              Review each request carefully. Approved members will have access to all household
              pets and care tasks.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
