// Authentication Metrics Dashboard
// Real-time monitoring of registration funnel and confirmation rates

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { metrics, type MetricsSummary } from '@petforce/auth';
import { motion } from 'framer-motion';

export function AuthMetricsDashboard() {
  const [summary, setSummary] = useState<MetricsSummary | null>(null);
  const [alerts, setAlerts] = useState<Array<{ level: 'warning' | 'critical'; message: string }>>(
    []
  );
  const [selectedPeriod, setSelectedPeriod] = useState<'1h' | '24h' | '7d'>('24h');

  useEffect(() => {
    const updateMetrics = () => {
      const periodMs = {
        '1h': 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
      }[selectedPeriod];

      setSummary(metrics.getSummary(periodMs));
      setAlerts(metrics.checkAlerts());
    };

    // Update immediately
    updateMetrics();

    // Subscribe to metric updates
    const unsubscribe = metrics.subscribe(updateMetrics);

    // Also poll every 30 seconds
    const interval = setInterval(updateMetrics, 30000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [selectedPeriod]);

  if (!summary) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-gray-600">Loading metrics...</p>
        </div>
      </div>
    );
  }

  const MetricCard = ({
    title,
    value,
    subtitle,
    trend,
    color = 'primary',
  }: {
    title: string;
    value: string | number;
    subtitle?: string;
    trend?: 'up' | 'down' | 'neutral';
    color?: 'primary' | 'green' | 'yellow' | 'red';
  }) => {
    const colorClasses = {
      primary: 'bg-primary-50 text-primary-900 border-primary-200',
      green: 'bg-green-50 text-green-900 border-green-200',
      yellow: 'bg-yellow-50 text-yellow-900 border-yellow-200',
      red: 'bg-red-50 text-red-900 border-red-200',
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className={`${colorClasses[color]} border`}>
          <div className="space-y-2">
            <p className="text-sm font-medium opacity-80">{title}</p>
            <div className="flex items-end justify-between">
              <p className="text-3xl font-bold font-heading">{value}</p>
              {trend && (
                <span
                  className={`text-sm ${
                    trend === 'up'
                      ? 'text-green-600'
                      : trend === 'down'
                      ? 'text-red-600'
                      : 'text-gray-600'
                  }`}
                >
                  {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
                </span>
              )}
            </div>
            {subtitle && <p className="text-xs opacity-70">{subtitle}</p>}
          </div>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 font-heading">
              Authentication Metrics
            </h1>
            <p className="text-gray-600 mt-1">
              Real-time monitoring of registration funnel and login success
            </p>
          </div>

          {/* Period selector */}
          <div className="flex gap-2 bg-white rounded-lg p-1 border border-gray-200">
            {(['1h', '24h', '7d'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                  selectedPeriod === period
                    ? 'bg-primary-100 text-primary-900'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {period === '1h' ? 'Last Hour' : period === '24h' ? 'Last 24 Hours' : 'Last 7 Days'}
              </button>
            ))}
          </div>
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="space-y-2">
            {alerts.map((alert, index) => (
              <motion.div
                key={index}
                className={`p-4 rounded-lg border ${
                  alert.level === 'critical'
                    ? 'bg-red-50 border-red-200 text-red-800'
                    : 'bg-yellow-50 border-yellow-200 text-yellow-800'
                }`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl">
                    {alert.level === 'critical' ? '🚨' : '⚠️'}
                  </span>
                  <div>
                    <p className="font-medium">
                      {alert.level === 'critical' ? 'Critical Alert' : 'Warning'}
                    </p>
                    <p className="text-sm mt-1">{alert.message}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Registration Funnel */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4 font-heading">Registration Funnel</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
              title="Registrations Started"
              value={summary.registrationStarted}
              subtitle="Users who clicked register"
              color="primary"
            />
            <MetricCard
              title="Registrations Completed"
              value={summary.registrationCompleted}
              subtitle="Accounts created (pending verification)"
              color="primary"
            />
            <MetricCard
              title="Email Confirmations"
              value={summary.emailConfirmed}
              subtitle={`${summary.confirmationRatePercent}% confirmation rate`}
              color={
                summary.confirmationRatePercent >= 70
                  ? 'green'
                  : summary.confirmationRatePercent >= 50
                  ? 'yellow'
                  : 'red'
              }
            />
          </div>
        </div>

        {/* Login Metrics */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4 font-heading">Login Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
              title="Login Attempts"
              value={summary.loginAttempts}
              subtitle="Total login attempts"
              color="primary"
            />
            <MetricCard
              title="Successful Logins"
              value={summary.loginSuccesses}
              subtitle={`${summary.loginSuccessRatePercent}% success rate`}
              color={
                summary.loginSuccessRatePercent >= 70
                  ? 'green'
                  : summary.loginSuccessRatePercent >= 50
                  ? 'yellow'
                  : 'red'
              }
            />
            <MetricCard
              title="Unconfirmed Login Rejections"
              value={summary.loginRejectedUnconfirmed}
              subtitle="Users trying to login before verifying email"
              color={summary.loginRejectedUnconfirmed > 5 ? 'yellow' : 'primary'}
            />
          </div>
        </div>

        {/* Additional Metrics */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4 font-heading">Additional Insights</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MetricCard
              title="Avg. Time to Confirm Email"
              value={
                summary.avgTimeToConfirmMinutes
                  ? `${Math.round(summary.avgTimeToConfirmMinutes)} min`
                  : 'N/A'
              }
              subtitle="Average time from registration to email confirmation"
              color={
                summary.avgTimeToConfirmMinutes === null
                  ? 'primary'
                  : summary.avgTimeToConfirmMinutes <= 30
                  ? 'green'
                  : summary.avgTimeToConfirmMinutes <= 60
                  ? 'yellow'
                  : 'red'
              }
            />
            <MetricCard
              title="Overall Health"
              value={
                summary.confirmationRatePercent >= 70 && summary.loginSuccessRatePercent >= 70
                  ? '✅ Healthy'
                  : summary.confirmationRatePercent >= 50 && summary.loginSuccessRatePercent >= 50
                  ? '⚠️ Degraded'
                  : '🚨 Critical'
              }
              subtitle="Based on confirmation and login success rates"
              color={
                summary.confirmationRatePercent >= 70 && summary.loginSuccessRatePercent >= 70
                  ? 'green'
                  : summary.confirmationRatePercent >= 50 && summary.loginSuccessRatePercent >= 50
                  ? 'yellow'
                  : 'red'
              }
            />
          </div>
        </div>

        {/* Funnel Visualization */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4 font-heading">Funnel Visualization</h2>
          <Card>
            <div className="space-y-4">
              {/* Step 1 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">1. Registration Started</span>
                  <span className="text-sm text-gray-600">{summary.registrationStarted}</span>
                </div>
                <div className="h-8 bg-gray-200 rounded-lg overflow-hidden">
                  <div className="h-full bg-primary-500" style={{ width: '100%' }} />
                </div>
              </div>

              {/* Step 2 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    2. Registration Completed
                  </span>
                  <span className="text-sm text-gray-600">
                    {summary.registrationCompleted} (
                    {summary.registrationStarted > 0
                      ? Math.round(
                          (summary.registrationCompleted / summary.registrationStarted) * 100
                        )
                      : 0}
                    %)
                  </span>
                </div>
                <div className="h-8 bg-gray-200 rounded-lg overflow-hidden">
                  <div
                    className="h-full bg-primary-500"
                    style={{
                      width: `${
                        summary.registrationStarted > 0
                          ? (summary.registrationCompleted / summary.registrationStarted) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              {/* Step 3 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">3. Email Confirmed</span>
                  <span className="text-sm text-gray-600">
                    {summary.emailConfirmed} ({summary.confirmationRatePercent}%)
                  </span>
                </div>
                <div className="h-8 bg-gray-200 rounded-lg overflow-hidden">
                  <div
                    className={`h-full ${
                      summary.confirmationRatePercent >= 70
                        ? 'bg-green-500'
                        : summary.confirmationRatePercent >= 50
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{
                      width: `${
                        summary.registrationStarted > 0
                          ? (summary.emailConfirmed / summary.registrationStarted) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              {/* Step 4 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">4. Successful Login</span>
                  <span className="text-sm text-gray-600">
                    {summary.loginSuccesses} ({summary.loginSuccessRatePercent}% of login attempts)
                  </span>
                </div>
                <div className="h-8 bg-gray-200 rounded-lg overflow-hidden">
                  <div
                    className={`h-full ${
                      summary.loginSuccessRatePercent >= 70
                        ? 'bg-green-500'
                        : summary.loginSuccessRatePercent >= 50
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{
                      width: `${
                        summary.registrationStarted > 0
                          ? (summary.loginSuccesses / summary.registrationStarted) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
