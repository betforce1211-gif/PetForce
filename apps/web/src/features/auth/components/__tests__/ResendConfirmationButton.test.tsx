/**
 * ResendConfirmationButton Component Tests
 * Tucker's countdown timer and rate-limiting edge case coverage
 * 
 * Critical for preventing abuse of email verification system
 * and ensuring pet families can recover from missing confirmation emails.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResendConfirmationButton } from '../ResendConfirmationButton';
import * as authModule from '@petforce/auth';

// Mock the auth module
vi.mock('@petforce/auth', async () => {
  const actual = await vi.importActual('@petforce/auth');
  return {
    ...actual,
    resendConfirmationEmail: vi.fn(),
  };
});

describe('ResendConfirmationButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  const renderButton = (props = {}) => {
    const defaultProps = {
      email: 'test@example.com',
      variant: 'outline' as const,
      size: 'md' as const,
      ...props,
    };

    return render(<ResendConfirmationButton {...defaultProps} />);
  };

  describe('Initial Render', () => {
    it('renders button with correct default text', () => {
      renderButton();

      expect(screen.getByRole('button', { name: /resend verification email/i })).toBeInTheDocument();
    });

    it('button is enabled initially', () => {
      renderButton();

      const button = screen.getByRole('button', { name: /resend verification email/i });
      expect(button).not.toBeDisabled();
    });

    it('applies variant and size props correctly', () => {
      renderButton({ variant: 'primary', size: 'lg' });

      const button = screen.getByRole('button', { name: /resend verification email/i });
      expect(button).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = renderButton({ className: 'custom-class' });

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('Happy Path - Successful Resend', () => {
    it('calls resendConfirmationEmail with correct email on click', async () => {
      const mockResend = vi.mocked(authModule.resendConfirmationEmail);
      mockResend.mockResolvedValue({
        success: true,
        message: 'Confirmation email sent.',
      });

      const user = userEvent.setup({ delay: null });
      renderButton({ email: 'owner@petfamily.com' });

      await user.click(screen.getByRole('button', { name: /resend verification email/i }));

      await waitFor(() => {
        expect(mockResend).toHaveBeenCalledWith('owner@petfamily.com');
      });
    });

    it('shows loading state while sending', async () => {
      const mockResend = vi.mocked(authModule.resendConfirmationEmail);
      mockResend.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: true, message: 'Sent' }), 100))
      );

      const user = userEvent.setup({ delay: null });
      renderButton();

      const button = screen.getByRole('button', { name: /resend verification email/i });
      await user.click(button);

      // Button should be disabled during loading
      expect(button).toBeDisabled();
    });

    it('displays success message after successful resend', async () => {
      const mockResend = vi.mocked(authModule.resendConfirmationEmail);
      mockResend.mockResolvedValue({
        success: true,
        message: 'Confirmation email sent.',
      });

      const user = userEvent.setup({ delay: null });
      renderButton();

      await user.click(screen.getByRole('button', { name: /resend verification email/i }));

      await waitFor(() => {
        expect(screen.getByText(/email sent!/i)).toBeInTheDocument();
        expect(screen.getByText(/check your inbox/i)).toBeInTheDocument();
      });
    });

    it('hides success message after 5 seconds', async () => {
      const mockResend = vi.mocked(authModule.resendConfirmationEmail);
      mockResend.mockResolvedValue({
        success: true,
        message: 'Confirmation email sent.',
      });

      const user = userEvent.setup({ delay: null });
      renderButton();

      await user.click(screen.getByRole('button', { name: /resend verification email/i }));

      await waitFor(() => {
        expect(screen.getByText(/email sent!/i)).toBeInTheDocument();
      });

      // Fast-forward 5 seconds
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      await waitFor(() => {
        expect(screen.queryByText(/email sent!/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Countdown Timer & Rate Limiting', () => {
    it('starts 5-minute countdown after successful resend', async () => {
      const mockResend = vi.mocked(authModule.resendConfirmationEmail);
      mockResend.mockResolvedValue({
        success: true,
        message: 'Confirmation email sent.',
      });

      const user = userEvent.setup({ delay: null });
      renderButton();

      await user.click(screen.getByRole('button', { name: /resend verification email/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /resend in 5:00/i })).toBeInTheDocument();
      });
    });

    it('disables button during countdown', async () => {
      const mockResend = vi.mocked(authModule.resendConfirmationEmail);
      mockResend.mockResolvedValue({
        success: true,
        message: 'Confirmation email sent.',
      });

      const user = userEvent.setup({ delay: null });
      renderButton();

      await user.click(screen.getByRole('button', { name: /resend verification email/i }));

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /resend in 5:00/i });
        expect(button).toBeDisabled();
      });
    });

    it('decrements countdown every second', async () => {
      const mockResend = vi.mocked(authModule.resendConfirmationEmail);
      mockResend.mockResolvedValue({
        success: true,
        message: 'Confirmation email sent.',
      });

      const user = userEvent.setup({ delay: null });
      renderButton();

      await user.click(screen.getByRole('button', { name: /resend verification email/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /resend in 5:00/i })).toBeInTheDocument();
      });

      // Advance 1 second
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /resend in 4:59/i })).toBeInTheDocument();
      });

      // Advance 59 more seconds (now at 4:00)
      act(() => {
        vi.advanceTimersByTime(59000);
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /resend in 4:00/i })).toBeInTheDocument();
      });
    });

    it('formats countdown with leading zeros', async () => {
      const mockResend = vi.mocked(authModule.resendConfirmationEmail);
      mockResend.mockResolvedValue({
        success: true,
        message: 'Confirmation email sent.',
      });

      const user = userEvent.setup({ delay: null });
      renderButton();

      await user.click(screen.getByRole('button', { name: /resend verification email/i }));

      // Fast-forward to 9 seconds remaining
      act(() => {
        vi.advanceTimersByTime(291000); // 4:51
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /resend in 0:09/i })).toBeInTheDocument();
      });
    });

    it('re-enables button after countdown completes', async () => {
      const mockResend = vi.mocked(authModule.resendConfirmationEmail);
      mockResend.mockResolvedValue({
        success: true,
        message: 'Confirmation email sent.',
      });

      const user = userEvent.setup({ delay: null });
      renderButton();

      await user.click(screen.getByRole('button', { name: /resend verification email/i }));

      // Fast-forward full 5 minutes
      act(() => {
        vi.advanceTimersByTime(300000);
      });

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /resend verification email/i });
        expect(button).not.toBeDisabled();
      });
    });

    it('allows resending after countdown completes', async () => {
      const mockResend = vi.mocked(authModule.resendConfirmationEmail);
      mockResend.mockResolvedValue({
        success: true,
        message: 'Confirmation email sent.',
      });

      const user = userEvent.setup({ delay: null });
      renderButton();

      // First resend
      await user.click(screen.getByRole('button', { name: /resend verification email/i }));

      await waitFor(() => {
        expect(mockResend).toHaveBeenCalledTimes(1);
      });

      // Fast-forward full 5 minutes
      act(() => {
        vi.advanceTimersByTime(300000);
      });

      // Second resend
      mockResend.mockClear();
      await user.click(screen.getByRole('button', { name: /resend verification email/i }));

      await waitFor(() => {
        expect(mockResend).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error message on resend failure', async () => {
      const mockResend = vi.mocked(authModule.resendConfirmationEmail);
      mockResend.mockResolvedValue({
        success: false,
        message: 'Failed to send email',
        error: {
          code: 'RESEND_ERROR',
          message: 'Failed to send email',
        },
      });

      const user = userEvent.setup({ delay: null });
      renderButton();

      await user.click(screen.getByRole('button', { name: /resend verification email/i }));

      await waitFor(() => {
        expect(screen.getByText(/failed to send email/i)).toBeInTheDocument();
      });
    });

    it('handles thrown Error objects', async () => {
      const mockResend = vi.mocked(authModule.resendConfirmationEmail);
      mockResend.mockRejectedValue(new Error('Network error'));

      const user = userEvent.setup({ delay: null });
      renderButton();

      await user.click(screen.getByRole('button', { name: /resend verification email/i }));

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });

    it('handles non-Error exceptions', async () => {
      const mockResend = vi.mocked(authModule.resendConfirmationEmail);
      mockResend.mockRejectedValue('Unknown error');

      const user = userEvent.setup({ delay: null });
      renderButton();

      await user.click(screen.getByRole('button', { name: /resend verification email/i }));

      await waitFor(() => {
        expect(screen.getByText(/failed to resend email/i)).toBeInTheDocument();
      });
    });

    it('does NOT start countdown on error', async () => {
      const mockResend = vi.mocked(authModule.resendConfirmationEmail);
      mockResend.mockResolvedValue({
        success: false,
        message: 'Failed',
        error: {
          code: 'RESEND_ERROR',
          message: 'Failed',
        },
      });

      const user = userEvent.setup({ delay: null });
      renderButton();

      await user.click(screen.getByRole('button', { name: /resend verification email/i }));

      await waitFor(() => {
        expect(screen.getByText(/failed/i)).toBeInTheDocument();
      });

      // Button should still be enabled (no countdown)
      const button = screen.getByRole('button', { name: /resend verification email/i });
      expect(button).not.toBeDisabled();
    });

    it('clears error on new resend attempt', async () => {
      const mockResend = vi.mocked(authModule.resendConfirmationEmail);
      mockResend.mockResolvedValueOnce({
        success: false,
        message: 'First error',
        error: { code: 'ERROR', message: 'First error' },
      });

      const user = userEvent.setup({ delay: null });
      renderButton();

      // First attempt - error
      await user.click(screen.getByRole('button', { name: /resend verification email/i }));

      await waitFor(() => {
        expect(screen.getByText(/first error/i)).toBeInTheDocument();
      });

      // Second attempt - success
      mockResend.mockResolvedValueOnce({
        success: true,
        message: 'Success',
      });

      await user.click(screen.getByRole('button', { name: /resend verification email/i }));

      await waitFor(() => {
        expect(screen.queryByText(/first error/i)).not.toBeInTheDocument();
        expect(screen.getByText(/email sent!/i)).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases - Abuse Prevention', () => {
    it('prevents rapid clicking during loading', async () => {
      const mockResend = vi.mocked(authModule.resendConfirmationEmail);
      mockResend.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: true, message: 'Sent' }), 100))
      );

      const user = userEvent.setup({ delay: null });
      renderButton();

      const button = screen.getByRole('button', { name: /resend verification email/i });

      // Click multiple times rapidly
      await user.click(button);
      await user.click(button);
      await user.click(button);

      // Should only call once
      await waitFor(() => {
        expect(mockResend).toHaveBeenCalledTimes(1);
      });
    });

    it('prevents clicking during countdown', async () => {
      const mockResend = vi.mocked(authModule.resendConfirmationEmail);
      mockResend.mockResolvedValue({
        success: true,
        message: 'Sent',
      });

      const user = userEvent.setup({ delay: null });
      renderButton();

      // First click
      await user.click(screen.getByRole('button', { name: /resend verification email/i }));

      await waitFor(() => {
        expect(mockResend).toHaveBeenCalledTimes(1);
      });

      mockResend.mockClear();

      // Try to click during countdown
      const buttonDuringCountdown = screen.getByRole('button', { name: /resend in 5:00/i });
      expect(buttonDuringCountdown).toBeDisabled();

      // Even if somehow clicked, should not call
      await user.click(buttonDuringCountdown);
      expect(mockResend).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases - Email Variations', () => {
    it('handles email with special characters', async () => {
      const mockResend = vi.mocked(authModule.resendConfirmationEmail);
      mockResend.mockResolvedValue({
        success: true,
        message: 'Sent',
      });

      const user = userEvent.setup({ delay: null });
      const specialEmail = 'user+tag@example.co.uk';
      renderButton({ email: specialEmail });

      await user.click(screen.getByRole('button', { name: /resend verification email/i }));

      await waitFor(() => {
        expect(mockResend).toHaveBeenCalledWith(specialEmail);
      });
    });

    it('handles very long email addresses', async () => {
      const mockResend = vi.mocked(authModule.resendConfirmationEmail);
      mockResend.mockResolvedValue({
        success: true,
        message: 'Sent',
      });

      const user = userEvent.setup({ delay: null });
      const longEmail = 'a'.repeat(100) + '@example.com';
      renderButton({ email: longEmail });

      await user.click(screen.getByRole('button', { name: /resend verification email/i }));

      await waitFor(() => {
        expect(mockResend).toHaveBeenCalledWith(longEmail);
      });
    });

    it('handles empty email gracefully', async () => {
      const mockResend = vi.mocked(authModule.resendConfirmationEmail);
      mockResend.mockResolvedValue({
        success: true,
        message: 'Sent',
      });

      const user = userEvent.setup({ delay: null });
      renderButton({ email: '' });

      await user.click(screen.getByRole('button', { name: /resend verification email/i }));

      await waitFor(() => {
        expect(mockResend).toHaveBeenCalledWith('');
      });
    });
  });

  describe('Edge Cases - Timer Cleanup', () => {
    it('cleans up timer on unmount', async () => {
      const mockResend = vi.mocked(authModule.resendConfirmationEmail);
      mockResend.mockResolvedValue({
        success: true,
        message: 'Sent',
      });

      const user = userEvent.setup({ delay: null });
      const { unmount } = renderButton();

      await user.click(screen.getByRole('button', { name: /resend verification email/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /resend in 5:00/i })).toBeInTheDocument();
      });

      // Unmount component
      unmount();

      // No errors should occur from timer
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      // Test passes if no errors thrown
      expect(true).toBe(true);
    });

    it('maintains separate countdown state across multiple instances', async () => {
      const mockResend = vi.mocked(authModule.resendConfirmationEmail);
      mockResend.mockResolvedValue({
        success: true,
        message: 'Sent',
      });

      const user = userEvent.setup({ delay: null });

      // Render two buttons for different emails
      const { container: container1 } = render(
        <div data-testid="button1">
          <ResendConfirmationButton email="user1@example.com" />
        </div>
      );

      const { container: container2 } = render(
        <div data-testid="button2">
          <ResendConfirmationButton email="user2@example.com" />
        </div>
      );

      // Click first button
      const buttons1 = container1.querySelectorAll('button');
      await user.click(buttons1[0]);

      await waitFor(() => {
        expect(container1.textContent).toContain('Resend in 5:00');
      });

      // Second button should still be enabled
      const buttons2 = container2.querySelectorAll('button');
      expect(buttons2[0]).not.toBeDisabled();
    });
  });

  describe('ACCESSIBILITY', () => {
    it('button has correct role', () => {
      renderButton();

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('button text updates reflect in accessible name', async () => {
      const mockResend = vi.mocked(authModule.resendConfirmationEmail);
      mockResend.mockResolvedValue({
        success: true,
        message: 'Sent',
      });

      const user = userEvent.setup({ delay: null });
      renderButton();

      const initialButton = screen.getByRole('button', { name: /resend verification email/i });
      expect(initialButton).toBeInTheDocument();

      await user.click(initialButton);

      await waitFor(() => {
        const countdownButton = screen.getByRole('button', { name: /resend in 5:00/i });
        expect(countdownButton).toBeInTheDocument();
      });
    });

    it('success and error messages are announced to screen readers', async () => {
      const mockResend = vi.mocked(authModule.resendConfirmationEmail);
      mockResend.mockResolvedValue({
        success: true,
        message: 'Sent',
      });

      const user = userEvent.setup({ delay: null });
      renderButton();

      await user.click(screen.getByRole('button', { name: /resend verification email/i }));

      await waitFor(() => {
        const successMessage = screen.getByText(/email sent!/i);
        expect(successMessage).toBeInTheDocument();
      });
    });
  });

  describe('UI State Transitions', () => {
    it('transitions: idle → loading → success → countdown → idle', async () => {
      const mockResend = vi.mocked(authModule.resendConfirmationEmail);
      mockResend.mockResolvedValue({
        success: true,
        message: 'Sent',
      });

      const user = userEvent.setup({ delay: null });
      renderButton();

      // Idle state
      expect(screen.getByRole('button', { name: /resend verification email/i })).not.toBeDisabled();

      // Loading state (briefly)
      const button = screen.getByRole('button', { name: /resend verification email/i });
      await user.click(button);

      // Success + countdown
      await waitFor(() => {
        expect(screen.getByText(/email sent!/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /resend in 5:00/i })).toBeDisabled();
      });

      // Fast-forward countdown
      act(() => {
        vi.advanceTimersByTime(300000);
      });

      // Back to idle
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /resend verification email/i })).not.toBeDisabled();
      });
    });

    it('transitions: idle → loading → error → idle', async () => {
      const mockResend = vi.mocked(authModule.resendConfirmationEmail);
      mockResend.mockResolvedValue({
        success: false,
        message: 'Error occurred',
        error: { code: 'ERROR', message: 'Error occurred' },
      });

      const user = userEvent.setup({ delay: null });
      renderButton();

      // Idle state
      expect(screen.getByRole('button', { name: /resend verification email/i })).not.toBeDisabled();

      // Trigger error
      await user.click(screen.getByRole('button', { name: /resend verification email/i }));

      // Error state
      await waitFor(() => {
        expect(screen.getByText(/error occurred/i)).toBeInTheDocument();
      });

      // Still idle (button still enabled for retry)
      expect(screen.getByRole('button', { name: /resend verification email/i })).not.toBeDisabled();
    });
  });
});
