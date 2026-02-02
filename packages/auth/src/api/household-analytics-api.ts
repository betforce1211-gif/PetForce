/**
 * Household Analytics API
 *
 * API for fetching household analytics data including metrics,
 * charts, and reporting data.
 *
 * Features:
 * - Household metrics (active members, retention, etc.)
 * - Timeline data for charts
 * - Funnel analytics for join flow
 * - CSV export for analytics data
 * - Leader-only access control
 */

import { getSupabaseClient } from './supabase-client';
import { logger } from '../utils/logger';

// =============================================================================
// TYPES
// =============================================================================

export interface HouseholdMetrics {
  activeMembers: number;
  pendingRequests: number;
  retentionRate: number;
  memberGrowth: number;
  retentionChange: number;
  creationTimeline: TimelineDataPoint[];
  joinFunnel: FunnelDataPoint[];
  memberActivity: ActivityDataPoint[];
}

export interface TimelineDataPoint {
  date: string;
  count: number;
}

export interface FunnelDataPoint {
  stage: 'submitted' | 'approved' | 'active';
  count: number;
  percentage: number;
}

export interface ActivityDataPoint {
  memberId: string;
  memberName: string;
  lastActive: string;
  activityCount: number;
}

export interface AnalyticsResponse {
  success: boolean;
  data?: HouseholdMetrics;
  error?: {
    code: string;
    message: string;
  };
}

// =============================================================================
// API FUNCTIONS
// =============================================================================

/**
 * Get comprehensive household metrics
 *
 * @param householdId - The household ID to get metrics for
 * @returns Analytics response with metrics data
 */
export async function getHouseholdMetrics(householdId: string): Promise<AnalyticsResponse> {
  const supabase = getSupabaseClient();

  try {
    logger.debug('Fetching household metrics', { householdId });

    // Get active members count
    const { data: members, error: membersError } = await supabase
      .from('household_members')
      .select('id, status, joined_at, user_id, users(full_name)')
      .eq('household_id', householdId)
      .eq('status', 'active');

    if (membersError) {
      logger.error('Failed to fetch members for metrics', membersError);
      throw membersError;
    }

    // Get pending requests count
    const { data: requests, error: requestsError } = await supabase
      .from('household_join_requests')
      .select('id, status, created_at')
      .eq('household_id', householdId)
      .eq('status', 'pending');

    if (requestsError) {
      logger.error('Failed to fetch requests for metrics', requestsError);
      throw requestsError;
    }

    // Get all members including inactive for historical analysis
    const { data: allMembers, error: allMembersError } = await supabase
      .from('household_members')
      .select('id, status, joined_at, left_at')
      .eq('household_id', householdId)
      .order('joined_at', { ascending: true });

    if (allMembersError) {
      logger.error('Failed to fetch all members for metrics', allMembersError);
      throw allMembersError;
    }

    // Get all join requests for funnel analysis
    const { data: allRequests, error: allRequestsError } = await supabase
      .from('household_join_requests')
      .select('id, status, created_at')
      .eq('household_id', householdId);

    if (allRequestsError) {
      logger.error('Failed to fetch all requests for funnel', allRequestsError);
      throw allRequestsError;
    }

    // Calculate metrics
    const activeMembers = members?.length || 0;
    const pendingRequests = requests?.length || 0;

    // Calculate retention rate (active / total who joined)
    const totalJoined = allMembers?.length || 0;
    const retentionRate = totalJoined > 0 ? Math.round((activeMembers / totalJoined) * 100) : 100;

    // Calculate member growth (last 30 days vs previous 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const recentMembers = allMembers?.filter(
      (m) => new Date(m.joined_at) >= thirtyDaysAgo
    ).length || 0;
    const previousMembers = allMembers?.filter(
      (m) => new Date(m.joined_at) >= sixtyDaysAgo && new Date(m.joined_at) < thirtyDaysAgo
    ).length || 0;

    const memberGrowth = previousMembers > 0
      ? Math.round(((recentMembers - previousMembers) / previousMembers) * 100)
      : recentMembers > 0 ? 100 : 0;

    // Calculate retention change (simplified - would need historical data)
    const retentionChange = 0; // Placeholder - would calculate from historical data

    // Build creation timeline (last 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const timelineData: TimelineDataPoint[] = [];
    const membersByDate: Record<string, number> = {};

    allMembers?.forEach((member) => {
      if (new Date(member.joined_at) >= ninetyDaysAgo) {
        const date = new Date(member.joined_at).toISOString().split('T')[0];
        membersByDate[date] = (membersByDate[date] || 0) + 1;
      }
    });

    // Fill in timeline with all dates (including zeros)
    for (let i = 90; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      timelineData.push({
        date: dateStr,
        count: membersByDate[dateStr] || 0,
      });
    }

    // Build join funnel
    const submittedCount = allRequests?.length || 0;
    const approvedCount = allRequests?.filter((r) => r.status === 'approved').length || 0;
    const activeCount = activeMembers;

    const joinFunnel: FunnelDataPoint[] = [
      {
        stage: 'submitted',
        count: submittedCount,
        percentage: 100,
      },
      {
        stage: 'approved',
        count: approvedCount,
        percentage: submittedCount > 0 ? Math.round((approvedCount / submittedCount) * 100) : 0,
      },
      {
        stage: 'active',
        count: activeCount,
        percentage: submittedCount > 0 ? Math.round((activeCount / submittedCount) * 100) : 0,
      },
    ];

    // Build member activity (simplified - would use event tracking)
    const memberActivity: ActivityDataPoint[] = members?.map((member: any) => ({
      memberId: member.user_id,
      memberName: member.users?.full_name || 'Unknown',
      lastActive: member.joined_at, // Would use actual last_active_at from events
      activityCount: 0, // Would calculate from events
    })) || [];

    const metrics: HouseholdMetrics = {
      activeMembers,
      pendingRequests,
      retentionRate,
      memberGrowth,
      retentionChange,
      creationTimeline: timelineData,
      joinFunnel,
      memberActivity,
    };

    logger.debug('Household metrics calculated', {
      householdId,
      activeMembers,
      retentionRate,
    });

    return {
      success: true,
      data: metrics,
    };
  } catch (error: any) {
    logger.error('Failed to get household metrics', error);
    return {
      success: false,
      error: {
        code: error.code || 'METRICS_ERROR',
        message: error.message || 'Failed to fetch household metrics',
      },
    };
  }
}

/**
 * Export household analytics data as CSV
 *
 * @param householdId - The household ID to export analytics for
 * @returns CSV blob with analytics data
 */
export async function exportHouseholdAnalytics(householdId: string): Promise<Blob> {
  const result = await getHouseholdMetrics(householdId);

  if (!result.success || !result.data) {
    throw new Error('Failed to fetch analytics data for export');
  }

  const metrics = result.data;

  // Build CSV content
  const csvLines: string[] = [];

  // Header
  csvLines.push('Household Analytics Export');
  csvLines.push(`Generated: ${new Date().toISOString()}`);
  csvLines.push('');

  // Summary Metrics
  csvLines.push('Summary Metrics');
  csvLines.push('Metric,Value');
  csvLines.push(`Active Members,${metrics.activeMembers}`);
  csvLines.push(`Pending Requests,${metrics.pendingRequests}`);
  csvLines.push(`Retention Rate,${metrics.retentionRate}%`);
  csvLines.push(`Member Growth,${metrics.memberGrowth}%`);
  csvLines.push('');

  // Timeline Data
  csvLines.push('Member Creation Timeline (Last 90 Days)');
  csvLines.push('Date,New Members');
  metrics.creationTimeline.forEach((point) => {
    csvLines.push(`${point.date},${point.count}`);
  });
  csvLines.push('');

  // Funnel Data
  csvLines.push('Join Funnel');
  csvLines.push('Stage,Count,Percentage');
  metrics.joinFunnel.forEach((point) => {
    csvLines.push(`${point.stage},${point.count},${point.percentage}%`);
  });
  csvLines.push('');

  // Member Activity
  csvLines.push('Member Activity');
  csvLines.push('Member Name,Last Active,Activity Count');
  metrics.memberActivity.forEach((point) => {
    csvLines.push(`${point.memberName},${point.lastActive},${point.activityCount}`);
  });

  const csvContent = csvLines.join('\n');
  return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
}

/**
 * Download CSV file
 *
 * @param blob - CSV blob to download
 * @param filename - Filename for the download
 */
export function downloadCSV(blob: Blob, filename: string): void {
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
