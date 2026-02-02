/**
 * Create Household Page
 *
 * Full page wrapper for the CreateHouseholdForm component.
 * Handles navigation after successful household creation.
 *
 * Route: /onboarding/household/create
 */

import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { CreateHouseholdForm } from '../components/CreateHouseholdForm';
import { motion } from 'framer-motion';

export default function CreateHouseholdPage() {
  const navigate = useNavigate();

  const handleSuccess = () => {
    // Navigate to household dashboard after successful creation
    navigate('/dashboard/household');
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
            <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🏠</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 font-heading mb-2">
              Let's Create Your Household
            </h1>
            <p className="text-gray-600">
              Set up your household in just a few seconds
            </p>
          </div>

          {/* Form Card */}
          <Card padding="lg">
            <CreateHouseholdForm onSuccess={handleSuccess} onCancel={handleCancel} />
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
