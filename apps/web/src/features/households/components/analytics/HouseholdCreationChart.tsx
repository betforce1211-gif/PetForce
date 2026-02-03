/**
 * HouseholdCreationChart Component
 *
 * Line chart showing household member creation over time.
 *
 * Features:
 * - Last 90 days of member joins
 * - Line chart visualization
 * - Responsive design
 * - Empty state handling
 */

import React from 'react';
import type { TimelineDataPoint } from '@petforce/auth';

export interface HouseholdCreationChartProps {
  data: TimelineDataPoint[];
  loading?: boolean;
}

/**
 * Display member creation timeline as a line chart
 *
 * @example
 * ```tsx
 * <HouseholdCreationChart data={metrics.creationTimeline} />
 * ```
 */
export function HouseholdCreationChart({ data, loading }: HouseholdCreationChartProps) {
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Member Growth (Last 90 Days)</h3>
        <div className="flex items-center justify-center h-64 text-gray-500">
          No data available
        </div>
      </div>
    );
  }

  // Calculate max value for scaling
  const maxValue = Math.max(...data.map((d) => d.count), 1);
  const chartHeight = 256; // 64 * 4 (h-64)

  // Sample data points (show every 7th day to avoid crowding)
  const sampledData = data.filter((_, i) => i % 7 === 0 || i === data.length - 1);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Member Growth (Last 90 Days)</h3>
        <span className="text-sm text-gray-500">
          Total: {data.reduce((sum, d) => sum + d.count, 0)} new members
        </span>
      </div>

      {/* Chart */}
      <div className="relative h-64">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between text-xs text-gray-500 pr-2">
          <span>{maxValue}</span>
          <span>{Math.round(maxValue * 0.75)}</span>
          <span>{Math.round(maxValue * 0.5)}</span>
          <span>{Math.round(maxValue * 0.25)}</span>
          <span>0</span>
        </div>

        {/* Chart area */}
        <div className="absolute left-12 right-0 top-0 bottom-0">
          {/* Grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="border-t border-gray-200" />
            ))}
          </div>

          {/* Line chart */}
          <svg className="absolute inset-0 w-full h-full">
            {/* Line path */}
            <polyline
              fill="none"
              stroke="#3B82F6"
              strokeWidth="2"
              points={data
                .map((point, i) => {
                  const x = (i / (data.length - 1)) * 100;
                  const y = ((maxValue - point.count) / maxValue) * 100;
                  return `${x}%,${y}%`;
                })
                .join(' ')}
            />

            {/* Area fill */}
            <polygon
              fill="rgba(59, 130, 246, 0.1)"
              points={`
                0%,100%
                ${data
                  .map((point, i) => {
                    const x = (i / (data.length - 1)) * 100;
                    const y = ((maxValue - point.count) / maxValue) * 100;
                    return `${x}%,${y}%`;
                  })
                  .join(' ')}
                100%,100%
              `}
            />

            {/* Data points */}
            {data.map((point, i) => {
              const x = (i / (data.length - 1)) * 100;
              const y = ((maxValue - point.count) / maxValue) * 100;
              return (
                <circle
                  key={i}
                  cx={`${x}%`}
                  cy={`${y}%`}
                  r="3"
                  fill="#3B82F6"
                  className="hover:r-4 cursor-pointer"
                >
                  <title>
                    {new Date(point.date).toLocaleDateString()}: {point.count} members
                  </title>
                </circle>
              );
            })}
          </svg>
        </div>
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between mt-4 text-xs text-gray-500 pl-12">
        {sampledData.map((point, i) => (
          <span key={i}>{new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
        ))}
      </div>
    </div>
  );
}
