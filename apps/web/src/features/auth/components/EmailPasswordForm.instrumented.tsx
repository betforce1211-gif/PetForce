// Email Password Form - Login and Register variants with COMPREHENSIVE LOGGING
// Instrumented version for P0 registration debugging

import { FormEvent, useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';
import { ResendConfirmationButton } from './ResendConfirmationButton';
import { useAuth } from '@petforce/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { registrationLogger } from '@petforce/observability';

/**
 * Props for the EmailPasswordForm component
 */
export interface EmailPasswordFormProps {
  /** The form mode - 'login' for sign in, 'register' for account creation */
  mode: 'login' | 'register';
  /** Optional callback called when authentication succeeds */
  onSuccess?: () => void;
  /** Optional callback for "Forgot Password" link (login mode only) */
  onForgotPassword?: () => void;
  /** Optional callback to toggle between login and register modes */
  onToggleMode?: () => void;
}

/**
 * Email and password authentication form component with COMPREHENSIVE LOGGING
 *
 * Provides a unified form for both login and registration flows with:
 * - Email and password inputs with validation
 * - Password strength indicator (register mode)
 * - Password confirmation field (register mode)
 * - Show/hide password toggle
 * - Automatic email verification flow integration
 * - Resend confirmation button for unverified accounts
 * - Animated error messages
 * - Forgot password link (login mode)
 * - Mode toggle option
 * - COMPREHENSIVE EVENT LOGGING for debugging and monitoring
 *
 * @example
 * ```tsx
 * // Login mode
 * <EmailPasswordForm
 *   mode="login"
 *   onSuccess={() => navigate('/dashboard')}
 *   onForgotPassword={() => navigate('/forgot-password')}
 * />
 *
 * // Register mode
 * <EmailPasswordForm
 *   mode="register"
 *   onSuccess={() => navigate('/verify-pending')}
 * />
 *
 * // With mode toggle
 * <EmailPasswordForm
 *   mode={mode}
 *   onToggleMode={() => setMode(m => m === 'login' ? 'register' : 'login')}
 * />
 * ```
 */
export function EmailPasswordForm({
  mode,
  onSuccess,
  onForgotPassword,
  onToggleMode,
}: EmailPasswordFormProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showResendButton, setShowResendButton] = useState(false);
  const [passwordMismatchError, setPasswordMismatchError] = useState<string | null>(null);

  const { loginWithPassword, registerWithPassword, isLoading, error } = useAuth();

  // Performance tracking
  const submitStartTime = useRef<number>(0);
  const buttonDisableTime = useRef<number>(0);
  const lastSubmitTime = useRef<number>(0);

  // Track if we're in a registration flow
  const isRegisterFlow = mode === 'register';

  // Log component mount (for registration mode only to avoid noise)
  useEffect(() => {
    if (isRegisterFlow) {
      console.log('[Registration] Form mounted', { mode });
    }
  }, [isRegisterFlow, mode]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Track submit timing
    submitStartTime.current = Date.now();
    
    // Check for double-submit
    const timeSinceLastSubmit = submitStartTime.current - lastSubmitTime.current;
    if (lastSubmitTime.current > 0 && timeSinceLastSubmit < 1000) {
      if (isRegisterFlow) {
        registrationLogger.doubleSubmitAttempted(timeSinceLastSubmit, true);
      }
      console.warn('[Registration] Double-submit prevented', { timeSinceLastSubmit });
      return;
    }
    lastSubmitTime.current = submitStartTime.current;

    setShowResendButton(false);
    setPasswordMismatchError(null);

    if (mode === 'register') {
      // START REGISTRATION FLOW LOGGING
      const correlationId = registrationLogger.startFlow(email, 'web');
      
      console.log('[Registration] Form submitted', {
        correlation_id: correlationId,
        email_provided: !!email,
        password_provided: !!password,
        confirm_password_provided: !!confirmPassword,
      });

      // Validation phase
      const validationStartTime = Date.now();
      
      if (password !== confirmPassword) {
        const validationDuration = Date.now() - validationStartTime;
        
        setPasswordMismatchError("Passwords don't match. Please make sure both passwords are identical.");
        
        registrationLogger.error(
          'validation',
          'Password mismatch',
          'form_reenabled'
        );
        
        registrationLogger.flowCompleted(false);
        
        console.log('[Registration] Validation failed - password mismatch', {
          correlation_id: correlationId,
          validation_duration_ms: validationDuration,
        });
        
        return;
      }
      
      const validationDuration = Date.now() - validationStartTime;
      registrationLogger.validationSuccess(password, validationDuration);

      // Track button disable latency
      buttonDisableTime.current = Date.now();
      const buttonDisableLatency = buttonDisableTime.current - submitStartTime.current;
      
      if (buttonDisableLatency > 100) {
        console.warn('[Registration] Button disable latency exceeded 100ms', {
          correlation_id: correlationId,
          latency_ms: buttonDisableLatency,
        });
      }

      // API call phase
      console.log('[Registration] Calling API', {
        correlation_id: correlationId,
        endpoint: '/auth/v1/signup',
      });
      
      const requestId = correlationId; // Use correlation ID as request ID
      registrationLogger.apiRequestSent(requestId);
      
      const apiStartTime = Date.now();
      const result = await registerWithPassword({ email, password });
      const apiDuration = Date.now() - apiStartTime;

      console.log('[Registration] API response received', {
        correlation_id: correlationId,
        result_success: result.success,
        confirmation_required: result.confirmationRequired,
        api_duration_ms: apiDuration,
        has_navigate_function: typeof navigate === 'function',
      });

      registrationLogger.apiResponseReceived(
        result.success,
        result.confirmationRequired ?? false,
        result.success ? undefined : 'REGISTRATION_ERROR'
      );

      // Performance metrics
      registrationLogger.performanceTiming({
        button_disable_latency_ms: buttonDisableLatency,
        api_response_time_ms: apiDuration,
      });

      if (result.success) {
        // Navigation decision point (CRITICAL DEBUG AREA)
        const shouldNavigate = result.confirmationRequired;
        
        console.log('[Registration] Navigation decision', {
          correlation_id: correlationId,
          should_navigate: shouldNavigate,
          will_navigate: shouldNavigate,
          confirmation_required: result.confirmationRequired,
          target_url: '/auth/verify-pending',
          current_url: window.location.href,
        });

        // Redirect to verification pending page
        if (result.confirmationRequired) {
          const targetUrl = `/auth/verify-pending?email=${encodeURIComponent(email)}`;
          
          registrationLogger.navigationAttempted(targetUrl, email, {
            result_success: result.success,
            confirmation_required: result.confirmationRequired,
            navigate_function_exists: typeof navigate === 'function',
          });

          console.log('[Registration] Navigate called', {
            correlation_id: correlationId,
            url: targetUrl,
            navigate_type: typeof navigate,
          });

          try {
            // Announce to screen readers
            registrationLogger.accessibilityAnnouncement(
              'Account created successfully. Redirecting to verification page.',
              'polite'
            );

            navigate(targetUrl);
            
            // Wait briefly to see if navigation happens
            setTimeout(() => {
              const navigated = window.location.pathname === '/auth/verify-pending';
              
              registrationLogger.navigationResult(navigated);
              
              if (!navigated) {
                console.error('[Registration] Navigation might be blocked', {
                  correlation_id: correlationId,
                  current_url: window.location.href,
                  expected_url: '/auth/verify-pending',
                  navigate_called: true,
                });
              } else {
                console.log('[Registration] Navigation successful', {
                  correlation_id: correlationId,
                  current_url: window.location.href,
                });
              }
              
              registrationLogger.flowCompleted(navigated);
            }, 100);
          } catch (navError) {
            const error = navError as Error;
            console.error('[Registration] Navigation error', {
              correlation_id: correlationId,
              error: error.message,
              stack: error.stack,
            });
            
            registrationLogger.navigationResult(false, error);
            registrationLogger.error('navigation', error, 'manual_navigation_required');
            registrationLogger.flowCompleted(false);
          }
        } else {
          console.log('[Registration] No confirmation required, calling onSuccess', {
            correlation_id: correlationId,
            has_onSuccess: !!onSuccess,
          });
          
          registrationLogger.flowCompleted(true);
          onSuccess?.();
        }
      } else {
        // Registration API failed
        console.error('[Registration] Registration failed', {
          correlation_id: correlationId,
          error: error?.message,
          error_code: error?.code,
        });
        
        registrationLogger.error('api', error?.message || 'Registration failed', 'form_reenabled');
        registrationLogger.flowCompleted(false);
      }
    } else {
      // Login flow (minimal logging to avoid noise)
      console.log('[Auth] Login attempt started', { email_provided: !!email });
      
      const result = await loginWithPassword({ email, password });
      
      if (result.success) {
        console.log('[Auth] Login successful');
        onSuccess?.();
      } else if (result.error?.code === 'EMAIL_NOT_CONFIRMED') {
        console.log('[Auth] Email not confirmed', { error_code: result.error.code });
        // Show resend button for unconfirmed users
        setShowResendButton(true);
      } else {
        console.error('[Auth] Login failed', { 
          error_code: result.error?.code,
          error_message: result.error?.message,
        });
      }
    }
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="space-y-3"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Email input */}
      <Input
        label="Email address"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoComplete="email"
        placeholder="you@example.com"
      />

      {/* Password input */}
      <div>
        <div className="relative">
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>

        {mode === 'register' && <PasswordStrengthIndicator password={password} />}
      </div>

      {/* Confirm password (register only) */}
      {mode === 'register' && (
        <Input
          label="Confirm password"
          type={showPassword ? 'text' : 'password'}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          autoComplete="new-password"
          placeholder="••••••••"
          error={password !== confirmPassword && confirmPassword ? "Passwords don't match" : undefined}
        />
      )}

      {/* Forgot password link (login only) */}
      {mode === 'login' && onForgotPassword && (
        <div className="text-right">
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Forgot password?
          </button>
        </div>
      )}

      {/* Password mismatch error (registration only) */}
      <AnimatePresence>
        {passwordMismatchError && (
          <motion.div
            className="p-3 border rounded-lg text-sm bg-red-50 border-red-200 text-red-700"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <p>{passwordMismatchError}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* API error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            className={`p-2 border rounded-lg text-xs ${
              error.code === 'EMAIL_NOT_CONFIRMED'
                ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            role="alert"
            aria-live="assertive"
          >
            <div className="space-y-1">
              {/* User-friendly error message */}
              <p className="font-medium text-xs">
                {error.message.includes('already') || error.message.includes('exist')
                  ? 'This email is already registered'
                  : error.message}
              </p>

              {/* Actionable guidance for duplicate email */}
              {(error.message.includes('already') || error.message.includes('exist')) && mode === 'register' && (
                <p className="text-xs">
                  Already have an account?{' '}
                  {onToggleMode && (
                    <button
                      type="button"
                      onClick={onToggleMode}
                      className="font-medium text-red-700 hover:text-red-800 underline"
                    >
                      Sign in
                    </button>
                  )}
                  {onToggleMode && onForgotPassword && ' or '}
                  {onForgotPassword && (
                    <button
                      type="button"
                      onClick={onForgotPassword}
                      className="font-medium text-red-700 hover:text-red-800 underline"
                    >
                      reset password
                    </button>
                  )}
                </p>
              )}

              {/* Resend confirmation for unverified accounts */}
              {showResendButton && error.code === 'EMAIL_NOT_CONFIRMED' && (
                <div className="pt-2 border-t border-yellow-300">
                  <p className="text-xs text-yellow-700 mb-2">
                    Didn't receive the verification email?
                  </p>
                  <ResendConfirmationButton email={email} variant="outline" size="sm" />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit button */}
      <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={isLoading}>
        {mode === 'register' ? 'Create account' : 'Sign in'}
      </Button>

      {/* Toggle mode */}
      {onToggleMode && (
        <p className="text-center text-sm text-gray-600">
          {mode === 'register' ? 'Already have an account? ' : "Don't have an account? "}
          <button
            type="button"
            onClick={onToggleMode}
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            {mode === 'register' ? 'Sign in' : 'Sign up'}
          </button>
        </p>
      )}
    </motion.form>
  );
}
