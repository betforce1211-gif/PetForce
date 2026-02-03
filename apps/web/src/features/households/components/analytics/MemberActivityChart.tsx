/**
 * MemberActivityChart Component
 *
 * Bar chart showing member activity levels.
 *
 * Features:
 * - Activity count per member
 * - Last active timestamp
 * - Horizontal bar chart
 * - Empty state handling
 */

import React from 'react';
import type { ActivityDataPoint } from '@petforce/auth';

export interface MemberActivityChartProps {
  data: ActivityDataPoint[];
  loading?: boolean;
}

/**
 * Display member activity as a bar chart
 *
 * @example
 * ```tsx
 * <MemberActivityChart data={metrics.memberActivity} />
 * ```
 */
export function MemberActivityChart({ data, loading }: MemberActivityChartProps) {
  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="h-8 w-48 bg-gray-200 animate-pulse rounded mb-4" />
        <div className="h-64 bg-gray-100 animate-pulse rounded" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Member Activity</h3>
        <div className="flex items-center justify-center h-64 text-gray-500">
          No members to display
        </div>
      </div>
    );
  }

  // Sort by activity count (descending)
  const sortedData = [...data].sort((a, b) => b.activityCount - a.activityCount);
  const maxActivity = Math.max(...sortedData.map((d) => d.activityCount), 1);

  // Limit to top 10 most active members
  const displayData = sortedData.slice(0, 10);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Member Activity</h3>
        <span className="text-sm text-gray-500">Top {displayData.length} members</span>
      </div>

      {/* Activity Bars */}
      <div className="space-y-4">
        {displayData.map((member, index) => {
          const percentage = maxActivity > 0 ? (member.activityCount / maxActivity) * 100 : 0;
          const lastActiveDate = new Date(member.lastActive);
          const isRecent =
            Date.now() - lastActiveDate.getTime() < 7 * 24 * 60 * 60 * 1000; // Last 7 days

          return (
            <div key={member.memberId} className="space-y-1">
              {/* Member info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">
                    {member.memberName}
                  </span>
                  {isRecent && (
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                      Active
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-500">
                  {member.activityCount} actions
                </span>
              </div>

              {/* Activity bar */}
              <div className="relative">
                <div className="h-8 bg-gray-100 rounded-lg overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      index === 0
                        ? 'bg-primary-500'
                        : index === 1
                        ? 'bg-primary-400'
                        : index === 2
                        ? 'bg-primary-300'
                        : 'bg-gray-300'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>

              {/* Last active */}
              <div className="text-xs text-gray-500">
                Last active: {lastActiveDate.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Show more indicator */}
      {sortedData.length > displayData.length && (
        <div className="mt-4 pt-4 border-t border-gray-200 text-center">
          <span className="text-sm text-gray-500">
            +{sortedData.length - displayData.length} more members
          </span>
        </div>
      )}

      {/* Empty state */}
      {displayData.every((d) => d.activityCount === 0) && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="text-center text-sm text-gray-500">
            <p>No activity recorded yet</p>
            <p className="text-xs mt-1">Activity tracking will appear here once members start using the system</p>
          </div>
        </div>
      )}
    </div>
  );
}
