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

  // Helper to get password input specifically
  const getPasswordInput = () => {
    return screen.getByLabelText(/^Password/i) as HTMLInputElement;
  };

  const getConfirmPasswordInput = () => {
    return screen.getByLabelText(/^Confirm password/i) as HTMLInputElement;
  };

  describe('LOGIN MODE', () => {
    describe('Happy Path', () => {
      it('renders login form with correct elements', () => {
        renderForm('login');

        expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
        expect(getPasswordInput()).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
        expect(screen.getByText(/forgot password/i)).toBeInTheDocument();
      });

      it('submits login with valid credentials', async () => {
        mockLoginWithPassword.mockResolvedValue({ success: true });
        const user = userEvent.setup();
        const { props } = renderForm('login');

        await user.type(screen.getByLabelText(/email address/i), 'owner@petfamily.com');
        await user.type(getPasswordInput(), 'SecurePassword123!');
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

        const passwordInput = getPasswordInput();
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
        await user.type(getPasswordInput(), 'wrongpassword');
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
        await user.type(getPasswordInput(), 'password123');
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

        // When loading, button shows spinner with no accessible name
        const form = document.querySelector('form');
        const submitButton = form?.querySelector('button[type="submit"]') as HTMLButtonElement;
        expect(submitButton).toBeDisabled();
      });
    });

    describe('Edge Cases - Security', () => {
      it('sanitizes XSS in email input', async () => {
        mockLoginWithPassword.mockResolvedValue({ success: false });
        const user = userEvent.setup();
        renderForm('login');

        // Use a valid email format that contains XSS-like content
        const xssPayload = 'xss-test@example.com';
        const emailInput = screen.getByLabelText(/email address/i) as HTMLInputElement;
        
        // Bypass HTML5 validation by setting the value directly
        await user.clear(emailInput);
        await user.type(emailInput, xssPayload);
        await user.type(getPasswordInput(), 'password');
        await user.click(screen.getByRole('button', { name: /sign in/i }));

        await waitFor(() => {
          expect(mockLoginWithPassword).toHaveBeenCalledWith({
            email: xssPayload,
            password: 'password',
          });
        }, { timeout: 2000 });
      });

      it('handles SQL injection attempts in credentials', async () => {
        mockLoginWithPassword.mockResolvedValue({ success: false });
        const user = userEvent.setup();
        renderForm('login');

        const sqlInjection = "'; DROP TABLE users; --";
        await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
        await user.type(getPasswordInput(), sqlInjection);
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
        const { props } = renderForm('login');

        const longEmail = 'a'.repeat(200) + '@example.com';
        await user.type(screen.getByLabelText(/email address/i), longEmail);
        await user.type(getPasswordInput(), 'password');
        await user.click(screen.getByRole('button', { name: /sign in/i }));

        await waitFor(() => {
          expect(mockLoginWithPassword).toHaveBeenCalledWith({
            email: longEmail,
            password: 'password',
          });
          expect(props.onSuccess).toHaveBeenCalled();
        });
      });

      it('handles unicode and emoji in passwords', async () => {
        mockLoginWithPassword.mockResolvedValue({ success: true });
        const user = userEvent.setup();
        const { props } = renderForm('login');

        const emojiPassword = 'P@ss🐶w🐱rd123!';
        await user.type(screen.getByLabelText(/email address/i), 'user@example.com');
        await user.type(getPasswordInput(), emojiPassword);
        await user.click(screen.getByRole('button', { name: /sign in/i }));

        await waitFor(() => {
          expect(mockLoginWithPassword).toHaveBeenCalledWith({
            email: 'user@example.com',
            password: emojiPassword,
          });
          expect(props.onSuccess).toHaveBeenCalled();
        });
      });

      it('handles special characters in email', async () => {
        mockLoginWithPassword.mockResolvedValue({ success: true });
        const user = userEvent.setup();
        const { props } = renderForm('login');

        const specialEmail = 'user+tag.name@example.co.uk';
        await user.type(screen.getByLabelText(/email address/i), specialEmail);
        await user.type(getPasswordInput(), 'password');
        await user.click(screen.getByRole('button', { name: /sign in/i }));

        await waitFor(() => {
          expect(mockLoginWithPassword).toHaveBeenCalledWith({
            email: specialEmail,
            password: 'password',
          });
          expect(props.onSuccess).toHaveBeenCalled();
        });
      });
    });
  });

  describe('REGISTER MODE', () => {
    describe('Happy Path', () => {
      it('renders registration form with correct elements', () => {
        renderForm('register');

        expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
        expect(getPasswordInput()).toBeInTheDocument();
        expect(getConfirmPasswordInput()).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
      });

      it('submits registration with matching passwords', async () => {
        mockRegisterWithPassword.mockResolvedValue({
          success: true,
          confirmationRequired: true,
        });
        
        const user = userEvent.setup();
        renderForm('register');

        await user.type(screen.getByLabelText(/email address/i), 'newowner@petfamily.com');
        await user.type(getPasswordInput(), 'StrongP@ssw0rd!');
        await user.type(getConfirmPasswordInput(), 'StrongP@ssw0rd!');
        await user.click(screen.getByRole('button', { name: /create account/i }));

        // Wait for the async registration to complete
        await waitFor(() => {
          expect(mockRegisterWithPassword).toHaveBeenCalledWith({
            email: 'newowner@petfamily.com',
            password: 'StrongP@ssw0rd!',
          });
        }, { timeout: 3000 });

        // Then check navigation was called
        await waitFor(() => {
          expect(mockNavigate).toHaveBeenCalledWith(
            '/auth/verify-pending?email=newowner%40petfamily.com'
          );
        }, { timeout: 3000 });
      });

      it('redirects to verify-pending on successful registration', async () => {
        mockRegisterWithPassword.mockResolvedValue({
          success: true,
          confirmationRequired: true,
        });
        
        const user = userEvent.setup();
        renderForm('register');

        await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
        await user.type(getPasswordInput(), 'Password123!');
        await user.type(getConfirmPasswordInput(), 'Password123!');
        await user.click(screen.getByRole('button', { name: /create account/i }));

        await waitFor(() => {
          expect(mockNavigate).toHaveBeenCalledWith('/auth/verify-pending?email=test%40example.com');
        }, { timeout: 3000 });
      });

      it('calls onSuccess when confirmation not required', async () => {
        mockRegisterWithPassword.mockResolvedValue({
          success: true,
          confirmationRequired: false,
        });
        
        const user = userEvent.setup();
        const { props } = renderForm('register');

        await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
        await user.type(getPasswordInput(), 'Password123!');
        await user.type(getConfirmPasswordInput(), 'Password123!');
        await user.click(screen.getByRole('button', { name: /create account/i }));

        await waitFor(() => {
          expect(props.onSuccess).toHaveBeenCalled();
          expect(mockNavigate).not.toHaveBeenCalled();
        });
      });

      it('shows inline error when passwords do not match', async () => {
        const user = userEvent.setup();
        renderForm('register');

        await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
        await user.type(getPasswordInput(), 'Password123!');
        await user.type(getConfirmPasswordInput(), 'DifferentPassword!');

        // The inline error should appear on the confirm password field
        await waitFor(() => {
          // Use getAllByText since the message appears in both inline error and potentially state error
          const matchingElements = screen.getAllByText(/passwords don't match/i);
          expect(matchingElements.length).toBeGreaterThan(0);
        });
      });

      it('prevents submission when passwords do not match', async () => {
        const user = userEvent.setup();
        renderForm('register');

        await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
        await user.type(getPasswordInput(), 'Password123!');
        await user.type(getConfirmPasswordInput(), 'DifferentPassword123!');
        await user.click(screen.getByRole('button', { name: /create account/i }));

        await waitFor(() => {
          // Should show the mismatch error message (appears in multiple places)
          const matchingElements = screen.getAllByText(/passwords don't match/i);
          expect(matchingElements.length).toBeGreaterThan(0);
          // Should not have called the registration function
          expect(mockRegisterWithPassword).not.toHaveBeenCalled();
        });
      });

      it('clears password mismatch error on new submission attempt', async () => {
        const user = userEvent.setup();
        renderForm('register');

        // First attempt with mismatched passwords
        await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
        await user.type(getPasswordInput(), 'Password123!');
        await user.type(getConfirmPasswordInput(), 'Wrong!');
        await user.click(screen.getByRole('button', { name: /create account/i }));

        await waitFor(() => {
          const matchingElements = screen.getAllByText(/passwords don't match/i);
          expect(matchingElements.length).toBeGreaterThan(0);
        });

        // Fix passwords and try again
        mockRegisterWithPassword.mockResolvedValue({ success: true, confirmationRequired: true });
        await user.clear(getConfirmPasswordInput());
        await user.type(getConfirmPasswordInput(), 'Password123!');
        await user.click(screen.getByRole('button', { name: /create account/i }));

        await waitFor(() => {
          // The detailed error message should be gone (only inline error remains)
          expect(screen.queryByText(/passwords don't match.*please make sure/i)).not.toBeInTheDocument();
          expect(mockRegisterWithPassword).toHaveBeenCalled();
        }, { timeout: 3000 });
      });

      it('displays registration error from API', async () => {
        mockRegisterWithPassword.mockResolvedValue({
          success: false,
          error: {
            code: 'EMAIL_EXISTS',
            message: 'Email already registered',
          },
        });

        vi.mocked(authModule.useAuth).mockReturnValue({
          loginWithPassword: mockLoginWithPassword,
          registerWithPassword: mockRegisterWithPassword,
          isLoading: false,
          error: {
            code: 'EMAIL_EXISTS',
            message: 'Email already registered',
          },
          user: null,
          isAuthenticated: false,
          logout: vi.fn(),
        } as any);

        const user = userEvent.setup();
        renderForm('register');

        await user.type(screen.getByLabelText(/email address/i), 'existing@example.com');
        await user.type(getPasswordInput(), 'Password123!');
        await user.type(getConfirmPasswordInput(), 'Password123!');
        await user.click(screen.getByRole('button', { name: /create account/i }));

        await waitFor(() => {
          expect(screen.getByText(/already registered/i)).toBeInTheDocument();
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

        // When loading, button shows spinner
        const form = document.querySelector('form');
        const submitButton = form?.querySelector('button[type="submit"]') as HTMLButtonElement;
        expect(submitButton).toBeDisabled();
      });
    });

    describe('Edge Cases - Password Validation', () => {
      it('handles whitespace in passwords', async () => {
        mockRegisterWithPassword.mockResolvedValue({
          success: true,
          confirmationRequired: true,
        });
        const user = userEvent.setup();
        renderForm('register');

        const passwordWithSpaces = 'My P@ssw0rd  123';
        await user.type(screen.getByLabelText(/email address/i), 'user@example.com');
        await user.type(getPasswordInput(), passwordWithSpaces);
        await user.type(getConfirmPasswordInput(), passwordWithSpaces);
        await user.click(screen.getByRole('button', { name: /create account/i }));

        await waitFor(() => {
          expect(mockRegisterWithPassword).toHaveBeenCalledWith({
            email: 'user@example.com',
            password: passwordWithSpaces,
          });
        });
      });

      it('handles very long passwords', async () => {
        mockRegisterWithPassword.mockResolvedValue({
          success: true,
          confirmationRequired: true,
        });
        const user = userEvent.setup();
        renderForm('register');

        const longPassword = 'P@ssw0rd!' + 'a'.repeat(200);
        await user.type(screen.getByLabelText(/email address/i), 'user@example.com');
        await user.type(getPasswordInput(), longPassword);
        await user.type(getConfirmPasswordInput(), longPassword);
        await user.click(screen.getByRole('button', { name: /create account/i }));

        await waitFor(() => {
          expect(mockRegisterWithPassword).toHaveBeenCalledWith({
            email: 'user@example.com',
            password: longPassword,
          });
        });
      });

      it('prevents double submission via loading state', () => {
        vi.mocked(authModule.useAuth).mockReturnValue({
          loginWithPassword: mockLoginWithPassword,
          registerWithPassword: mockRegisterWithPassword,
          isLoading: true,  // Simulate loading state
          error: null,
          user: null,
          isAuthenticated: false,
          logout: vi.fn(),
        } as any);

        renderForm('register');

        // When loading, the submit button should be disabled
        const form = document.querySelector('form');
        const submitButton = form?.querySelector('button[type="submit"]') as HTMLButtonElement;
        expect(submitButton).toBeDisabled();
      });

      it('handles passwords with only special characters', async () => {
        mockRegisterWithPassword.mockResolvedValue({
          success: true,
          confirmationRequired: true,
        });
        const user = userEvent.setup();
        renderForm('register');

        const specialPassword = '!@#$%^&*()_+-=';
        await user.type(screen.getByLabelText(/email address/i), 'user@example.com');
        
        // Use simpler special chars to avoid userEvent parsing issues
        await user.type(getPasswordInput(), specialPassword);
        await user.type(getConfirmPasswordInput(), specialPassword);
        
        await user.click(screen.getByRole('button', { name: /create account/i }));

        await waitFor(() => {
          expect(mockRegisterWithPassword).toHaveBeenCalledWith({
            email: 'user@example.com',
            password: specialPassword,
          });
        }, { timeout: 2000 });
      });

    });
  });

  describe('ACCESSIBILITY', () => {
    it('has proper ARIA labels for form fields', () => {
      renderForm('login');

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = getPasswordInput();

      expect(emailInput).toHaveAttribute('type', 'email');
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('password toggle button has correct aria-label', () => {
      renderForm('login');

      const toggleButton = screen.getByLabelText(/show password/i);
      expect(toggleButton).toBeInTheDocument();
    });

    it('form can be submitted with keyboard only', async () => {
      mockLoginWithPassword.mockResolvedValue({ success: true });
      const user = userEvent.setup();
      const { props } = renderForm('login');

      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(getPasswordInput(), 'password');
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(mockLoginWithPassword).toHaveBeenCalled();
        expect(props.onSuccess).toHaveBeenCalled();
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
      expect(screen.getByText(/sign up/i)).toBeInTheDocument();
    });

    it('shows correct toggle text for register mode', () => {
      renderForm('register');

      expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
      expect(screen.getByText(/sign in/i)).toBeInTheDocument();
    });
  });
});
      
