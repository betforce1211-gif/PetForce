// Protected Route - Route guard for authenticated users

import { ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@petforce/auth';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface ProtectedRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

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
