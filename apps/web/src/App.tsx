import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { createSupabaseClient } from '@petforce/auth';
import {
  UnifiedAuthPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  VerifyEmailPage,
  EmailVerificationPendingPage,
  OAuthCallbackPage,
  MagicLinkCallbackPage,
  AuthMetricsDashboard,
} from './features/auth/pages';
import { ProtectedRoute } from './features/auth/components';
import DashboardPage from './features/auth/pages/DashboardPage';
import {
  HouseholdOnboardingPage,
  CreateHouseholdPage,
  JoinHouseholdPage,
  HouseholdDashboardPage,
} from './features/households/pages';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const legacyAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// For E2E tests: use test credentials if real ones aren't provided
const isTestEnvironment = import.meta.env.MODE === 'test' || import.meta.env.CI === 'true';
const testSupabaseUrl = 'https://test.supabase.co';
const testAnonKey = 'test-anon-key-for-e2e-tests-only';

const finalUrl = supabaseUrl || (isTestEnvironment ? testSupabaseUrl : '');
const finalPublishableKey = publishableKey;
const finalAnonKey = legacyAnonKey || (isTestEnvironment ? testAnonKey : '');

if (finalUrl && (finalPublishableKey || finalAnonKey)) {
  createSupabaseClient(finalUrl, finalPublishableKey, finalAnonKey);
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Root redirect */}
        <Route path="/" element={<Navigate to="/auth" replace />} />

        {/* Public auth routes */}
        <Route path="/auth" element={<UnifiedAuthPage />} />

        {/* Redirects from old routes to unified page */}
        <Route path="/auth/welcome" element={<Navigate to="/auth" replace />} />
        <Route path="/auth/login" element={<Navigate to="/auth" replace />} />
        <Route path="/auth/register" element={<Navigate to="/auth?mode=register" replace />} />

        <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
        <Route path="/auth/verify-email" element={<VerifyEmailPage />} />
        <Route path="/auth/verify-pending" element={<EmailVerificationPendingPage />} />

        {/* OAuth and Magic Link callback handlers */}
        <Route path="/auth/callback" element={<OAuthCallbackPage />} />
        <Route path="/auth/magic-link" element={<MagicLinkCallbackPage />} />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/auth-metrics"
          element={
            <ProtectedRoute>
              <AuthMetricsDashboard />
            </ProtectedRoute>
          }
        />

        {/* Household onboarding */}
        <Route
          path="/onboarding/household"
          element={
            <ProtectedRoute>
              <HouseholdOnboardingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/onboarding/household/create"
          element={
            <ProtectedRoute>
              <CreateHouseholdPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/onboarding/household/join"
          element={
            <ProtectedRoute>
              <JoinHouseholdPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/household"
          element={
            <ProtectedRoute>
              <HouseholdDashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
