// LoginPage component tests

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from '@/test/utils/test-utils';
import { LoginPage } from '../LoginPage';
import { mockUseAuth, mockUseOAuth } from '@/test/mocks/auth';

// Mock the auth hook
vi.mock('@petforce/auth', () => ({
  useAuth: () => mockUseAuth,
  useOAuth: () => mockUseOAuth,
}));

// Mock react-router-dom navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('LoginPage', () => {
  // Helper to get password input
  const getPasswordInput = () => {
    return screen.getByLabelText(/^Password/i) as HTMLInputElement;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.isLoading = false;
    mockUseAuth.error = null;
    mockUseOAuth.isLoading = false;
    mockUseOAuth.error = null;
  });

  it('renders login form', () => {
    renderWithRouter(<LoginPage />);

    expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(getPasswordInput()).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('renders SSO buttons', () => {
    renderWithRouter(<LoginPage />);

    expect(screen.getByText(/continue with google/i)).toBeInTheDocument();
    expect(screen.getByText(/continue with apple/i)).toBeInTheDocument();
  });

  it('has link to forgot password', () => {
    renderWithRouter(<LoginPage />);

    expect(screen.getByText(/forgot password/i)).toBeInTheDocument();
  });

  it('has link to sign up', () => {
    renderWithRouter(<LoginPage />);

    expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
    expect(screen.getByText(/sign up/i)).toBeInTheDocument();
  });

  it('submits form with email and password', async () => {
    const user = userEvent.setup();
    mockUseAuth.loginWithPassword.mockResolvedValue({ success: true });

    renderWithRouter(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(getPasswordInput(), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockUseAuth.loginWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('prevents submission with empty fields', async () => {
    const user = userEvent.setup();
    renderWithRouter(<LoginPage />);

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    // Button is not visually disabled, but form validation prevents submission
    await user.click(submitButton);

    // The form should not have called loginWithPassword due to HTML5 validation
    expect(mockUseAuth.loginWithPassword).not.toHaveBeenCalled();
  });

  it('enables submit button when fields are filled', async () => {
    const user = userEvent.setup();
    renderWithRouter(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(getPasswordInput(), 'password123');

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    expect(submitButton).not.toBeDisabled();
  });

  it('displays error message when login fails', () => {
    mockUseAuth.error = { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' };

    renderWithRouter(<LoginPage />);

    expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
  });

  it('shows loading state during submission', () => {
    mockUseAuth.isLoading = true;

    renderWithRouter(<LoginPage />);

    // When loading, the button shows a spinner and has no accessible name
    const form = document.querySelector('form');
    const submitButton = form?.querySelector('button[type="submit"]') as HTMLButtonElement;
    
    expect(submitButton).toBeDefined();
    expect(submitButton).toBeDisabled();
  });

  it('navigates to register page when sign up is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<LoginPage />);

    const signUpLink = screen.getByText(/sign up/i);
    await user.click(signUpLink);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/auth/register');
    });
  });

  it('navigates to forgot password page', async () => {
    const user = userEvent.setup();
    renderWithRouter(<LoginPage />);

    const forgotPasswordLink = screen.getByText(/forgot password/i);
    await user.click(forgotPasswordLink);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/auth/forgot-password');
    });
  });
});
