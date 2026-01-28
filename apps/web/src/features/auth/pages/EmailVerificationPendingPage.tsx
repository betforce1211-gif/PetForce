// Email Verification Pending Page - Waiting for user to verify email

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { ResendConfirmationButton } from '../components/ResendConfirmationButton';
import { getCurrentUser } from '@petforce/auth';
import { motion } from 'framer-motion';

export function EmailVerificationPendingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || 'your email';
  const [timeSinceRegistration, setTimeSinceRegistration] = useState(0);
  const [isVerified, setIsVerified] = useState(false);

  // Auto-detect verification completion by polling
  useEffect(() => {
    const checkVerificationStatus = async () => {
      try {
        const result = await getCurrentUser();
        if (result.user && result.user.emailVerified) {
          setIsVerified(true);
          // Wait 2 seconds to show success animation, then redirect
          setTimeout(() => navigate('/auth/verify-email'), 2000);
        }
      } catch {
        // User not logged in yet, which is expected before verification
      }
    };

    // Poll every 10 seconds
    const pollInterval = setInterval(checkVerificationStatus, 10000);

    // Also check immediately
    checkVerificationStatus();

    return () => clearInterval(pollInterval);
  }, [navigate]);

  // Track time since registration
  useEffect(() => {
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setTimeSinceRegistration(elapsed);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTimeSince = (seconds: number): string => {
    if (seconds < 60) return `${seconds} seconds ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes === 1) return '1 minute ago';
    return `${minutes} minutes ago`;
  };

  if (isVerified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4">
        <motion.div
          className="w-full max-w-md"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
        >
          <Card padding="lg">
            <div className="text-center space-y-4">
              <motion.div
                className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
              >
                <svg className="w-10 h-10 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </motion.div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 font-heading">Email verified!</h2>
                <p className="text-gray-600 mt-2">Redirecting to login...</p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card padding="lg">
          <div className="text-center space-y-6">
            {/* Email icon */}
            <motion.div
              className="mx-auto w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center relative"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            >
              <svg
                className="w-12 h-12 text-primary-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>

              {/* Animated checkmark badge */}
              <motion.div
                className="absolute -top-1 -right-1 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center border-2 border-white"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: 'spring', stiffness: 300 }}
              >
                <span className="text-white text-lg">!</span>
              </motion.div>
            </motion.div>

            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 font-heading">
                Check your email
              </h1>
              <div className="space-y-2">
                <p className="text-gray-600">
                  We sent a verification email to:
                </p>
                <p className="text-primary-600 font-semibold break-all">
                  {email}
                </p>
                <p className="text-gray-600 mt-3">
                  Click the link in the email to activate your account and start using PetForce.
                </p>
              </div>
            </div>

            {/* Status indicator */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-yellow-800">Verification pending</p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Sent {formatTimeSince(timeSinceRegistration)}
                  </p>
                </div>
              </div>
            </div>

            {/* Email delivery tips */}
            <div className="space-y-3 pt-2">
              <div className="text-sm text-gray-600 text-left bg-gray-50 rounded-lg p-4">
                <p className="font-medium text-gray-900 mb-2">💡 Tips:</p>
                <ul className="space-y-1.5 text-left">
                  <li className="flex items-start gap-2">
                    <span className="text-primary-600">•</span>
                    <span>Emails usually arrive within 1-2 minutes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-600">•</span>
                    <span>Check your spam or junk folder</span>
                  </li>
                  {timeSinceRegistration > 120 && (
                    <li className="flex items-start gap-2">
                      <span className="text-orange-600">•</span>
                      <span className="text-orange-700 font-medium">
                        Taking longer than usual? Try resending below
                      </span>
                    </li>
                  )}
                </ul>
              </div>
            </div>

            {/* Resend button */}
            <div className="space-y-3 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-700 font-medium">Didn't receive the email?</p>
              <ResendConfirmationButton email={email} variant="outline" size="lg" />
            </div>

            {/* Back to login */}
            <div className="pt-2">
              <button
                onClick={() => navigate('/login')}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                ← Back to login
              </button>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
