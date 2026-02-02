/**
 * Pending Request Card Component
 *
 * Card for displaying and managing join requests.
 *
 * Features:
 * - Requester email and avatar
 * - Requested time (relative)
 * - Approve (green) and Reject (red) buttons
 * - Loading state when processing
 * - Optimistic UI updates
 */

import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import type { HouseholdJoinRequest } from '@petforce/auth';

export interface PendingRequestCardProps {
  request: HouseholdJoinRequest;
  onApprove: (requestId: string) => void;
  onReject: (requestId: string) => void;
  isProcessing?: boolean;
  testID?: string;
}

/**
 * Get initials from email for avatar
 */
function getInitials(email: string): string {
  const parts = email.split('@')[0].split(/[._-]/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

/**
 * Format request time as relative time
 */
function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;

  return date.toLocaleDateString();
}

export function PendingRequestCard({
  request,
  onApprove,
  onReject,
  isProcessing = false,
  testID,
}: PendingRequestCardProps) {
  return (
    <View style={styles.container} testID={testID}>
      {/* Header with Avatar and Info */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {getInitials(request.requesterEmail || 'User')}
          </Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.email} numberOfLines={1}>
            {request.requesterEmail}
          </Text>
          <Text style={styles.time}>Requested {getRelativeTime(request.requestedAt)}</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.rejectButton]}
          onPress={() => onReject(request.id)}
          disabled={isProcessing}
          testID={`${testID}-reject`}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color="#EF4444" />
          ) : (
            <Text style={styles.rejectButtonText}>Reject</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.approveButton]}
          onPress={() => onApprove(request.id)}
          disabled={isProcessing}
          testID={`${testID}-approve`}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.approveButtonText}>Approve</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#D1FAE5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    backgroundColor: '#10B981',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  info: {
    flex: 1,
  },
  email: {
    fontSize: 15,
    fontWeight: '600',
    color: '#065F46',
    marginBottom: 2,
  },
  time: {
    fontSize: 13,
    color: '#047857',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  rejectButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  rejectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  approveButton: {
    backgroundColor: '#10B981',
  },
  approveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
