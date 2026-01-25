// Magic Link Form - Passwordless authentication

import { FormEvent, useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useMagicLink } from '@petforce/auth';
import { motion } from 'framer-motion';

export interface MagicLinkFormProps {
  onEmailSent?: () => void;
}

export function MagicLinkForm({ onEmailSent }: MagicLinkFormProps) {
  const [email, setEmail] = useState('');
  const { sendLink, isLoading, error, emailSent } = useMagicLink();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await sendLink(email);
    if (!error) {
      onEmailSent?.();
    }
  };

  if (emailSent) {
    return (
      <motion.div
        className="text-center space-y-4"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        {/* Mailbox animation */}
        <motion.div
          className="mx-auto w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        >
          <svg className="w-10 h-10 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </motion.div>

        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Check your email</h3>
          <p className="text-gray-600">
            We sent a magic link to <strong>{email}</strong>
          </p>
          <p className="text-sm text-gray-500 mt-2">Click the link in your email to sign in.</p>
        </div>

        <div className="pt-4 space-y-2">
          <p className="text-sm text-gray-500">Didn't receive the email?</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => sendLink(email)}
            isLoading={isLoading}
          >
            Resend link
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div>
        <p className="text-sm text-gray-600 mb-4">
          We'll send you a magic link to sign in instantly—no password needed!
        </p>

        <Input
          label="Email address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          placeholder="you@example.com"
        />
      </div>

      {error && (
        <motion.div
          className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {error.message}
        </motion.div>
      )}

      <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={isLoading}>
        Send magic link
      </Button>
    </motion.form>
  );
}
