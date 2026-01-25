// OAuth Callback Page - Handle OAuth redirects from Google/Apple

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { handleOAuthCallback } from '@petforce/auth';
import { motion } from 'framer-motion';

export function OAuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Check for error in query params
        const errorParam = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        if (errorParam) {
          setError(errorDescription || 'Authentication failed. Please try again.');
          setIsProcessing(false);
          return;
        }

        // Handle the OAuth callback - Supabase handles token extraction automatically
        const result = await handleOAuthCallback();

        if (result.success) {
          // Redirect to dashboard on success
          navigate('/dashboard', { replace: true });
        } else {
          setError(result.error?.message || 'Failed to complete sign in. Please try again.');
          setIsProcessing(false);
        }
      } catch (err) {
        console.error('OAuth callback error:', err);
        setError('An unexpected error occurred. Please try again.');
        setIsProcessing(false);
      }
    };

    processCallback();
  }, [navigate, searchParams]);

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4">
        <Card padding="lg">
          <div className="text-center space-y-4">
            <LoadingSpinner size="lg" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 font-heading">Completing sign in...</h2>
              <p className="text-gray-600 mt-2">Please wait while we set up your account</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <Card padding="lg">
          <div className="text-center space-y-4">
            {/* Error icon */}
            <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
              <svg
                className="w-10 h-10 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2 font-heading">Sign in failed</h2>
              <p className="text-gray-600">{error}</p>
            </div>

            <div className="space-y-3 pt-4">
              <Button variant="primary" size="lg" className="w-full" onClick={() => navigate('/auth/welcome')}>
                Try again
              </Button>
              <Button variant="ghost" size="lg" className="w-full" onClick={() => navigate('/auth/login')}>
                Back to sign in
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
