// Auth Header - Shared header for unified auth page

import { motion } from 'framer-motion';

/**
 * Header component for the unified authentication page
 *
 * Displays the PetForce logo, welcome message, and tagline.
 * Responsive design with different sizes for desktop and mobile.
 */
export function AuthHeader() {
  return (
    <div className="text-center mb-6 md:mb-8">
      <motion.div
        className="inline-block mb-3 md:mb-4"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
      >
        <div className="w-14 h-14 md:w-16 md:h-16 bg-primary-500 rounded-full flex items-center justify-center">
          <span className="text-3xl md:text-4xl">🐾</span>
        </div>
      </motion.div>

      <motion.h1
        className="text-2xl md:text-3xl font-bold text-gray-900 mb-1 md:mb-2 font-heading"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        Welcome to PetForce
      </motion.h1>

      <motion.p
        className="text-sm md:text-base text-gray-600"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <span className="hidden md:inline">The simplest way to care for your family's pets</span>
        <span className="md:hidden">Care for your pets simply</span>
      </motion.p>
    </div>
  );
}
