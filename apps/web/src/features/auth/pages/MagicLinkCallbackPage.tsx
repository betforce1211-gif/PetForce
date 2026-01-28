// Magic Link Callback Page - Handle magic link verification

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { verifyMagicLink } from '@petforce/auth';
import { getHash } from '@petforce/auth/utils/window-adapter';
import { motion } from 'framer-motion';

export function MagicLinkCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const verifyLink = async () => {
      try {
        // Get token from URL (can be in hash or query params)
        const hash = getHash();
        const hashParams = new URLSearchParams(hash.substring(1));
        const token = searchParams.get('token') || hashParams.get('token');
        const type = (searchParams.get('type') || hashParams.get('type') || 'magiclink') as 'magiclink' | 'email';

        if (!token) {
          setError('Invalid magic link. Please request a new one.');
          setIsVerifying(false);
          return;
        }

        const result = await verifyMagicLink(token, type);

        if (result.success) {
          // Redirect to dashboard on success
          navigate('/dashboard', { replace: true });
        } else {
          setError(
            result.error?.message ||
              'This magic link has expired or is invalid. Please request a new one.'
          );
          setIsVerifying(false);
        }
      } catch (err) {
        console.error('Magic link verification error:', err);
        setError('An unexpected error occurred. Please try again.');
        setIsVerifying(false);
      }
    };

    verifyLink();
  }, [navigate, searchParams]);

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4">
        <Card padding="lg">
          <div className="text-center space-y-4">
            <LoadingSpinner size="lg" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 font-heading">Verifying magic link...</h2>
              <p className="text-gray-600 mt-2">Please wait while we sign you in</p>
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
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2 font-heading">Link expired</h2>
              <p className="text-gray-600">{error}</p>
            </div>

            <div className="space-y-3 pt-4">
              <Button variant="primary" size="lg" className="w-full" onClick={() => navigate('/auth/login')}>
                Request new link
              </Button>
              <Button variant="ghost" size="lg" className="w-full" onClick={() => navigate('/auth/welcome')}>
                Back to welcome
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
