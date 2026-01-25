// Register Page - Create account with email/password

import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { EmailPasswordForm } from '../components/EmailPasswordForm';
import { SSOButtons } from '../components/SSOButtons';
import { motion } from 'framer-motion';

export function RegisterPage() {
  const navigate = useNavigate();

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
              onClick={() => navigate('/auth/welcome')}
              className="text-gray-400 hover:text-gray-600 mb-4"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <h1 className="text-2xl font-bold text-gray-900 mb-2 font-heading">
              Join the PetForce Family
            </h1>
            <p className="text-gray-600">Create your account to get started</p>
          </div>

          {/* SSO Options */}
          <div className="mb-6">
            <SSOButtons onSuccess={() => navigate('/dashboard')} />
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">Or sign up with email</span>
            </div>
          </div>

          {/* Email/Password Form */}
          <EmailPasswordForm
            mode="register"
            onSuccess={() => navigate('/auth/verify-email')}
            onToggleMode={() => navigate('/auth/login')}
          />

          {/* Terms */}
          <p className="text-xs text-center text-gray-500 mt-6">
            By signing up, you agree to our{' '}
            <a href="#" className="underline hover:text-gray-700">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="underline hover:text-gray-700">
              Privacy Policy
            </a>
          </p>
        </Card>
      </motion.div>
    </div>
  );
}
