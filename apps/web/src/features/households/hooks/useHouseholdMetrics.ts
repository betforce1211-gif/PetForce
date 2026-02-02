/**
 * useHouseholdMetrics Hook
 *
 * React hook for fetching and managing household analytics metrics.
 *
 * Features:
 * - Automatic data fetching based on household ID
 * - Loading and error states
 * - Refresh capability
 * - Type-safe metrics data
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getHouseholdMetrics,
  type HouseholdMetrics,
} from '@petforce/auth/api/household-analytics-api';

export interface UseHouseholdMetricsResult {
  metrics: HouseholdMetrics | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook to fetch household analytics metrics
 *
 * @param householdId - The household ID to fetch metrics for
 * @returns Metrics data, loading state, error state, and refresh function
 *
 * @example
 * ```tsx
 * const { metrics, loading, error, refresh } = useHouseholdMetrics(household?.id);
 *
 * if (loading) return <Spinner />;
 * if (error) return <Error message={error} />;
 * if (!metrics) return null;
 *
 * return <MetricsDisplay metrics={metrics} onRefresh={refresh} />;
 * ```
 */
export function useHouseholdMetrics(householdId?: string): UseHouseholdMetricsResult {
  const [metrics, setMetrics] = useState<HouseholdMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    if (!householdId) {
      setMetrics(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await getHouseholdMetrics(householdId);

      if (result.success && result.data) {
        setMetrics(result.data);
        setError(null);
      } else {
        setError(result.error?.message || 'Failed to fetch metrics');
        setMetrics(null);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      setMetrics(null);
    } finally {
      setLoading(false);
    }
  }, [householdId]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return {
    metrics,
    loading,
    error,
    refresh: fetchMetrics,
  };
}
