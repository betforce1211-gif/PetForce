// Protected Route - Route guard for authenticated users

import { ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@petforce/auth';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

/**
 * Props for the ProtectedRoute component
 */
interface ProtectedRouteProps {
  /** The children components to render if authenticated */
  children: ReactNode;
  /** The path to redirect to if not authenticated (default: '/auth/welcome') */
  redirectTo?: string;
}

/**
 * Protected Route Component - Authentication Guard
 *
 * Wraps routes that require authentication. Prevents access to protected pages
 * for unauthenticated users by redirecting them to the login page.
 *
 * Features:
 * - Automatic session refresh on mount
 * - Loading state while checking authentication
 * - Preserves intended destination for post-login redirect
 * - Waits for auth store hydration from storage
 * - Seamless integration with React Router
 *
 * Flow:
 * 1. Check if auth store is hydrated from storage
 * 2. Attempt session refresh if tokens exist
 * 3. Show loading spinner during authentication check
 * 4. Redirect to login if not authenticated
 * 5. Render protected content if authenticated
 *
 * @example
 * ```tsx
 * // Basic usage - protects a route
 * <Route
 *   path="/dashboard"
 *   element={
 *     <ProtectedRoute>
 *       <DashboardPage />
 *     </ProtectedRoute>
 *   }
 * />
 *
 * // Custom redirect path
 * <ProtectedRoute redirectTo="/auth/login">
 *   <ProfilePage />
 * </ProtectedRoute>
 *
 * // Nested protected routes
 * <ProtectedRoute>
 *   <AppLayout>
 *     <Routes>
 *       <Route path="/pets" element={<PetsPage />} />
 *       <Route path="/settings" element={<SettingsPage />} />
 *     </Routes>
 *   </AppLayout>
 * </ProtectedRoute>
 * ```
 *
 * @param props - Component props
 * @returns Protected content if authenticated, redirect or loading spinner otherwise
 */
export function ProtectedRoute({ children, redirectTo = '/auth/welcome' }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, isHydrated, refreshSession } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    // Try to refresh the session on mount if we have tokens but not authenticated
    if (isHydrated && !isAuthenticated && !isLoading) {
      refreshSession();
    }
  }, [isHydrated, isAuthenticated, isLoading, refreshSession]);

  // Wait for the store to hydrate from storage
  if (!isHydrated || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth if not authenticated
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Render children if authenticated
  return <>{children}</>;
}
