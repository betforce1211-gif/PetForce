// Email Verification Page - Confirm email and celebrate

import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function VerifyEmailPage() {
  const navigate = useNavigate();
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    // Trigger confetti animation after a brief delay
    const timer = setTimeout(() => setShowConfetti(true), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Confetti */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(50)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-10%`,
                backgroundColor: ['#2D9B87', '#FF9F40', '#4CAF50', '#2196F3'][Math.floor(Math.random() * 4)],
              }}
              initial={{ y: 0, opacity: 1, rotate: 0 }}
              animate={{
                y: window.innerHeight + 100,
                opacity: 0,
                rotate: Math.random() * 360,
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                delay: Math.random() * 0.5,
                ease: 'easeOut',
              }}
            />
          ))}
        </div>
      )}

      <motion.div
        className="w-full max-w-md relative z-10"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card padding="lg">
          <div className="text-center space-y-6">
            {/* Success animation */}
            <motion.div
              className="mx-auto w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center relative"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.5, type: 'spring', stiffness: 150 }}
              >
                <svg
                  className="w-12 h-12 text-primary-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </motion.div>
            </motion.div>

            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 font-heading">
                Welcome to the PetForce Family! 🎉
              </h1>
              <p className="text-gray-600">
                Your email has been verified. You're all set to start caring for your pets!
              </p>
            </div>

            <div className="space-y-3 pt-4">
              <Button variant="primary" size="lg" className="w-full" onClick={() => navigate('/dashboard')}>
                Let's get started
              </Button>

              <p className="text-sm text-gray-500">
                Need help getting started? Check out our{' '}
                <a href="#" className="text-primary-600 hover:text-primary-700">
                  quick start guide
                </a>
              </p>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
