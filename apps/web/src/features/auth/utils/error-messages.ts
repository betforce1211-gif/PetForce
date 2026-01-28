/**
 * User-friendly error messages for auth errors
 * 
 * Maps technical error codes to helpful, actionable messages
 */

export interface ErrorMessageConfig {
  title: string;
  message: string;
  action?: {
    text: string;
    onClick: () => void;
  };
}

/**
 * Get user-friendly error message for auth errors
 */
export function getAuthErrorMessage(
  error: { code?: string; message?: string } | null,
  context: {
    onSwitchToLogin?: () => void;
    onForgotPassword?: () => void;
  } = {}
): ErrorMessageConfig | null {
  if (!error) return null;

  const errorCode = error.code || '';
  const errorMessage = error.message || '';

  // Duplicate email registration
  if (
    errorCode === 'USER_ALREADY_EXISTS' ||
    errorMessage.toLowerCase().includes('user already registered') ||
    errorMessage.toLowerCase().includes('email already') ||
    errorMessage.toLowerCase().includes('already exists')
  ) {
    return {
      title: 'Email Already Registered',
      message: 'This email is already associated with an account. Would you like to sign in instead or reset your password?',
      action: context.onSwitchToLogin
        ? {
            text: 'Switch to Sign In',
            onClick: context.onSwitchToLogin,
          }
        : undefined,
    };
  }

  // Email not confirmed
  if (errorCode === 'EMAIL_NOT_CONFIRMED') {
    return {
      title: 'Email Not Verified',
      message: errorMessage || 'Please verify your email address before logging in. Check your inbox for the verification link.',
    };
  }

  // Invalid credentials
  if (
    errorCode === 'INVALID_CREDENTIALS' ||
    errorMessage.toLowerCase().includes('invalid login credentials') ||
    errorMessage.toLowerCase().includes('invalid email or password')
  ) {
    return {
      title: 'Invalid Credentials',
      message: 'The email or password you entered is incorrect. Please try again.',
      action: context.onForgotPassword
        ? {
            text: 'Forgot Password?',
            onClick: context.onForgotPassword,
          }
        : undefined,
    };
  }

  // Rate limit exceeded
  if (
    errorMessage.toLowerCase().includes('rate limit') ||
    errorMessage.toLowerCase().includes('too many requests')
  ) {
    return {
      title: 'Too Many Attempts',
      message: 'You have made too many requests. Please wait a few minutes and try again.',
    };
  }

  // Weak password
  if (
    errorMessage.toLowerCase().includes('password') &&
    (errorMessage.toLowerCase().includes('weak') ||
      errorMessage.toLowerCase().includes('strength') ||
      errorMessage.toLowerCase().includes('requirements'))
  ) {
    return {
      title: 'Password Too Weak',
      message: 'Please choose a stronger password. Use at least 8 characters with a mix of letters, numbers, and symbols.',
    };
  }

  // Network error
  if (
    errorCode === 'NETWORK_ERROR' ||
    errorMessage.toLowerCase().includes('network') ||
    errorMessage.toLowerCase().includes('connection')
  ) {
    return {
      title: 'Connection Error',
      message: 'Unable to connect to the server. Please check your internet connection and try again.',
    };
  }

  // Default fallback
  return {
    title: 'Something Went Wrong',
    message: errorMessage || 'An unexpected error occurred. Please try again.',
  };
}
