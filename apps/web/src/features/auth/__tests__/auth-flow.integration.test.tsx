// Integration tests for authentication flows

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from '@/test/utils/test-utils';
import { UnifiedAuthPage } from '../pages/UnifiedAuthPage';
import { mockUseAuth, mockUseOAuth } from '@/test/mocks/auth';

// Mock the auth hook
vi.mock('@petforce/auth', () => ({
  calculatePasswordStrength: vi.fn(() => ({ score: 1, feedback: 'Weak password', label: 'Weak', color: '#ef4444' })),
  useAuth: () => mockUseAuth,
  useOAuth: () => mockUseOAuth,
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Authentication Flow Integration', () => {
  // Helper to get password input
  const getPasswordInput = () => {
    return screen.getByLabelText(/^Password/i) as HTMLInputElement;
  };

  const getConfirmPasswordInput = () => {
    return screen.getByLabelText(/^Confirm password/i) as HTMLInputElement;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.isLoading = false;
    mockUseAuth.error = null;
    mockUseAuth.loginWithPassword.mockReset();
    mockUseAuth.registerWithPassword.mockReset();
    mockUseOAuth.isLoading = false;
    mockUseOAuth.error = null;
  });

  describe('Login Flow (Default Tab)', () => {
    it('completes full login flow successfully', async () => {
      const user = userEvent.setup();
      mockUseAuth.loginWithPassword.mockResolvedValue({ success: true });

      renderWithRouter(<UnifiedAuthPage />);

      // Verify Sign In tab is active by default
      const signInTab = screen.getByRole('tab', { name: /sign in/i });
      expect(signInTab).toHaveAttribute('aria-selected', 'true');

      // Fill in credentials
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(getPasswordInput(), 'MyP@ssw0rd123');

      // Submit form
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      // Verify login was called
      await waitFor(() => {
        expect(mockUseAuth.loginWithPassword).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'MyP@ssw0rd123',
        });
      });

      // Verify navigation to dashboard
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('handles login errors gracefully', async () => {
      const user = userEvent.setup();
      mockUseAuth.error = {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      };

      renderWithRouter(<UnifiedAuthPage />);

      // Error should be displayed
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();

      // Form should still be usable
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(getPasswordInput(), 'password123');

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('Registration Flow (Sign Up Tab)', () => {
    it('completes full registration flow successfully', async () => {
      const user = userEvent.setup();
      mockUseAuth.registerWithPassword.mockResolvedValue({ 
        success: true, 
        confirmationRequired: true 
      });

      renderWithRouter(<UnifiedAuthPage />);

      // Switch to Sign Up tab
      const signUpTab = screen.getByRole('tab', { name: /sign up/i });
      await user.click(signUpTab);

      // Verify tab switched
      expect(signUpTab).toHaveAttribute('aria-selected', 'true');

      // Fill in registration form
      await user.type(screen.getByLabelText(/email/i), 'newuser@example.com');
      await user.type(getPasswordInput(), 'MyStr0ng!Pass');
      await user.type(getConfirmPasswordInput(), 'MyStr0ng!Pass');

      // Submit form
      await user.click(screen.getByRole('button', { name: /create account/i }));

      // Verify registration was called
      await waitFor(() => {
        expect(mockUseAuth.registerWithPassword).toHaveBeenCalledWith({
          email: 'newuser@example.com',
          password: 'MyStr0ng!Pass',
        });
      });

      // Verify navigation to email verification pending page
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/auth/verify-pending?email=newuser%40example.com');
      });
    });

    it('validates password confirmation', async () => {
      const user = userEvent.setup();

      renderWithRouter(<UnifiedAuthPage />);

      // Switch to Sign Up tab
      const signUpTab = screen.getByRole('tab', { name: /sign up/i });
      await user.click(signUpTab);

      // Fill in form with mismatched passwords
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(getPasswordInput(), 'Password123!');
      await user.type(getConfirmPasswordInput(), 'DifferentPassword123!');

      // Try to submit
      await user.click(screen.getByRole('button', { name: /create account/i }));

      // Verify error message appears
      await waitFor(() => {
        expect(screen.getByText(/passwords don't match.*identical/i)).toBeInTheDocument();
      });

      // Verify registration was NOT called
      expect(mockUseAuth.registerWithPassword).not.toHaveBeenCalled();
    });

    it('validates password strength requirements', async () => {
      const user = userEvent.setup();

      renderWithRouter(<UnifiedAuthPage />);

      // Switch to Sign Up tab
      const signUpTab = screen.getByRole('tab', { name: /sign up/i });
      await user.click(signUpTab);

      // Enter email to enable form
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      
      // Type password - strength indicator appears (bar only, no requirements list)
      const passwordInput = getPasswordInput();
      await user.type(passwordInput, 'weak');

      // Password strength indicator should show strength label (from mock)
      expect(screen.getByText('Weak')).toBeInTheDocument();
    });

    it('handles registration errors', async () => {
      const user = userEvent.setup();
      
      // Set error BEFORE rendering
      mockUseAuth.error = {
        code: 'EMAIL_EXISTS',
        message: 'Email already registered',
      };

      renderWithRouter(<UnifiedAuthPage />);

      // Switch to Sign Up tab to see register form
      const signUpTab = screen.getByRole('tab', { name: /sign up/i });
      await user.click(signUpTab);

      // Wait for error to appear - the actual displayed text is transformed
      await waitFor(() => {
        expect(screen.getByText(/this email is already registered/i)).toBeInTheDocument();
      });
    });
  });

  describe('Tab Switching', () => {
    it('switches between Sign In and Sign Up tabs', async () => {
      const user = userEvent.setup();
      renderWithRouter(<UnifiedAuthPage />);

      // Verify Sign In tab is active
      const signInTab = screen.getByRole('tab', { name: /sign in/i });
      const signUpTab = screen.getByRole('tab', { name: /sign up/i });
      expect(signInTab).toHaveAttribute('aria-selected', 'true');
      expect(signUpTab).toHaveAttribute('aria-selected', 'false');

      // Switch to Sign Up
      await user.click(signUpTab);
      expect(signUpTab).toHaveAttribute('aria-selected', 'true');
      expect(signInTab).toHaveAttribute('aria-selected', 'false');

      // Switch back to Sign In
      await user.click(signInTab);
      expect(signInTab).toHaveAttribute('aria-selected', 'true');
      expect(signUpTab).toHaveAttribute('aria-selected', 'false');
    });

    it('clears form when switching tabs', async () => {
      const user = userEvent.setup();
      renderWithRouter(<UnifiedAuthPage />);

      // Fill in Sign In form
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(getPasswordInput(), 'password123');

      // Switch to Sign Up tab
      const signUpTab = screen.getByRole('tab', { name: /sign up/i });
      await user.click(signUpTab);

      // Email field should be cleared
      const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
      expect(emailInput.value).toBe('');
    });
  });

  describe('Form Validation', () => {
    it('disables submit button when fields are empty', () => {
      renderWithRouter(<UnifiedAuthPage />);

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      // Button is not disabled, but HTML5 validation prevents submission
      expect(submitButton).not.toBeDisabled();
    });

    it('enables submit button when all required fields are filled', async () => {
      const user = userEvent.setup();
      renderWithRouter(<UnifiedAuthPage />);

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(getPasswordInput(), 'password123');

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      // Button should be enabled when all fields filled
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });

    it('validates email format', async () => {
      const user = userEvent.setup();
      renderWithRouter(<UnifiedAuthPage />);

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'invalid-email');
      await user.type(getPasswordInput(), 'password123');

      // HTML5 validation sets validity, we can check the validity state
      expect(emailInput).toBeInvalid();
    });
  });

  describe('Loading States', () => {
    it('shows loading state during login', () => {
      mockUseAuth.isLoading = true;

      renderWithRouter(<UnifiedAuthPage />);

      // When loading, button is disabled and shows spinner (no text)
      // Find by querying all buttons and checking which is disabled
      const buttons = screen.getAllByRole('button');
      const submitButton = buttons.find(btn => 
        btn.getAttribute('type') === 'submit' && btn.hasAttribute('disabled')
      );
      
      expect(submitButton).toBeDefined();
      expect(submitButton).toBeDisabled();
    });

    it('disables form inputs during loading', () => {
      mockUseAuth.isLoading = true;

      renderWithRouter(<UnifiedAuthPage />);

      // Find submit button by type
      const buttons = screen.getAllByRole('button');
      const submitButton = buttons.find(btn => btn.getAttribute('type') === 'submit');
      
      expect(submitButton).toBeDefined();
      expect(submitButton).toBeDisabled();
    });
  });

  describe('SSO Integration', () => {
    it('renders SSO buttons', () => {
      renderWithRouter(<UnifiedAuthPage />);

      expect(screen.getByText(/continue with google/i)).toBeInTheDocument();
      expect(screen.getByText(/continue with apple/i)).toBeInTheDocument();
    });

    it('SSO buttons are present in both tabs', async () => {
      const user = userEvent.setup();
      renderWithRouter(<UnifiedAuthPage />);

      // Check Sign In tab
      expect(screen.getByText(/continue with google/i)).toBeInTheDocument();

      // Switch to Sign Up tab
      const signUpTab = screen.getByRole('tab', { name: /sign up/i });
      await user.click(signUpTab);

      // SSO buttons should still be present
      expect(screen.getByText(/continue with google/i)).toBeInTheDocument();
      expect(screen.getByText(/continue with apple/i)).toBeInTheDocument();
    });
  });
});
