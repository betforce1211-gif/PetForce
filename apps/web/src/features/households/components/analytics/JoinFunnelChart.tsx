/**
 * JoinFunnelChart Component
 *
 * Funnel chart showing join request conversion stages.
 *
 * Features:
 * - Submitted → Approved → Active stages
 * - Conversion percentage display
 * - Visual funnel representation
 * - Empty state handling
 */

import React from 'react';
import type { FunnelDataPoint } from '@petforce/auth';

export interface JoinFunnelChartProps {
  data: FunnelDataPoint[];
  loading?: boolean;
}

const stageLabels = {
  submitted: 'Submitted',
  approved: 'Approved',
  active: 'Active',
};

const stageColors = {
  submitted: 'bg-blue-500',
  approved: 'bg-green-500',
  active: 'bg-primary-500',
};

/**
 * Display join funnel as a funnel chart
 *
 * @example
 * ```tsx
 * <JoinFunnelChart data={metrics.joinFunnel} />
 * ```
 */
export function JoinFunnelChart({ data, loading }: JoinFunnelChartProps) {
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Join Funnel</h3>
        <div className="flex items-center justify-center h-64 text-gray-500">
          No data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Join Funnel</h3>
        <span className="text-sm text-gray-500">Conversion tracking</span>
      </div>

      {/* Funnel Chart */}
      <div className="space-y-4 py-4">
        {data.map((stage, index) => {
          const isFirst = index === 0;
          const width = stage.percentage;
          const prevWidth = index > 0 ? data[index - 1].percentage : 100;
          const dropoff = isFirst ? 0 : prevWidth - width;

          return (
            <div key={stage.stage} className="space-y-2">
              {/* Stage bar */}
              <div className="flex items-center gap-4">
                <div className="w-32 flex-shrink-0">
                  <span className="text-sm font-medium text-gray-700">
                    {stageLabels[stage.stage]}
                  </span>
                </div>
                <div className="flex-1 relative">
                  {/* Background bar */}
                  <div className="h-12 bg-gray-100 rounded-lg overflow-hidden">
                    {/* Filled portion */}
                    <div
                      className={`h-full ${stageColors[stage.stage]} transition-all duration-500 flex items-center justify-between px-4`}
                      style={{ width: `${width}%` }}
                    >
                      <span className="text-white font-semibold text-sm">
                        {stage.count}
                      </span>
                      <span className="text-white font-semibold text-sm">
                        {stage.percentage}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dropoff indicator */}
              {!isFirst && dropoff > 0 && (
                <div className="flex items-center gap-4 pl-32">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <svg
                      className="w-4 h-4 text-red-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>
                      {dropoff.toFixed(1)}% drop-off from {stageLabels[data[index - 1].stage]}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Overall Conversion</p>
            <p className="text-2xl font-bold text-gray-900">
              {data[data.length - 1]?.percentage || 0}%
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Submitted</p>
            <p className="text-2xl font-bold text-gray-900">{data[0]?.count || 0}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
