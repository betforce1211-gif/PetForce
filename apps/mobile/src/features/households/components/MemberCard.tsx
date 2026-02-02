/**
 * Member Card Component
 *
 * Reusable card component for displaying household members.
 *
 * Features:
 * - Avatar with initials
 * - Email address
 * - Role badge (Leader/Member)
 * - Join date (relative time)
 * - Temporary badge if applicable
 * - Remove button (conditional on permissions)
 * - Confirmation alert before removal
 */

import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import type { HouseholdMember } from '@petforce/auth';

export interface MemberCardProps {
  member: HouseholdMember;
  isLeader: boolean; // Current user is household leader
  isCurrentUser: boolean; // This member is the current user
  onRemove?: (memberId: string, memberEmail: string) => void;
  isRemoving?: boolean;
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
 * Format join date as relative time
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

export function MemberCard({
  member,
  isLeader,
  isCurrentUser,
  onRemove,
  isRemoving = false,
  testID,
}: MemberCardProps) {
  const canRemove = isLeader && !isCurrentUser && member.role !== 'leader';

  const handleRemove = () => {
    if (onRemove) {
      Alert.alert(
        'Remove Member?',
        `Are you sure you want to remove ${member.userEmail} from your household? They will lose access to all household pets and data.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove Member',
            style: 'destructive',
            onPress: () => onRemove(member.id, member.userEmail || 'this member'),
          },
        ]
      );
    }
  };

  return (
    <View style={styles.container} testID={testID}>
      {/* Avatar */}
      <View
        style={[
          styles.avatar,
          member.role === 'leader' ? styles.leaderAvatar : styles.memberAvatar,
        ]}
      >
        <Text style={styles.avatarText}>{getInitials(member.userEmail || 'User')}</Text>
      </View>

      {/* Member Info */}
      <View style={styles.info}>
        <View style={styles.headerRow}>
          <Text style={styles.email} numberOfLines={1}>
            {member.userEmail}
            {isCurrentUser && <Text style={styles.youBadge}> (You)</Text>}
          </Text>
          <View
            style={[
              styles.roleBadge,
              member.role === 'leader' ? styles.leaderRoleBadge : styles.memberRoleBadge,
            ]}
          >
            <Text
              style={[
                styles.roleBadgeText,
                member.role === 'leader' ? styles.leaderRoleText : styles.memberRoleText,
              ]}
            >
              {member.role === 'leader' ? 'Leader' : 'Member'}
            </Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.joinDate}>Joined {getRelativeTime(member.joinedAt)}</Text>
          {member.isTemporary && (
            <View style={styles.temporaryBadge}>
              <Text style={styles.temporaryText}>Temporary</Text>
            </View>
          )}
        </View>
      </View>

      {/* Remove Button (conditional) */}
      {canRemove && onRemove && (
        <TouchableOpacity
          style={styles.removeButton}
          onPress={handleRemove}
          disabled={isRemoving}
          testID={`${testID}-remove`}
        >
          {isRemoving ? (
            <ActivityIndicator size="small" color="#EF4444" />
          ) : (
            <Text style={styles.removeButtonText}>Remove</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  leaderAvatar: {
    backgroundColor: '#FEF3C7',
  },
  memberAvatar: {
    backgroundColor: '#E5E7EB',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4B5563',
  },
  info: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  email: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
    marginRight: 8,
    flex: 1,
  },
  youBadge: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '400',
  },
  roleBadge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  leaderRoleBadge: {
    backgroundColor: '#FEF3C7',
  },
  memberRoleBadge: {
    backgroundColor: '#E5E7EB',
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  leaderRoleText: {
    color: '#92400E',
  },
  memberRoleText: {
    color: '#4B5563',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  joinDate: {
    fontSize: 13,
    color: '#6B7280',
  },
  temporaryBadge: {
    backgroundColor: '#DBEAFE',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  temporaryText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1E40AF',
  },
  removeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 44,
    minWidth: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#EF4444',
  },
});
