// Dashboard page - placeholder for authenticated users

import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@petforce/auth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { motion } from 'framer-motion';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    navigate('/auth/welcome');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 p-4">
      <div className="max-w-6xl mx-auto py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <header className="flex justify-between items-center mb-8">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center">
                <span className="text-2xl">🐾</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 font-heading">PetForce Dashboard</h1>
                <p className="text-gray-600">Welcome back, {user?.email || 'Pet Parent'}!</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </header>

          {/* Main content */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card padding="lg">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 font-heading mb-2">
                    Authentication Complete!
                  </h2>
                  <p className="text-gray-600 text-sm">
                    You've successfully signed in to PetForce. Your authentication is working perfectly.
                  </p>
                </div>
              </div>
            </Card>

            <Card padding="lg">
              <div className="space-y-4">
                <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center">
                  <span className="text-3xl">🐶</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 font-heading mb-2">Pet Profiles</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Add and manage your beloved pets' profiles
                  </p>
                  <Button variant="outline" size="sm" className="w-full">
                    Coming Soon
                  </Button>
                </div>
              </div>
            </Card>

            <Card padding="lg">
              <div className="space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-3xl">📋</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 font-heading mb-2">Health Records</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Track vaccinations, medications, and vet visits
                  </p>
                  <Button variant="outline" size="sm" className="w-full">
                    Coming Soon
                  </Button>
                </div>
              </div>
            </Card>

            <Card padding="lg">
              <div className="space-y-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-3xl">⏰</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 font-heading mb-2">Care Reminders</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Set up reminders for feeding, walks, and medications
                  </p>
                  <Button variant="outline" size="sm" className="w-full">
                    Coming Soon
                  </Button>
                </div>
              </div>
            </Card>

            <Card padding="lg">
              <div className="space-y-4">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-3xl">🏥</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 font-heading mb-2">Vet Connection</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Connect with your veterinarian for seamless care
                  </p>
                  <Button variant="outline" size="sm" className="w-full">
                    Coming Soon
                  </Button>
                </div>
              </div>
            </Card>

            <Card padding="lg">
              <div className="space-y-4">
                <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center">
                  <span className="text-3xl">📊</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 font-heading mb-2">Health Analytics</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    View insights and trends about your pet's health
                  </p>
                  <Button variant="outline" size="sm" className="w-full">
                    Coming Soon
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Welcome message */}
          <Card padding="lg" className="mt-8">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold text-gray-900 font-heading">
                Welcome to the PetForce Family! 🎉
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                You're all set! We've successfully implemented a comprehensive authentication system with
                email/password, magic links, and SSO. The dashboard features above are coming soon as we
                continue building PetForce to help you care for your beloved pets.
              </p>
              <div className="flex justify-center space-x-4 pt-4">
                <Button variant="primary" onClick={() => navigate('/auth/welcome')}>
                  View Auth Pages
                </Button>
                <Button variant="outline" onClick={handleLogout}>
                  Test Logout
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
