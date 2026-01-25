// Password Strength Indicator - Visual feedback for password strength

import { useMemo } from 'react';
import { calculatePasswordStrength } from '@petforce/auth';
import { motion } from 'framer-motion';

export interface PasswordStrengthIndicatorProps {
  password: string;
  showRequirements?: boolean;
}

export function PasswordStrengthIndicator({
  password,
  showRequirements = true,
}: PasswordStrengthIndicatorProps) {
  const strength = useMemo(() => calculatePasswordStrength(password), [password]);

  const requirements = useMemo(
    () => [
      { label: 'At least 8 characters', met: password.length >= 8 },
      { label: 'Contains uppercase letter', met: /[A-Z]/.test(password) },
      { label: 'Contains lowercase letter', met: /[a-z]/.test(password) },
      { label: 'Contains number', met: /[0-9]/.test(password) },
    ],
    [password]
  );

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2">
      {/* Strength meter */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-medium text-gray-700">Password strength</span>
          <span className="text-sm font-semibold" style={{ color: strength.color }}>
            {strength.label}
          </span>
        </div>

        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: strength.color }}
            initial={{ width: 0 }}
            animate={{ width: `${(strength.score / 4) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Requirements checklist */}
      {showRequirements && (
        <ul className="space-y-1">
          {requirements.map((req, index) => (
            <motion.li
              key={index}
              className="flex items-center gap-2 text-sm"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div
                className={`
                  w-4 h-4 rounded-full flex items-center justify-center
                  ${req.met ? 'bg-green-500' : 'bg-gray-300'}
                  transition-colors duration-200
                `}
              >
                {req.met && (
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </div>
              <span className={req.met ? 'text-green-700' : 'text-gray-600'}>{req.label}</span>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
}
