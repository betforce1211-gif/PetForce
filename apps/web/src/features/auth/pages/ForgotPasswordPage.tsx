// Forgot Password Page - Request password reset

import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { usePasswordReset } from '@petforce/auth';
import { motion } from 'framer-motion';

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const { sendResetEmail, isLoading, error, emailSent } = usePasswordReset();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await sendResetEmail(email);
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card padding="lg">
            <div className="text-center space-y-4">
              {/* Success icon */}
              <motion.div
                className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              >
                <svg
                  className="w-10 h-10 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </motion.div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2 font-heading">Check your email</h2>
                <p className="text-gray-600">
                  If an account exists with <strong>{email}</strong>, we've sent you a password reset link.
                </p>
              </div>

              <div className="pt-4">
                <Button variant="primary" size="lg" className="w-full" onClick={() => navigate('/auth/login')}>
                  Back to sign in
                </Button>
              </div>

              <p className="text-sm text-gray-500">
                Didn't receive the email? Check your spam folder or{' '}
                <button onClick={handleSubmit} className="text-primary-600 hover:text-primary-700 font-medium">
                  try again
                </button>
              </p>
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
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate('/auth/login')}
              className="text-gray-400 hover:text-gray-600 mb-4"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <h1 className="text-2xl font-bold text-gray-900 mb-2 font-heading">Forgot password?</h1>
            <p className="text-gray-600">No worries! Enter your email and we'll send you a reset link.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@example.com"
            />

            {error && (
              <motion.div
                className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {error.message}
              </motion.div>
            )}

            <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={isLoading}>
              Send reset link
            </Button>

            <p className="text-center text-sm text-gray-600">
              Remember your password?{' '}
              <button
                type="button"
                onClick={() => navigate('/auth/login')}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Sign in
              </button>
            </p>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
