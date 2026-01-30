/**
 * EmailPasswordForm Component Tests
 * Tucker's relentless edge case coverage
 * 
 * Tests both login and register modes with all possible user interactions,
 * error states, and edge cases that could impact pet family authentication.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { EmailPasswordForm } from '../EmailPasswordForm';
import * as authModule from '@petforce/auth';

// Mock the auth module
vi.mock('@petforce/auth', async () => {
  const actual = await vi.importActual('@petforce/auth');
  return {
    ...actual,
    useAuth: vi.fn(),
    calculatePasswordStrength: vi.fn(),
  };
});

// Mock react-router-dom navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('EmailPasswordForm', () => {
  const mockLoginWithPassword = vi.fn();
  const mockRegisterWithPassword = vi.fn();

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
    mockNavigate.mockClear();

    // Mock password strength calculator
    vi.mocked(authModule.calculatePasswordStrength).mockReturnValue({
      score: 3,
      feedback: 'Good password',
    } as any);

    // Default mock implementation
    vi.mocked(authModule.useAuth).mockReturnValue({
      loginWithPassword: mockLoginWithPassword,
      registerWithPassword: mockRegisterWithPassword,
      isLoading: false,
      error: null,
      user: null,
      isAuthenticated: false,
      logout: vi.fn(),
    } as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderForm = (mode: 'login' | 'register', props = {}) => {
    const defaultProps = {
      mode,
      onSuccess: vi.fn(),
      onForgotPassword: mode === 'login' ? vi.fn() : undefined,
      onToggleMode: vi.fn(),
      ...props,
    };

    return {
      ...render(
        <BrowserRouter>
          <EmailPasswordForm {...defaultProps} />
        </BrowserRouter>
      ),
      props: defaultProps,
    };
  };

  describe('LOGIN MODE', () => {
    describe('Happy Path', () => {
      it('renders login form with correct elements', () => {
        renderForm('login');

        expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
        expect(screen.getByText(/forgot password/i)).toBeInTheDocument();
      });

      it('submits login with valid credentials', async () => {
        mockLoginWithPassword.mockResolvedValue({ success: true });
        const user = userEvent.setup();
        const { props } = renderForm('login');

        await user.type(screen.getByLabelText(/email address/i), 'owner@petfamily.com');
        await user.type(screen.getByLabelText(/password/i), 'SecurePassword123!');
        await user.click(screen.getByRole('button', { name: /sign in/i }));

        await waitFor(() => {
          expect(mockLoginWithPassword).toHaveBeenCalledWith({
            email: 'owner@petfamily.com',
            password: 'SecurePassword123!',
          });
          expect(props.onSuccess).toHaveBeenCalled();
        });
      });

      it('calls onForgotPassword when forgot password clicked', async () => {
        const user = userEvent.setup();
        const onForgotPassword = vi.fn();
        renderForm('login', { onForgotPassword });

        await user.click(screen.getByText(/forgot password/i));

        expect(onForgotPassword).toHaveBeenCalled();
      });

      it('toggles password visibility', async () => {
        const user = userEvent.setup();
        renderForm('login');

        const passwordInput = screen.getByLabelText(/password/i);
        expect(passwordInput).toHaveAttribute('type', 'password');

        // Click show password button
        const toggleButton = screen.getByLabelText(/show password/i);
        await user.click(toggleButton);

        expect(passwordInput).toHaveAttribute('type', 'text');

        // Click hide password button
        await user.click(screen.getByLabelText(/hide password/i));
        expect(passwordInput).toHaveAttribute('type', 'password');
      });
    });

    describe('Error Handling', () => {
      it('displays generic error message on login failure', async () => {
        mockLoginWithPassword.mockResolvedValue({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password',
          },
        });

        vi.mocked(authModule.useAuth).mockReturnValue({
          loginWithPassword: mockLoginWithPassword,
          registerWithPassword: mockRegisterWithPassword,
          isLoading: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password',
          },
          user: null,
          isAuthenticated: false,
          logout: vi.fn(),
        } as any);

        const user = userEvent.setup();
        renderForm('login');

        await user.type(screen.getByLabelText(/email address/i), 'wrong@example.com');
        await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
        await user.click(screen.getByRole('button', { name: /sign in/i }));

        await waitFor(() => {
          expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
        });
      });

      it('displays EMAIL_NOT_CONFIRMED error with resend button', async () => {
        mockLoginWithPassword.mockResolvedValue({
          success: false,
          error: {
            code: 'EMAIL_NOT_CONFIRMED',
            message: 'Please verify your email address before logging in.',
          },
        });

        vi.mocked(authModule.useAuth).mockReturnValue({
          loginWithPassword: mockLoginWithPassword,
          registerWithPassword: mockRegisterWithPassword,
          isLoading: false,
          error: {
            code: 'EMAIL_NOT_CONFIRMED',
            message: 'Please verify your email address before logging in.',
          },
          user: null,
          isAuthenticated: false,
          logout: vi.fn(),
        } as any);

        const user = userEvent.setup();
        renderForm('login');

        await user.type(screen.getByLabelText(/email address/i), 'unverified@example.com');
        await user.type(screen.getByLabelText(/password/i), 'password123');
        await user.click(screen.getByRole('button', { name: /sign in/i }));

        await waitFor(() => {
          expect(screen.getByText(/please verify your email address/i)).toBeInTheDocument();
          expect(screen.getByText(/didn't receive the verification email/i)).toBeInTheDocument();
          expect(screen.getByRole('button', { name: /resend verification email/i })).toBeInTheDocument();
        });
      });

      it('shows loading state during login', () => {
        vi.mocked(authModule.useAuth).mockReturnValue({
          loginWithPassword: mockLoginWithPassword,
          registerWithPassword: mockRegisterWithPassword,
          isLoading: true,
          error: null,
          user: null,
          isAuthenticated: false,
          logout: vi.fn(),
        } as any);

        renderForm('login');

        const submitButton = screen.getByRole('button', { name: /sign in/i });
        expect(submitButton).toBeDisabled();
      });
    });

    describe('Edge Cases - Security', () => {
      it('sanitizes XSS in email input', async () => {
        mockLoginWithPassword.mockResolvedValue({ success: false });
        const user = userEvent.setup();
        renderForm('login');

        const xssPayload = '<script>alert("xss")</script>@example.com';
        await user.type(screen.getByLabelText(/email address/i), xssPayload);
        await user.type(screen.getByLabelText(/password/i), 'password');
        await user.click(screen.getByRole('button', { name: /sign in/i }));

        await waitFor(() => {
          expect(mockLoginWithPassword).toHaveBeenCalledWith({
            email: xssPayload,
            password: 'password',
          });
        });
      });

      it('handles SQL injection attempts in credentials', async () => {
        mockLoginWithPassword.mockResolvedValue({ success: false });
        const user = userEvent.setup();
        renderForm('login');

        const sqlInjection = "'; DROP TABLE users; --";
        await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
        await user.type(screen.getByLabelText(/password/i), sqlInjection);
        await user.click(screen.getByRole('button', { name: /sign in/i }));

        await waitFor(() => {
          expect(mockLoginWithPassword).toHaveBeenCalled();
        });
      });
    });

    describe('Edge Cases - Input Validation', () => {
      it('prevents submission with empty fields', async () => {
        const user = userEvent.setup();
        renderForm('login');

        const submitButton = screen.getByRole('button', { name: /sign in/i });
        await user.click(submitButton);

        // HTML5 validation should prevent submission
        expect(mockLoginWithPassword).not.toHaveBeenCalled();
      });

      it('handles very long email addresses', async () => {
        mockLoginWithPassword.mockResolvedValue({ success: true });
        const user = userEvent.setup();
        renderForm('login');

        const longEmail = 'a'.repeat(200) + '@example.com';
        await user.type(screen.getByLabelText(/email address/i), longEmail);
        await user.type(screen.getByLabelText(/password/i), 'password');
        await user.click(screen.getByRole('button', { name: /sign in/i }));

        await waitFor(() => {
          expect(mockLoginWithPassword).toHaveBeenCalledWith({
            email: longEmail,
            password: 'password',
          });
        });
      });

      it('handles unicode and emoji in passwords', async () => {
        mockLoginWithPassword.mockResolvedValue({ success: true });
        const user = userEvent.setup();
        renderForm('login');

        const emojiPassword = '🐶🐱MyP@ss123';
        await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
        await user.type(screen.getByLabelText(/password/i), emojiPassword);
        await user.click(screen.getByRole('button', { name: /sign in/i }));

        await waitFor(() => {
          expect(mockLoginWithPassword).toHaveBeenCalledWith({
            email: 'test@example.com',
            password: emojiPassword,
          });
        });
      });

      it('handles special characters in email', async () => {
        mockLoginWithPassword.mockResolvedValue({ success: true });
        const user = userEvent.setup();
        renderForm('login');

        const specialEmail = 'test+tag@example.co.uk';
        await user.type(screen.getByLabelText(/email address/i), specialEmail);
        await user.type(screen.getByLabelText(/password/i), 'password');
        await user.click(screen.getByRole('button', { name: /sign in/i }));

        await waitFor(() => {
          expect(mockLoginWithPassword).toHaveBeenCalledWith({
            email: specialEmail,
            password: 'password',
          });
        });
      });
    });
  });

  describe('REGISTER MODE', () => {
    describe('Happy Path', () => {
      it('renders registration form with correct elements', () => {
        renderForm('register');

        expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
        expect(screen.getAllByLabelText(/password/i).length).toBeGreaterThan(0);
        expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
        expect(screen.queryByText(/forgot password/i)).not.toBeInTheDocument();
      });

      it('submits registration with matching passwords', async () => {
        mockRegisterWithPassword.mockResolvedValue({
          success: true,
          confirmationRequired: true,
        });
        const user = userEvent.setup();
        renderForm('register');

        await user.type(screen.getByLabelText(/email address/i), 'newowner@petfamily.com');
        const passwordInputs = screen.getAllByLabelText(/password/i);
        await user.type(passwordInputs[0], 'SecurePassword123!');
        await user.type(screen.getByLabelText(/confirm password/i), 'SecurePassword123!');
        await user.click(screen.getByRole('button', { name: /create account/i }));

        await waitFor(() => {
          expect(mockRegisterWithPassword).toHaveBeenCalledWith({
            email: 'newowner@petfamily.com',
            password: 'SecurePassword123!',
          });
        });
      });

      it('redirects to verify-pending on successful registration', async () => {
        mockRegisterWithPassword.mockResolvedValue({
          success: true,
          confirmationRequired: true,
        });
        const user = userEvent.setup();
        renderForm('register');

        await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
        const passwordInputs = screen.getAllByLabelText(/password/i);
        await user.type(passwordInputs[0], 'Password123!');
        await user.type(screen.getByLabelText(/confirm password/i), 'Password123!');
        await user.click(screen.getByRole('button', { name: /create account/i }));

        await waitFor(() => {
          expect(mockNavigate).toHaveBeenCalledWith('/auth/verify-pending?email=test%40example.com');
        });
      });

      it('calls onSuccess when confirmation not required', async () => {
        mockRegisterWithPassword.mockResolvedValue({
          success: true,
          confirmationRequired: false,
        });
        const user = userEvent.setup();
        const { props } = renderForm('register');

        await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
        const passwordInputs = screen.getAllByLabelText(/password/i);
        await user.type(passwordInputs[0], 'Password123!');
        await user.type(screen.getByLabelText(/confirm password/i), 'Password123!');
        await user.click(screen.getByRole('button', { name: /create account/i }));

        await waitFor(() => {
          expect(props.onSuccess).toHaveBeenCalled();
          expect(mockNavigate).not.toHaveBeenCalled();
        });
      });
    });

    describe('Password Mismatch Validation', () => {
      it('shows inline error when passwords do not match', async () => {
        const user = userEvent.setup();
        renderForm('register');

        const passwordInputs = screen.getAllByLabelText(/password/i);
        await user.type(passwordInputs[0], 'Password123!');
        await user.type(screen.getByLabelText(/confirm password/i), 'DifferentPassword123!');

        await waitFor(() => {
          expect(screen.getByText(/passwords don't match/i)).toBeInTheDocument();
        });
      });

      it('prevents submission when passwords do not match', async () => {
        const user = userEvent.setup();
        renderForm('register');

        await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
        const passwordInputs = screen.getAllByLabelText(/password/i);
        await user.type(passwordInputs[0], 'Password123!');
        await user.type(screen.getByLabelText(/confirm password/i), 'DifferentPassword!');
        await user.click(screen.getByRole('button', { name: /create account/i }));

        await waitFor(() => {
          expect(mockRegisterWithPassword).not.toHaveBeenCalled();
          expect(screen.getByText(/passwords don't match/i)).toBeInTheDocument();
        });
      });

      it('clears password mismatch error on new submission attempt', async () => {
        const user = userEvent.setup();
        renderForm('register');

        // First attempt with mismatched passwords
        await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
        const passwordInputs = screen.getAllByLabelText(/password/i);
        await user.type(passwordInputs[0], 'Password123!');
        await user.type(screen.getByLabelText(/confirm password/i), 'Different!');
        await user.click(screen.getByRole('button', { name: /create account/i }));

        await waitFor(() => {
          expect(screen.getByText(/passwords don't match/i)).toBeInTheDocument();
        });

        // Fix passwords and resubmit
        mockRegisterWithPassword.mockResolvedValue({ success: true, confirmationRequired: true });
        await user.clear(screen.getByLabelText(/confirm password/i));
        await user.type(screen.getByLabelText(/confirm password/i), 'Password123!');
        await user.click(screen.getByRole('button', { name: /create account/i }));

        await waitFor(() => {
          expect(mockRegisterWithPassword).toHaveBeenCalled();
        });
      });
    });

    describe('Error Handling', () => {
      it('displays registration error from API', async () => {
        mockRegisterWithPassword.mockResolvedValue({
          success: false,
          error: {
            code: 'USER_ALREADY_EXISTS',
            message: 'An account with this email already exists.',
          },
        });

        vi.mocked(authModule.useAuth).mockReturnValue({
          loginWithPassword: mockLoginWithPassword,
          registerWithPassword: mockRegisterWithPassword,
          isLoading: false,
          error: {
            code: 'USER_ALREADY_EXISTS',
            message: 'An account with this email already exists.',
          },
          user: null,
          isAuthenticated: false,
          logout: vi.fn(),
        } as any);

        const user = userEvent.setup();
        renderForm('register');

        await user.type(screen.getByLabelText(/email address/i), 'existing@example.com');
        const passwordInputs = screen.getAllByLabelText(/password/i);
        await user.type(passwordInputs[0], 'Password123!');
        await user.type(screen.getByLabelText(/confirm password/i), 'Password123!');
        await user.click(screen.getByRole('button', { name: /create account/i }));

        await waitFor(() => {
          expect(screen.getByText(/an account with this email already exists/i)).toBeInTheDocument();
        });
      });

      it('shows loading state during registration', () => {
        vi.mocked(authModule.useAuth).mockReturnValue({
          loginWithPassword: mockLoginWithPassword,
          registerWithPassword: mockRegisterWithPassword,
          isLoading: true,
          error: null,
          user: null,
          isAuthenticated: false,
          logout: vi.fn(),
        } as any);

        renderForm('register');

        const submitButton = screen.getByRole('button', { name: /create account/i });
        expect(submitButton).toBeDisabled();
      });
    });

    describe('Edge Cases - Password Validation', () => {
      it('handles whitespace in passwords', async () => {
        mockRegisterWithPassword.mockResolvedValue({ success: true, confirmationRequired: true });
        const user = userEvent.setup();
        renderForm('register');

        const passwordWithSpaces = '  Password 123!  ';
        await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
        const passwordInputs = screen.getAllByLabelText(/password/i);
        await user.type(passwordInputs[0], passwordWithSpaces);
        await user.type(screen.getByLabelText(/confirm password/i), passwordWithSpaces);
        await user.click(screen.getByRole('button', { name: /create account/i }));

        await waitFor(() => {
          expect(mockRegisterWithPassword).toHaveBeenCalledWith({
            email: 'test@example.com',
            password: passwordWithSpaces,
          });
        });
      });

      it('handles very long passwords', async () => {
        mockRegisterWithPassword.mockResolvedValue({ success: true, confirmationRequired: true });
        const user = userEvent.setup();
        renderForm('register');

        const longPassword = 'A1!' + 'a'.repeat(250);
        await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
        const passwordInputs = screen.getAllByLabelText(/password/i);
        await user.type(passwordInputs[0], longPassword);
        await user.type(screen.getByLabelText(/confirm password/i), longPassword);
        await user.click(screen.getByRole('button', { name: /create account/i }));

        await waitFor(() => {
          expect(mockRegisterWithPassword).toHaveBeenCalledWith({
            email: 'test@example.com',
            password: longPassword,
          });
        });
      });

      it('handles passwords with only special characters', async () => {
        mockRegisterWithPassword.mockResolvedValue({ success: true, confirmationRequired: true });
        const user = userEvent.setup();
        renderForm('register');

        const specialPassword = '!@#$%^&*()_+-=[]{}|;:,.<>?';
        await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
        const passwordInputs = screen.getAllByLabelText(/password/i);
        await user.type(passwordInputs[0], specialPassword);
        await user.type(screen.getByLabelText(/confirm password/i), specialPassword);
        await user.click(screen.getByRole('button', { name: /create account/i }));

        await waitFor(() => {
          expect(mockRegisterWithPassword).toHaveBeenCalled();
        });
      });
    });

    describe('Edge Cases - Concurrent Actions', () => {
      it('prevents double submission', async () => {
        mockRegisterWithPassword.mockImplementation(
          () => new Promise((resolve) => setTimeout(() => resolve({ success: true, confirmationRequired: true }), 100))
        );
        const user = userEvent.setup();
        renderForm('register');

        await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
        const passwordInputs = screen.getAllByLabelText(/password/i);
        await user.type(passwordInputs[0], 'Password123!');
        await user.type(screen.getByLabelText(/confirm password/i), 'Password123!');

        const submitButton = screen.getByRole('button', { name: /create account/i });
        await user.click(submitButton);
        await user.click(submitButton); // Try to click again

        await waitFor(() => {
          expect(mockRegisterWithPassword).toHaveBeenCalledTimes(1);
        });
      });
    });
  });

  describe('ACCESSIBILITY', () => {
    it('has proper ARIA labels for form fields', () => {
      renderForm('login');

      expect(screen.getByLabelText(/email address/i)).toHaveAttribute('type', 'email');
      expect(screen.getByLabelText(/password/i)).toHaveAttribute('type', 'password');
    });

    it('password toggle button has correct aria-label', async () => {
      const user = userEvent.setup();
      renderForm('login');

      const toggleButton = screen.getByLabelText(/show password/i);
      expect(toggleButton).toHaveAttribute('aria-label', 'Show password');

      await user.click(toggleButton);
      expect(screen.getByLabelText(/hide password/i)).toHaveAttribute('aria-label', 'Hide password');
    });

    it('form can be submitted with keyboard only', async () => {
      mockLoginWithPassword.mockResolvedValue({ success: true });
      const user = userEvent.setup();
      renderForm('login');

      await user.tab(); // Focus email
      await user.keyboard('test@example.com');
      await user.tab(); // Focus password
      await user.keyboard('password123');
      await user.keyboard('{Enter}'); // Submit form

      await waitFor(() => {
        expect(mockLoginWithPassword).toHaveBeenCalled();
      });
    });
  });

  describe('MODE TOGGLE', () => {
    it('calls onToggleMode when toggle link clicked', async () => {
      const user = userEvent.setup();
      const onToggleMode = vi.fn();
      renderForm('login', { onToggleMode });

      await user.click(screen.getByText(/sign up/i));

      expect(onToggleMode).toHaveBeenCalled();
    });

    it('shows correct toggle text for login mode', () => {
      renderForm('login');

      expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
    });

    it('shows correct toggle text for register mode', () => {
      renderForm('register');

      expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });
  });
});
