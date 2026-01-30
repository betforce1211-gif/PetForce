// Email Verification Page - Confirm email and celebrate

import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import {
  ANIMATION_TIMINGS,
  UI_COUNTS,
  ANIMATION_VALUES,
  CONFETTI_COLORS,
  ICON_SIZES,
} from '@/config/ui-constants';
import { getInnerHeight } from '@petforce/auth';

export function VerifyEmailPage() {
  const navigate = useNavigate();
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    // Trigger confetti animation after a brief delay
    const timer = setTimeout(() => setShowConfetti(true), ANIMATION_TIMINGS.CONFETTI_DELAY);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Confetti */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(UI_COUNTS.CONFETTI_PARTICLES)].map((_, i) => {
            const colorIndex = Math.floor(Math.random() * UI_COUNTS.COLOR_PALETTE_SIZE);
            const windowHeight = getInnerHeight(ANIMATION_VALUES.WINDOW_HEIGHT_FALLBACK);
            const baseDuration = ANIMATION_TIMINGS.CONFETTI_MIN_DURATION / 1000; // Convert to seconds
            const randomDuration =
              (ANIMATION_TIMINGS.CONFETTI_MAX_DURATION - ANIMATION_TIMINGS.CONFETTI_MIN_DURATION) / 1000;
            const randomDelay = (Math.random() * ANIMATION_TIMINGS.CONFETTI_RANDOM_DELAY) / 1000;

            return (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: ICON_SIZES.CONFETTI_PARTICLE,
                  height: ICON_SIZES.CONFETTI_PARTICLE,
                  left: `${Math.random() * 100}%`,
                  top: `-10%`,
                  backgroundColor: CONFETTI_COLORS[colorIndex],
                }}
                initial={{ y: 0, opacity: 1, rotate: 0 }}
                animate={{
                  y: windowHeight + ANIMATION_VALUES.CONFETTI_FALL_DISTANCE,
                  opacity: 0,
                  rotate: Math.random() * ANIMATION_VALUES.CONFETTI_MAX_ROTATION,
                }}
                transition={{
                  duration: baseDuration + Math.random() * randomDuration,
                  delay: randomDelay,
                  ease: 'easeOut',
                }}
              />
            );
          })}
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
              className="mx-auto bg-primary-100 rounded-full flex items-center justify-center relative"
              style={{
                width: ICON_SIZES.SUCCESS_ICON_CONTAINER,
                height: ICON_SIZES.SUCCESS_ICON_CONTAINER,
              }}
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
                  className="text-primary-600"
                  style={{ width: ICON_SIZES.SUCCESS_ICON, height: ICON_SIZES.SUCCESS_ICON }}
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
