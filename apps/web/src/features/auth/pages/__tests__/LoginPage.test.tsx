// LoginPage component tests

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from '@/test/utils/test-utils';
import { LoginPage } from '../LoginPage';
import { mockUseAuth } from '@/test/mocks/auth';

// Mock the auth hook
vi.mock('@petforce/auth', () => ({
  useAuth: () => mockUseAuth,
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
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.isLoading = false;
    mockUseAuth.error = null;
  });

  it('renders login form', () => {
    renderWithRouter(<LoginPage />);

    expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
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
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockUseAuth.loginWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('disables submit button when fields are empty', () => {
    renderWithRouter(<LoginPage />);

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    expect(submitButton).toBeDisabled();
  });

  it('enables submit button when fields are filled', async () => {
    const user = userEvent.setup();
    renderWithRouter(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');

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

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    expect(submitButton).toBeDisabled();
  });

  it('navigates to register page when sign up is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<LoginPage />);

    await user.click(screen.getByText(/sign up/i));

    expect(mockNavigate).toHaveBeenCalledWith('/auth/register');
  });

  it('navigates to forgot password page', async () => {
    const user = userEvent.setup();
    renderWithRouter(<LoginPage />);

    await user.click(screen.getByText(/forgot password/i));

    expect(mockNavigate).toHaveBeenCalledWith('/auth/forgot-password');
  });
});
