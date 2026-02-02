/**
 * Household Dashboard Screen
 *
 * Main household view showing:
 * - Household info (name, member count)
 * - Invite code section (leader only)
 * - Pending join requests (leader only)
 * - Member list
 * - Quick actions grid
 *
 * Features:
 * - Pull-to-refresh
 * - Auto-fetch on mount
 * - Loading/error states
 * - FlatList for members (virtualized)
 * - Leader-only sections
 */

import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useHouseholdStore, selectIsLeader, selectPendingRequestCount } from '@petforce/auth';
import { useAuthStore } from '@petforce/auth';

type HouseholdDashboardScreenProps = NativeStackScreenProps<any, 'HouseholdDashboard'>;

export function HouseholdDashboardScreen({ navigation }: HouseholdDashboardScreenProps) {
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
    approveRequest,
    rejectRequest,
    removeMember,
  } = useHouseholdStore();

  const isLeader = useHouseholdStore(selectIsLeader);
  const pendingCount = useHouseholdStore(selectPendingRequestCount);

  const [refreshing, setRefreshing] = useState(false);
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);

  // Fetch household on mount
  useEffect(() => {
    if (user?.id) {
      fetchHousehold(user.id);
    }
  }, [user?.id, fetchHousehold]);

  // Redirect if no household
  useEffect(() => {
    if (!loading && !household && !error) {
      navigation.navigate('HouseholdOnboarding');
    }
  }, [loading, household, error, navigation]);

  const handleRefresh = async () => {
    if (user?.id) {
      setRefreshing(true);
      await fetchHousehold(user.id);
      setRefreshing(false);
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    if (!user?.id) return;
    setProcessingRequestId(requestId);
    await approveRequest(requestId, user.id);
    setProcessingRequestId(null);
  };

  const handleRejectRequest = async (requestId: string) => {
    if (!user?.id) return;
    setProcessingRequestId(requestId);
    await rejectRequest(requestId, user.id);
    setProcessingRequestId(null);
  };

  const handleRemoveMember = (memberId: string, memberEmail: string) => {
    Alert.alert(
      'Remove Member?',
      `Are you sure you want to remove ${memberEmail} from your household?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            if (!household?.id || !user?.id) return;
            setRemovingMemberId(memberId);
            await removeMember(household.id, memberId, user.id);
            setRemovingMemberId(null);
          },
        },
      ]
    );
  };

  const quickActions = [
    {
      id: 'settings',
      title: 'Settings',
      emoji: '⚙️',
      color: '#6B7280',
      onPress: () => navigation.navigate('HouseholdSettings'),
      visible: isLeader,
      testID: 'settings-button',
    },
    {
      id: 'invite',
      title: 'Invite Members',
      emoji: '➕',
      color: '#2D9B87',
      onPress: () => Alert.alert('Share Invite', 'Share invite code via messaging, email, or QR code'),
      visible: isLeader,
      testID: 'invite-button',
    },
    {
      id: 'pets',
      title: 'Add Pet',
      emoji: '🐾',
      color: '#9CA3AF',
      onPress: () => Alert.alert('Coming Soon', 'Pet management coming soon!'),
      visible: true,
      disabled: true,
      testID: 'add-pet-button',
    },
    {
      id: 'tasks',
      title: 'Care Tasks',
      emoji: '✓',
      color: '#9CA3AF',
      onPress: () => Alert.alert('Coming Soon', 'Care tasks coming soon!'),
      visible: true,
      disabled: true,
      testID: 'care-tasks-button',
    },
  ].filter((action) => action.visible);

  // Loading State
  if (loading && !household) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#2D9B87" />
          <Text style={styles.loadingText}>Loading your household...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error State
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <View style={styles.errorIcon}>
            <Text style={styles.errorEmoji}>⚠️</Text>
          </View>
          <Text style={styles.errorTitle}>Error Loading Household</Text>
          <Text style={styles.errorText}>{error.message}</Text>
          <Button
            variant="primary"
            size="lg"
            onPress={handleRefresh}
            style={styles.retryButton}
            testID="retry-button"
          >
            Try Again
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  if (!household) {
    return null; // Will redirect to onboarding
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#2D9B87" />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Text style={styles.headerEmoji}>🏠</Text>
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>{household.name}</Text>
            <Text style={styles.headerSubtitle}>
              {memberCount} {memberCount === 1 ? 'member' : 'members'} • You are a{' '}
              {userRole === 'leader' ? 'Leader' : 'Member'}
            </Text>
          </View>
        </View>

        {/* Household Description */}
        {household.description && (
          <Card padding="md" style={styles.descriptionCard}>
            <Text style={styles.descriptionText}>{household.description}</Text>
          </Card>
        )}

        {/* Invite Code (Leader Only) */}
        {isLeader && household.inviteCode && (
          <Card padding="lg" style={styles.inviteCard}>
            <Text style={styles.sectionTitle}>Invite Code</Text>
            <Text style={styles.inviteCode}>{household.inviteCode}</Text>
            {household.inviteCodeExpiresAt && (
              <Text style={styles.inviteExpiry}>
                Expires: {new Date(household.inviteCodeExpiresAt).toLocaleDateString()}
              </Text>
            )}
            <Text style={styles.inviteHelper}>
              Share this code with family members to invite them
            </Text>
          </Card>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={[
                styles.actionCard,
                action.disabled && styles.actionCardDisabled,
              ]}
              onPress={action.onPress}
              disabled={action.disabled}
              activeOpacity={0.7}
              testID={action.testID}
            >
              <View style={[styles.actionIcon, { backgroundColor: action.color + '20' }]}>
                <Text style={styles.actionEmoji}>{action.emoji}</Text>
              </View>
              <Text style={[styles.actionTitle, action.disabled && styles.actionTitleDisabled]}>
                {action.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Pending Requests (Leader Only) */}
        {isLeader && pendingCount > 0 && (
          <Card padding="lg" style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Pending Join Requests</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingCount}</Text>
              </View>
            </View>
            {pendingRequests.map((request) => (
              <View key={request.id} style={styles.requestCard}>
                <View style={styles.requestHeader}>
                  <View style={styles.requestAvatar}>
                    <Text style={styles.requestAvatarText}>
                      {request.requesterEmail?.charAt(0).toUpperCase() || '?'}
                    </Text>
                  </View>
                  <View style={styles.requestInfo}>
                    <Text style={styles.requestEmail}>{request.requesterEmail}</Text>
                    <Text style={styles.requestTime}>
                      Requested {getRelativeTime(request.requestedAt)}
                    </Text>
                  </View>
                </View>
                <View style={styles.requestActions}>
                  <TouchableOpacity
                    style={[styles.requestButton, styles.rejectButton]}
                    onPress={() => handleRejectRequest(request.id)}
                    disabled={processingRequestId === request.id}
                    testID={`reject-${request.id}`}
                  >
                    {processingRequestId === request.id ? (
                      <ActivityIndicator size="small" color="#EF4444" />
                    ) : (
                      <Text style={styles.rejectButtonText}>Reject</Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.requestButton, styles.approveButton]}
                    onPress={() => handleApproveRequest(request.id)}
                    disabled={processingRequestId === request.id}
                    testID={`approve-${request.id}`}
                  >
                    {processingRequestId === request.id ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.approveButtonText}>Approve</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </Card>
        )}

        {/* Members List */}
        <Card padding="lg" style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Household Members</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{memberCount}</Text>
            </View>
          </View>
          {members.map((member) => {
            const isCurrentUser = member.userId === user?.id;
            const canRemove = isLeader && !isCurrentUser && member.role !== 'leader';

            return (
              <View key={member.id} style={styles.memberCard}>
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberAvatarText}>
                    {member.userEmail?.charAt(0).toUpperCase() || '?'}
                  </Text>
                </View>
                <View style={styles.memberInfo}>
                  <View style={styles.memberHeader}>
                    <Text style={styles.memberEmail}>
                      {member.userEmail}
                      {isCurrentUser && <Text style={styles.youBadge}> (You)</Text>}
                    </Text>
                    <View
                      style={[
                        styles.roleBadge,
                        member.role === 'leader' ? styles.leaderBadge : styles.memberBadge,
                      ]}
                    >
                      <Text
                        style={[
                          styles.roleBadgeText,
                          member.role === 'leader'
                            ? styles.leaderBadgeText
                            : styles.memberBadgeText,
                        ]}
                      >
                        {member.role === 'leader' ? 'Leader' : 'Member'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.memberJoinDate}>
                    Joined {getRelativeTime(member.joinedAt)}
                  </Text>
                </View>
                {canRemove && (
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemoveMember(member.id, member.userEmail || 'this member')}
                    disabled={removingMemberId === member.id}
                    testID={`remove-${member.id}`}
                  >
                    {removingMemberId === member.id ? (
                      <ActivityIndicator size="small" color="#EF4444" />
                    ) : (
                      <Text style={styles.removeButtonText}>Remove</Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

// Helper function for relative time
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F9FF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorIcon: {
    width: 80,
    height: 80,
    backgroundColor: '#FEE2E2',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  errorEmoji: {
    fontSize: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    minHeight: 48,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#2D9B87',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerEmoji: {
    fontSize: 24,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  descriptionCard: {
    marginBottom: 16,
  },
  descriptionText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  inviteCard: {
    marginBottom: 16,
    alignItems: 'center',
  },
  inviteCode: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2D9B87',
    fontFamily: 'Courier',
    marginVertical: 8,
  },
  inviteExpiry: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 8,
  },
  inviteHelper: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  actionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 100,
    justifyContent: 'center',
  },
  actionCardDisabled: {
    opacity: 0.5,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionEmoji: {
    fontSize: 24,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  actionTitleDisabled: {
    color: '#9CA3AF',
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  badge: {
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  requestCard: {
    backgroundColor: '#D1FAE5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  requestAvatar: {
    width: 40,
    height: 40,
    backgroundColor: '#10B981',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  requestAvatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  requestInfo: {
    flex: 1,
  },
  requestEmail: {
    fontSize: 15,
    fontWeight: '600',
    color: '#065F46',
  },
  requestTime: {
    fontSize: 13,
    color: '#047857',
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  requestButton: {
    flex: 1,
    paddingVertical: 10,
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
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  memberAvatar: {
    width: 40,
    height: 40,
    backgroundColor: '#E5E7EB',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  memberAvatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4B5563',
  },
  memberInfo: {
    flex: 1,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  memberEmail: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
    marginRight: 8,
  },
  youBadge: {
    fontSize: 13,
    color: '#6B7280',
  },
  roleBadge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  leaderBadge: {
    backgroundColor: '#FEF3C7',
  },
  memberBadge: {
    backgroundColor: '#E5E7EB',
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  leaderBadgeText: {
    color: '#92400E',
  },
  memberBadgeText: {
    color: '#4B5563',
  },
  memberJoinDate: {
    fontSize: 13,
    color: '#6B7280',
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
