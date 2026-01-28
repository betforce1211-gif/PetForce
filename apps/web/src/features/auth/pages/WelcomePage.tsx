// Welcome Page - Landing page for authentication

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { AuthMethodSelector, AuthMethod } from '../components/AuthMethodSelector';
import { SSOButtons } from '../components/SSOButtons';
import { motion } from 'framer-motion';

export function WelcomePage() {
  const navigate = useNavigate();
  const [selectedMethod, setSelectedMethod] = useState<AuthMethod | undefined>(undefined);

  const handleMethodSelect = (method: AuthMethod) => {
    setSelectedMethod(method);

    // Navigate based on method
    switch (method) {
      case 'email':
        navigate('/auth/login');
        break;
      case 'magic-link':
        navigate('/auth/magic-link');
        break;
      case 'google':
      case 'apple':
        // SSO handled by SSOButtons component
        break;
      default:
        break;
    }
  };

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
          <div className="text-center mb-8">
            <motion.div
              className="inline-block mb-4"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            >
              <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center">
                <span className="text-3xl">🐾</span>
              </div>
            </motion.div>

            <h1 className="text-3xl font-bold text-gray-900 mb-2 font-heading">
              Join the PetForce Family
            </h1>
            <p className="text-gray-600">
              The simplest way to care for your family's pets
            </p>
          </div>

          {/* SSO Buttons */}
          <div className="mb-6">
            <SSOButtons onSuccess={() => navigate('/dashboard')} />
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          {/* Auth Method Selector */}
          <AuthMethodSelector
            selectedMethod={selectedMethod}
            onSelectMethod={handleMethodSelect}
            showBiometric={false}
          />

          {/* Sign in link */}
          <p className="text-center text-sm text-gray-600 mt-6">
            Already have an account?{' '}
            <button
              onClick={() => navigate('/auth/login')}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Sign in
            </button>
          </p>

          {/* Terms */}
          <p className="text-xs text-center text-gray-500 mt-6">
            By continuing, you agree to our{' '}
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
