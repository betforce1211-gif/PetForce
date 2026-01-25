// Integration tests for authentication flows

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from '@/test/utils/test-utils';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { mockUseAuth } from '@/test/mocks/auth';

// Mock the auth hook
vi.mock('@petforce/auth', () => ({
  useAuth: () => mockUseAuth,
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
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.isLoading = false;
    mockUseAuth.error = null;
    mockUseAuth.loginWithPassword.mockReset();
    mockUseAuth.registerWithPassword.mockReset();
  });

  describe('Login Flow', () => {
    it('completes full login flow successfully', async () => {
      const user = userEvent.setup();
      mockUseAuth.loginWithPassword.mockResolvedValue({ success: true });

      renderWithRouter(<LoginPage />);

      // Fill in credentials
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'MyP@ssw0rd123');

      // Submit form
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      // Verify login was called
      await waitFor(() => {
        expect(mockUseAuth.loginWithPassword).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'MyP@ssw0rd123',
        });
      });
    });

    it('handles login errors gracefully', async () => {
      const user = userEvent.setup();
      mockUseAuth.loginWithPassword.mockResolvedValue({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
      });

      renderWithRouter(<LoginPage />);

      await user.type(screen.getByLabelText(/email/i), 'wrong@example.com');
      await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      // Error should be displayed (mocked in the component)
      expect(mockUseAuth.loginWithPassword).toHaveBeenCalled();
    });
  });

  describe('Registration Flow', () => {
    it('completes full registration flow successfully', async () => {
      const user = userEvent.setup();
      mockUseAuth.registerWithPassword.mockResolvedValue({ success: true });

      renderWithRouter(<RegisterPage />);

      // Fill in registration form
      await user.type(screen.getByLabelText(/email/i), 'newuser@example.com');

      const passwordFields = screen.getAllByLabelText(/password/i);
      await user.type(passwordFields[0], 'MyP@ssw0rd123');
      await user.type(screen.getByLabelText(/confirm password/i), 'MyP@ssw0rd123');

      // Submit form
      await user.click(screen.getByRole('button', { name: /create account/i }));

      // Verify registration was called
      await waitFor(() => {
        expect(mockUseAuth.registerWithPassword).toHaveBeenCalledWith({
          email: 'newuser@example.com',
          password: 'MyP@ssw0rd123',
        });
      });

      // Verify navigation to verify email page
      expect(mockNavigate).toHaveBeenCalledWith('/auth/verify-email');
    });

    it('validates password confirmation', async () => {
      const user = userEvent.setup();
      renderWithRouter(<RegisterPage />);

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');

      const passwordFields = screen.getAllByLabelText(/password/i);
      await user.type(passwordFields[0], 'MyP@ssw0rd123');
      await user.type(screen.getByLabelText(/confirm password/i), 'DifferentPassword');

      // Error message should appear
      await waitFor(() => {
        expect(screen.getByText(/passwords don't match/i)).toBeInTheDocument();
      });

      // Submit button should be disabled
      const submitButton = screen.getByRole('button', { name: /create account/i });
      expect(submitButton).toBeDisabled();
    });

    it('shows password strength indicator', async () => {
      const user = userEvent.setup();
      renderWithRouter(<RegisterPage />);

      const passwordFields = screen.getAllByLabelText(/password/i);

      // Weak password
      await user.type(passwordFields[0], 'weak');
      expect(screen.getByText(/password strength/i)).toBeInTheDocument();

      // Strong password
      await user.clear(passwordFields[0]);
      await user.type(passwordFields[0], 'MyP@ssw0rd123!');

      await waitFor(() => {
        expect(screen.getByText(/strong/i)).toBeInTheDocument();
      });
    });
  });

  describe('Navigation Between Auth Pages', () => {
    it('navigates from login to register', async () => {
      const user = userEvent.setup();
      renderWithRouter(<LoginPage />);

      await user.click(screen.getByText(/sign up/i));

      expect(mockNavigate).toHaveBeenCalledWith('/auth/register');
    });

    it('navigates from register to login', async () => {
      const user = userEvent.setup();
      renderWithRouter(<RegisterPage />);

      await user.click(screen.getByText(/sign in/i));

      expect(mockNavigate).toHaveBeenCalledWith('/auth/login');
    });
  });
});
