/**
 * Join Household Page
 *
 * Full page wrapper for the JoinHouseholdForm component.
 * Handles navigation after successful join request submission.
 *
 * Route: /onboarding/household/join
 */

import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { JoinHouseholdForm } from '../components/JoinHouseholdForm';
import { motion } from 'framer-motion';

export default function JoinHouseholdPage() {
  const navigate = useNavigate();

  const handleSuccess = () => {
    // Navigate to dashboard after successful join request
    navigate('/dashboard');
  };

  const handleCancel = () => {
    // Go back to onboarding choice page
    navigate('/onboarding/household');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 p-4">
      <div className="max-w-2xl mx-auto py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-secondary-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 font-heading mb-2">
              Join Your Family's Household
            </h1>
            <p className="text-gray-600">
              Enter your invite code to get started
            </p>
          </div>

          {/* Form Card */}
          <Card padding="lg">
            <JoinHouseholdForm onSuccess={handleSuccess} onCancel={handleCancel} />
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
