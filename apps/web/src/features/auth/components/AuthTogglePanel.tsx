// Auth Toggle Panel - Mobile toggle-based login/register interface

import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { EmailPasswordForm } from './EmailPasswordForm';
import { SSOButtons } from './SSOButtons';
import { Card } from '@/components/ui/Card';
import { motion, AnimatePresence } from 'framer-motion';

type AuthMode = 'login' | 'register';

/**
 * Toggle-based authentication interface for mobile
 *
 * Features a tab-based interface that switches between login and register:
 * - Login is the default state (most common use case)
 * - Smooth animation when switching between modes
 * - Optimized for small screens with single-column layout
 */
export function AuthTogglePanel() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Initialize state from URL parameter (lazy initialization to avoid cascading renders)
  const [activeMode, setActiveMode] = useState<AuthMode>(() => {
    const mode = searchParams.get('mode');
    return mode === 'register' ? 'register' : 'login';
  });

  const handleLoginSuccess = () => {
    navigate('/dashboard');
  };

  const handleRegisterSuccess = () => {
    // EmailPasswordForm handles navigation to verify-pending
  };

  const handleForgotPassword = () => {
    navigate('/auth/forgot-password');
  };

  return (
    <Card padding="md" className="w-full max-w-md mx-auto">
      {/* Toggle Switch */}
      <div className="flex border-b border-gray-200 mb-4" role="tablist">
        <button
          role="tab"
          aria-selected={activeMode === 'login'}
          aria-controls="auth-panel"
          className={`flex-1 py-3 text-center font-semibold transition-all rounded-t-lg ${
            activeMode === 'login'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
          onClick={() => setActiveMode('login')}
        >
          Sign In
        </button>
        <button
          role="tab"
          aria-selected={activeMode === 'register'}
          aria-controls="auth-panel"
          className={`flex-1 py-3 text-center font-semibold transition-all rounded-t-lg ${
            activeMode === 'register'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
          onClick={() => setActiveMode('register')}
        >
          Sign Up
        </button>
      </div>

      {/* Animated Content Panel */}
      <div id="auth-panel" role="tabpanel">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeMode}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            {activeMode === 'login' ? (
              <section aria-label="Sign in to your account">
                <div className="mb-4">
                  <h2 className="text-2xl font-bold text-gray-900 mb-1 font-heading">
                    Welcome Back!
                  </h2>
                  <p className="text-sm text-gray-600">Sign in to continue</p>
                </div>

                {/* SSO Buttons */}
                <div className="mb-4">
                  <SSOButtons onSuccess={handleLoginSuccess} />
                </div>

                {/* Divider */}
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500">Or sign in with email</span>
                  </div>
                </div>

                {/* Login Form */}
                <EmailPasswordForm
                  mode="login"
                  onSuccess={handleLoginSuccess}
                  onForgotPassword={handleForgotPassword}
                />
              </section>
            ) : (
              <section aria-label="Create a new account">
                <div className="mb-4">
                  <h2 className="text-2xl font-bold text-gray-900 mb-1 font-heading">
                    Join the Family
                  </h2>
                  <p className="text-sm text-gray-600">Create your account</p>
                </div>

                {/* SSO Buttons */}
                <div className="mb-4">
                  <SSOButtons onSuccess={handleLoginSuccess} />
                </div>

                {/* Divider */}
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500">Or sign up with email</span>
                  </div>
                </div>

                {/* Register Form */}
                <EmailPasswordForm
                  mode="register"
                  onSuccess={handleRegisterSuccess}
                  onForgotPassword={handleForgotPassword}
                  onToggleMode={() => setActiveMode('login')}
                />

                {/* Terms and Privacy */}
                <p className="text-xs text-center text-gray-500 mt-3">
                  By continuing, you agree to our{' '}
                  <a href="#" className="underline hover:text-gray-700">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="#" className="underline hover:text-gray-700">
                    Privacy Policy
                  </a>
                </p>
              </section>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </Card>
  );
}
