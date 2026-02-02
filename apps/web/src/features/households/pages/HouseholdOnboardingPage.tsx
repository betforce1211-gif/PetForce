/**
 * Household Onboarding Page
 *
 * First step in household setup - user chooses to create or join a household.
 * This page is shown after successful registration.
 *
 * Design:
 * - Simple, clean UI with two clear CTAs
 * - Visual distinction between "Create" (primary action) and "Join" (secondary)
 * - Helps users understand the household concept
 * - Part of post-registration onboarding flow
 */

import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { motion } from 'framer-motion';

export default function HouseholdOnboardingPage() {
  const navigate = useNavigate();

  const handleCreateHousehold = () => {
    navigate('/onboarding/household/create');
  };

  const handleJoinHousehold = () => {
    navigate('/onboarding/household/join');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 p-4">
      <div className="max-w-4xl mx-auto py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-primary-500 rounded-full flex items-center justify-center mx-auto">
              <span className="text-4xl">🏠</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 font-heading">
              Welcome to PetForce!
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Let's set up your household - the foundation for collaborative pet care
            </p>
          </div>

          {/* What is a Household? */}
          <Card padding="lg">
            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-gray-900 font-heading">
                What is a Household?
              </h2>
              <p className="text-gray-600">
                A household is your pet care team. Think of it like your physical house - you can
                invite family members, roommates, or temporary pet sitters to help track and manage
                your pets' care together.
              </p>
              <div className="bg-primary-50 rounded-lg p-4 space-y-2">
                <p className="text-sm text-gray-700">
                  <strong className="text-primary-700">Example:</strong> "The Zeder House" with 2
                  dogs, 3 cats, and 1 bird
                </p>
                <p className="text-sm text-gray-700">
                  <strong className="text-primary-700">Members:</strong> You, your wife, kids - all
                  tracking who fed the dogs, gave medicine to the cat, cleaned the bird cage
                </p>
                <p className="text-sm text-gray-700">
                  <strong className="text-primary-700">Temporary Access:</strong> Give pet sitters
                  access while you're on vacation
                </p>
              </div>
            </div>
          </Card>

          {/* Choice Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Create Household */}
            <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
              <Card padding="lg" className="h-full border-2 border-primary-200 hover:border-primary-400 transition-colors">
                <div className="space-y-6 flex flex-col h-full">
                  <div className="space-y-4 flex-1">
                    <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                      <svg
                        className="w-8 h-8 text-primary-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 font-heading mb-2">
                        Create a Household
                      </h3>
                      <p className="text-gray-600">
                        Start fresh by creating your own household. You'll be the household leader
                        and can invite others to join.
                      </p>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-start">
                        <svg
                          className="w-5 h-5 text-primary-500 mr-2 flex-shrink-0 mt-0.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        You become the household leader
                      </li>
                      <li className="flex items-start">
                        <svg
                          className="w-5 h-5 text-primary-500 mr-2 flex-shrink-0 mt-0.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        Add your pets and care tasks
                      </li>
                      <li className="flex items-start">
                        <svg
                          className="w-5 h-5 text-primary-500 mr-2 flex-shrink-0 mt-0.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        Invite family and friends
                      </li>
                      <li className="flex items-start">
                        <svg
                          className="w-5 h-5 text-primary-500 mr-2 flex-shrink-0 mt-0.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        Manage member permissions
                      </li>
                    </ul>
                  </div>
                  <Button variant="primary" size="lg" onClick={handleCreateHousehold} className="w-full">
                    Create Household
                  </Button>
                </div>
              </Card>
            </motion.div>

            {/* Join Household */}
            <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
              <Card padding="lg" className="h-full border-2 border-gray-200 hover:border-secondary-400 transition-colors">
                <div className="space-y-6 flex flex-col h-full">
                  <div className="space-y-4 flex-1">
                    <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center">
                      <svg
                        className="w-8 h-8 text-secondary-600"
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
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 font-heading mb-2">
                        Join a Household
                      </h3>
                      <p className="text-gray-600">
                        Already have an invite code? Join an existing household and start
                        collaborating with your family.
                      </p>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-start">
                        <svg
                          className="w-5 h-5 text-secondary-500 mr-2 flex-shrink-0 mt-0.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        Enter invite code from leader
                      </li>
                      <li className="flex items-start">
                        <svg
                          className="w-5 h-5 text-secondary-500 mr-2 flex-shrink-0 mt-0.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        Wait for leader approval
                      </li>
                      <li className="flex items-start">
                        <svg
                          className="w-5 h-5 text-secondary-500 mr-2 flex-shrink-0 mt-0.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        Start tracking pet care
                      </li>
                      <li className="flex items-start">
                        <svg
                          className="w-5 h-5 text-secondary-500 mr-2 flex-shrink-0 mt-0.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        See what others have done
                      </li>
                    </ul>
                  </div>
                  <Button variant="outline" size="lg" onClick={handleJoinHousehold} className="w-full">
                    Join Household
                  </Button>
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Skip Option */}
          <div className="text-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-gray-500 hover:text-gray-700 text-sm underline transition-colors"
            >
              Skip for now (you can set this up later)
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
