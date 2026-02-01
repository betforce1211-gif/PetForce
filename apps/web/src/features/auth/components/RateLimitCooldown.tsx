// Rate Limit Cooldown Timer Component

import { useEffect, useState } from 'react';

export interface RateLimitCooldownProps {
  /** Cooldown period in seconds */
  cooldownSeconds: number;
  /** Callback when cooldown expires */
  onExpire?: () => void;
}

/**
 * Displays a countdown timer for rate limit cooldowns
 *
 * Shows remaining time in MM:SS format and automatically
 * calls onExpire when the cooldown period ends.
 */
export function RateLimitCooldown({ cooldownSeconds, onExpire }: RateLimitCooldownProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(cooldownSeconds);

  useEffect(() => {
    // Reset timer if cooldownSeconds changes
    setRemainingSeconds(cooldownSeconds);
  }, [cooldownSeconds]);

  useEffect(() => {
    if (remainingSeconds <= 0) {
      onExpire?.();
      return;
    }

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onExpire?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [remainingSeconds, onExpire]);

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>
        Try again in <strong className="font-semibold text-gray-900">{formattedTime}</strong>
      </span>
    </div>
  );
}
