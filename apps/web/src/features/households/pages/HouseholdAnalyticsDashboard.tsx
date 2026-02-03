/**
 * Household Analytics Dashboard Page
 *
 * Leader-only analytics dashboard showing household metrics and charts.
 *
 * Features:
 * - Key metrics (active members, join requests, retention)
 * - Member growth chart (last 90 days)
 * - Join funnel chart (conversion tracking)
 * - Member activity chart (top active members)
 * - CSV export functionality
 * - Leader-only access control
 * - Responsive design
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHouseholdStore, useAuthStore } from '@petforce/auth';
import { exportHouseholdAnalytics, downloadCSV } from '@petforce/auth';
import { useHouseholdMetrics } from '../hooks/useHouseholdMetrics';
import {
  MetricCard,
  HouseholdCreationChart,
  JoinFunnelChart,
  MemberActivityChart,
} from '../components/analytics';
import { Button } from '@/components/ui/Button';

/**
 * Analytics dashboard for household leaders
 *
 * @example
 * ```tsx
 * <Route path="/households/analytics" element={<HouseholdAnalyticsDashboard />} />
 * ```
 */
export function HouseholdAnalyticsDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { household, members, userRole } = useHouseholdStore();
  const { metrics, loading, error, refresh } = useHouseholdMetrics(household?.id);
  const [exporting, setExporting] = useState(false);

  // Redirect if no household
  if (!household && !loading) {
    navigate('/onboarding/household');
    return null;
  }

  // Leader-only access
  const isLeader = userRole === 'leader';
  if (!loading && !isLeader) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white border border-gray-200 rounded-lg p-8 max-w-md w-full text-center">
          <svg
            className="w-16 h-16 text-gray-400 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h2>
          <p className="text-gray-600 mb-6">
            Only household leaders can view analytics. Contact your household leader for access.
          </p>
          <Button onClick={() => navigate('/households/dashboard')} variant="primary">
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Export analytics to CSV
  const handleExport = async () => {
    if (!household?.id) return;

    setExporting(true);
    try {
      const blob = await exportHouseholdAnalytics(household.id);
      const filename = `${household.name.replace(/\s+/g, '-')}-analytics-${new Date().toISOString().split('T')[0]}.csv`;
      downloadCSV(blob, filename);
    } catch (err) {
      console.error('Failed to export analytics', err);
      alert('Failed to export analytics. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  // Error state
  if (error && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white border border-red-200 rounded-lg p-8 max-w-md w-full">
          <div className="text-center">
            <svg
              className="w-16 h-16 text-red-500 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Failed to Load Analytics</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={refresh} variant="primary">
                Try Again
              </Button>
              <Button onClick={() => navigate('/households/dashboard')} variant="outline">
                Return to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => navigate('/households/dashboard')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-2 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                <span className="text-sm">Back to Dashboard</span>
              </button>
              <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="text-gray-600 mt-1">{household?.name}</p>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={refresh} variant="outline" disabled={loading}>
                <svg
                  className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Refresh
              </Button>
              <Button onClick={handleExport} variant="primary" isLoading={exporting} disabled={exporting || loading}>
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Export CSV
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <MetricCard
            title="Active Members"
            value={metrics?.activeMembers ?? 0}
            change={metrics?.memberGrowth}
            icon="users"
            loading={loading}
          />
          <MetricCard
            title="Join Requests"
            value={metrics?.pendingRequests ?? 0}
            icon="inbox"
            loading={loading}
          />
          <MetricCard
            title="Member Retention"
            value={metrics ? `${metrics.retentionRate}%` : '0%'}
            change={metrics?.retentionChange}
            icon="trending-up"
            loading={loading}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <HouseholdCreationChart
            data={metrics?.creationTimeline ?? []}
            loading={loading}
          />
          <JoinFunnelChart
            data={metrics?.joinFunnel ?? []}
            loading={loading}
          />
        </div>

        {/* Member Activity */}
        <div className="mb-8">
          <MemberActivityChart
            data={metrics?.memberActivity ?? []}
            loading={loading}
          />
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
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
            <div>
              <p className="text-sm text-blue-900 font-medium mb-2">About Analytics</p>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Analytics data is updated in real-time as members join and interact</li>
                <li>• Member growth shows the last 90 days of household expansion</li>
                <li>• Join funnel tracks conversion from submission to active membership</li>
                <li>• Member activity will show more detail as event tracking is implemented</li>
                <li>• Export CSV to analyze data in Excel or Google Sheets</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
