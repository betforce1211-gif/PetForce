/**
 * MetricCard Component
 *
 * Displays a single metric with optional change indicator.
 *
 * Features:
 * - Clean metric display
 * - Optional change percentage with trend indicator
 * - Icon support
 * - Responsive design
 */

import React from 'react';

export interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon?: 'users' | 'inbox' | 'trending-up' | 'trending-down';
  loading?: boolean;
}

const icons = {
  users: (
    <svg
      className="w-6 h-6"
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
  ),
  inbox: (
    <svg
      className="w-6 h-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
      />
    </svg>
  ),
  'trending-up': (
    <svg
      className="w-6 h-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
      />
    </svg>
  ),
  'trending-down': (
    <svg
      className="w-6 h-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
      />
    </svg>
  ),
};

/**
 * Display a metric card with value and optional change indicator
 *
 * @example
 * ```tsx
 * <MetricCard
 *   title="Active Members"
 *   value={42}
 *   change={12}
 *   icon="users"
 * />
 * ```
 */
export function MetricCard({ title, value, change, icon, loading }: MetricCardProps) {
  const isPositiveChange = change !== undefined && change >= 0;
  const hasChange = change !== undefined && change !== 0;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          {loading ? (
            <div className="h-8 w-24 bg-gray-200 animate-pulse rounded" />
          ) : (
            <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>
          )}
          {hasChange && !loading && (
            <div className="flex items-center gap-1">
              <svg
                className={`w-4 h-4 ${
                  isPositiveChange ? 'text-green-600' : 'text-red-600'
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                {isPositiveChange ? (
                  <path
                    fillRule="evenodd"
                    d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                ) : (
                  <path
                    fillRule="evenodd"
                    d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                )}
              </svg>
              <span
                className={`text-sm font-medium ${
                  isPositiveChange ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {Math.abs(change)}%
              </span>
              <span className="text-sm text-gray-500 ml-1">vs last month</span>
            </div>
          )}
        </div>
        {icon && (
          <div className="flex-shrink-0 p-3 bg-primary-50 rounded-lg text-primary-600">
            {icons[icon]}
          </div>
        )}
      </div>
    </div>
  );
}
