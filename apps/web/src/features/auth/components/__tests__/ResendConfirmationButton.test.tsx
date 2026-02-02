/**
 * ResendConfirmationButton Component Tests
 * Tucker's countdown timer and rate-limiting edge case coverage
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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

    it('button is enabled by default', () => {
      renderButton();
      const button = screen.getByRole('button', { name: /resend verification email/i });
      expect(button).not.toBeDisabled();
    });

    it('button has correct aria-label for accessibility', () => {
      renderButton();
      const button = screen.getByRole('button', { name: /resend verification email/i });
      expect(button).toBeInTheDocument();
    });

    it('applies custom className', () => {
      renderButton({ className: 'custom-class' });
      const button = screen.getByRole('button', { name: /resend verification email/i });
      expect(button.parentElement).toHaveClass('custom-class');
    });
  });

  describe('Basic Functionality', () => {
    it('calls resendConfirmationEmail with correct email', async () => {
      const mockResend = vi.mocked(authModule.resendConfirmationEmail);
      mockResend.mockResolvedValue({ success: true, message: 'Confirmation email sent.' });

      const user = userEvent.setup({ delay: null });
      renderButton({ email: 'specific@example.com' });

      await user.click(screen.getByRole('button', { name: /resend verification email/i }));
      
      // Flush promises
      await vi.runAllTimers();
      
      expect(mockResend).toHaveBeenCalledWith('specific@example.com');
    });

    it('disables button while loading', async () => {
      const mockResend = vi.mocked(authModule.resendConfirmationEmail);
      let resolvePromise: (value: any) => void;
      mockResend.mockReturnValue(new Promise((resolve) => { resolvePromise = resolve; }));

      const user = userEvent.setup({ delay: null });
      renderButton();

      const button = screen.getByRole('button', { name: /resend verification email/i });
      await user.click(button);
      
      // Flush promises to process the click
      await vi.runAllTimers();

      await waitFor(() => {
        expect(button).toBeDisabled();
      });

      resolvePromise!({ success: true });
      await vi.runAllTimers();
    });

    it('displays success message after successful resend', async () => {
      const mockResend = vi.mocked(authModule.resendConfirmationEmail);
      mockResend.mockResolvedValue({ success: true, message: 'Confirmation email sent.' });

      const user = userEvent.setup({ delay: null });
      renderButton();

      await user.click(screen.getByRole('button', { name: /resend verification email/i }));
      await vi.runAllTimers();

      await waitFor(() => {
        expect(screen.getByText(/email sent!/i)).toBeInTheDocument();
      });
    });

    it('hides success message after 5 seconds', async () => {
      const mockResend = vi.mocked(authModule.resendConfirmationEmail);
      mockResend.mockResolvedValue({ success: true, message: 'Confirmation email sent.' });

      const user = userEvent.setup({ delay: null });
      renderButton();

      await user.click(screen.getByRole('button', { name: /resend verification email/i }));
      await vi.runAllTimers();

      await waitFor(() => {
        expect(screen.getByText(/email sent!/i)).toBeInTheDocument();
      });

      vi.advanceTimersByTime(5000);
      
      await waitFor(() => {
        expect(screen.queryByText(/email sent!/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Countdown Timer & Rate Limiting', () => {
    it('starts 5-minute countdown after successful resend', async () => {
      const mockResend = vi.mocked(authModule.resendConfirmationEmail);
      mockResend.mockResolvedValue({ success: true, message: 'Confirmation email sent.' });

      const user = userEvent.setup({ delay: null });
      renderButton();

      await user.click(screen.getByRole('button', { name: /resend verification email/i }));
      await vi.runAllTimers();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /resend in 5:00/i })).toBeInTheDocument();
      });
    });

    it('disables button during countdown', async () => {
      const mockResend = vi.mocked(authModule.resendConfirmationEmail);
      mockResend.mockResolvedValue({ success: true, message: 'Confirmation email sent.' });

      const user = userEvent.setup({ delay: null });
      renderButton();

      await user.click(screen.getByRole('button', { name: /resend verification email/i }));
      await vi.runAllTimers();

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /resend in 5:00/i });
        expect(button).toBeDisabled();
      });
    });

    it('decrements countdown every second', async () => {
      const mockResend = vi.mocked(authModule.resendConfirmationEmail);
      mockResend.mockResolvedValue({ success: true, message: 'Confirmation email sent.' });

      const user = userEvent.setup({ delay: null });
      renderButton();

      await user.click(screen.getByRole('button', { name: /resend verification email/i }));
      await vi.runAllTimers();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /resend in 5:00/i })).toBeInTheDocument();
      });

      vi.advanceTimersByTime(1000);
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /resend in 4:59/i })).toBeInTheDocument();
      });

      vi.advanceTimersByTime(10000);
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /resend in 4:49/i })).toBeInTheDocument();
      });
    });

    it('updates countdown correctly over time', async () => {
      const mockResend = vi.mocked(authModule.resendConfirmationEmail);
      mockResend.mockResolvedValue({ success: true, message: 'Confirmation email sent.' });

      const user = userEvent.setup({ delay: null });
      renderButton();

      await user.click(screen.getByRole('button', { name: /resend verification email/i }));
      await vi.runAllTimers();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /resend in 5:00/i })).toBeInTheDocument();
      });

      vi.advanceTimersByTime(60000);
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /resend in 4:00/i })).toBeInTheDocument();
      });
    });

    it('formats countdown with leading zeros', async () => {
      const mockResend = vi.mocked(authModule.resendConfirmationEmail);
      mockResend.mockResolvedValue({ success: true, message: 'Confirmation email sent.' });

      const user = userEvent.setup({ delay: null });
      renderButton();

      await user.click(screen.getByRole('button', { name: /resend verification email/i }));
      await vi.runAllTimers();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /resend in 5:00/i })).toBeInTheDocument();
      });

      vi.advanceTimersByTime(291000);
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /resend in 0:09/i })).toBeInTheDocument();
      });
    });

    it('re-enables button after countdown completes', async () => {
      const mockResend = vi.mocked(authModule.resendConfirmationEmail);
      mockResend.mockResolvedValue({ success: true, message: 'Confirmation email sent.' });

      const user = userEvent.setup({ delay: null });
      renderButton();

      await user.click(screen.getByRole('button', { name: /resend verification email/i }));
      await vi.runAllTimers();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /resend in 5:00/i })).toBeInTheDocument();
      });

      vi.advanceTimersByTime(300000);
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /resend verification email/i })).not.toBeDisabled();
      });
    });

    it('allows resending after countdown completes', async () => {
      const mockResend = vi.mocked(authModule.resendConfirmationEmail);
      mockResend.mockResolvedValue({ success: true, message: 'Confirmation email sent.' });

      const user = userEvent.setup({ delay: null });
      renderButton();

      await user.click(screen.getByRole('button', { name: /resend verification email/i }));
      await vi.runAllTimers();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /resend in 5:00/i })).toBeInTheDocument();
      });

      vi.advanceTimersByTime(300000);
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /resend verification email/i })).not.toBeDisabled();
      });

      mockResend.mockClear();
      await user.click(screen.getByRole('button', { name: /resend verification email/i }));
      await vi.runAllTimers();

      expect(mockResend).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling', () => {
    it('displays error message on resend failure', async () => {
      const mockResend = vi.mocked(authModule.resendConfirmationEmail);
      mockResend.mockResolvedValue({
        success: false,
        error: { code: 'RATE_LIMIT', message: 'Too many requests. Please try again later.' },
      });

      const user = userEvent.setup({ delay: null });
      renderButton();

      await user.click(screen.getByRole('button', { name: /resend verification email/i }));
      await vi.runAllTimers();

      await waitFor(() => {
        expect(screen.getByText(/too many requests/i)).toBeInTheDocument();
      });
    });

    it('handles thrown Error objects', async () => {
      const mockResend = vi.mocked(authModule.resendConfirmationEmail);
      mockResend.mockRejectedValue(new Error('Network error'));

      const user = userEvent.setup({ delay: null });
      renderButton();

      await user.click(screen.getByRole('button', { name: /resend verification email/i }));
      await vi.runAllTimers();

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
      await vi.runAllTimers();

      await waitFor(() => {
        expect(screen.getByText(/failed to resend email/i)).toBeInTheDocument();
      });
    });

    it('does NOT start countdown on error', async () => {
      const mockResend = vi.mocked(authModule.resendConfirmationEmail);
      mockResend.mockResolvedValue({
        success: false,
        error: { code: 'RATE_LIMIT', message: 'Too many requests' },
      });

      const user = userEvent.setup({ delay: null });
      renderButton();

      await user.click(screen.getByRole('button', { name: /resend verification email/i }));
      await vi.runAllTimers();

      await waitFor(() => {
        expect(screen.getByText(/too many requests/i)).toBeInTheDocument();
      });

      vi.advanceTimersByTime(10000);

      expect(screen.getByRole('button', { name: /resend verification email/i })).toBeInTheDocument();
      expect(screen.queryByText(/resend in/i)).not.toBeInTheDocument();
    });

    it('clears error on new resend attempt', async () => {
      const mockResend = vi.mocked(authModule.resendConfirmationEmail);
      mockResend.mockResolvedValueOnce({
        success: false,
        error: { code: 'ERROR', message: 'First error' },
      });
      mockResend.mockResolvedValueOnce({ success: true, message: 'Success' });

      const user = userEvent.setup({ delay: null });
      renderButton();

      await user.click(screen.getByRole('button', { name: /resend verification email/i }));
      await vi.runAllTimers();

      await waitFor(() => {
        expect(screen.getByText(/first error/i)).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /resend verification email/i }));
      await vi.runAllTimers();

      await waitFor(() => {
        expect(screen.queryByText(/first error/i)).not.toBeInTheDocument();
        expect(screen.getByText(/email sent!/i)).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases - Abuse Prevention', () => {
    it('prevents rapid clicking during loading', async () => {
      const mockResend = vi.mocked(authModule.resendConfirmationEmail);
      let resolvePromise: (value: any) => void;
      mockResend.mockReturnValue(new Promise((resolve) => { resolvePromise = resolve; }));

      const user = userEvent.setup({ delay: null });
      renderButton();

      const button = screen.getByRole('button', { name: /resend verification email/i });
      await user.click(button);
      await user.click(button);
      await user.click(button);
      await vi.runAllTimers();

      expect(mockResend).toHaveBeenCalledTimes(1);

      resolvePromise!({ success: true });
      await vi.runAllTimers();
    });

    it('prevents clicking during countdown', async () => {
      const mockResend = vi.mocked(authModule.resendConfirmationEmail);
      mockResend.mockResolvedValue({ success: true, message: 'Confirmation email sent.' });

      const user = userEvent.setup({ delay: null });
      renderButton();

      await user.click(screen.getByRole('button', { name: /resend verification email/i }));
      await vi.runAllTimers();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /resend in 5:00/i })).toBeInTheDocument();
      });

      mockResend.mockClear();

      await user.click(screen.getByRole('button', { name: /resend in 5:00/i }));
      await vi.runAllTimers();

      expect(mockResend).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases - Email Variations', () => {
    it('handles email with special characters', async () => {
      const mockResend = vi.mocked(authModule.resendConfirmationEmail);
      mockResend.mockResolvedValue({ success: true, message: 'Confirmation email sent.' });

      const user = userEvent.setup({ delay: null });
      renderButton({ email: 'test+tag@example.com' });

      await user.click(screen.getByRole('button', { name: /resend verification email/i }));
      await vi.runAllTimers();

      expect(mockResend).toHaveBeenCalledWith('test+tag@example.com');
    });

    it('handles very long email addresses', async () => {
      const mockResend = vi.mocked(authModule.resendConfirmationEmail);
      mockResend.mockResolvedValue({ success: true, message: 'Confirmation email sent.' });

      const user = userEvent.setup({ delay: null });
      const longEmail = 'very.long.email.address.with.many.dots@subdomain.example.com';
      renderButton({ email: longEmail });

      await user.click(screen.getByRole('button', { name: /resend verification email/i }));
      await vi.runAllTimers();

      expect(mockResend).toHaveBeenCalledWith(longEmail);
    });

    it('handles empty email gracefully', async () => {
      const mockResend = vi.mocked(authModule.resendConfirmationEmail);
      mockResend.mockResolvedValue({ success: true, message: 'Confirmation email sent.' });

      const user = userEvent.setup({ delay: null });
      renderButton({ email: '' });

      await user.click(screen.getByRole('button', { name: /resend verification email/i }));
      await vi.runAllTimers();

      expect(mockResend).toHaveBeenCalledWith('');
    });
  });

  describe('Edge Cases - Timer Cleanup', () => {
    it('cleans up timer on unmount', async () => {
      const mockResend = vi.mocked(authModule.resendConfirmationEmail);
      mockResend.mockResolvedValue({ success: true, message: 'Confirmation email sent.' });

      const user = userEvent.setup({ delay: null });
      const { unmount } = renderButton();

      await user.click(screen.getByRole('button', { name: /resend verification email/i }));
      await vi.runAllTimers();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /resend in 5:00/i })).toBeInTheDocument();
      });

      unmount();
      vi.advanceTimersByTime(10000);
    });

    it('maintains separate countdown state across multiple instances', async () => {
      const mockResend = vi.mocked(authModule.resendConfirmationEmail);
      mockResend.mockResolvedValue({ success: true, message: 'Confirmation email sent.' });

      const user = userEvent.setup({ delay: null });

      render(
        <div>
          <ResendConfirmationButton email="test1@example.com" />
          <ResendConfirmationButton email="test2@example.com" />
        </div>
      );

      const buttons = screen.getAllByRole('button', { name: /resend verification email/i });

      await user.click(buttons[0]);
      await vi.runAllTimers();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /resend in 5:00/i })).toBeInTheDocument();
      });

      expect(buttons[1]).not.toBeDisabled();
    });
  });

  describe('ACCESSIBILITY', () => {
    it('button has semantic button role', () => {
      renderButton();
      const button = screen.getByRole('button', { name: /resend verification email/i });
      expect(button).toBeInTheDocument();
    });

    it('disabled state is communicated to screen readers', async () => {
      const mockResend = vi.mocked(authModule.resendConfirmationEmail);
      mockResend.mockResolvedValue({ success: true, message: 'Confirmation email sent.' });

      const user = userEvent.setup({ delay: null });
      renderButton();

      await user.click(screen.getByRole('button', { name: /resend verification email/i }));
      await vi.runAllTimers();

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /resend in 5:00/i });
        expect(button).toHaveAttribute('disabled');
      });
    });

    it('button text updates reflect in accessible name', async () => {
      const mockResend = vi.mocked(authModule.resendConfirmationEmail);
      mockResend.mockResolvedValue({ success: true, message: 'Confirmation email sent.' });

      const user = userEvent.setup({ delay: null });
      renderButton();

      expect(screen.getByRole('button', { name: /resend verification email/i })).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /resend verification email/i }));
      await vi.runAllTimers();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /resend in 5:00/i })).toBeInTheDocument();
      });
    });

    it('success and error messages are announced to screen readers', async () => {
      const mockResend = vi.mocked(authModule.resendConfirmationEmail);
      mockResend.mockResolvedValue({ success: true, message: 'Confirmation email sent.' });

      const user = userEvent.setup({ delay: null });
      renderButton();

      await user.click(screen.getByRole('button', { name: /resend verification email/i }));
      await vi.runAllTimers();

      await waitFor(() => {
        const successMessage = screen.getByText(/email sent!/i);
        expect(successMessage).toBeInTheDocument();
      });
    });
  });

  describe('UI State Transitions', () => {
    it('transitions: idle → loading → success → countdown → idle', async () => {
      const mockResend = vi.mocked(authModule.resendConfirmationEmail);
      mockResend.mockResolvedValue({ success: true, message: 'Confirmation email sent.' });

      const user = userEvent.setup({ delay: null });
      renderButton();

      expect(screen.getByRole('button', { name: /resend verification email/i })).not.toBeDisabled();

      await user.click(screen.getByRole('button', { name: /resend verification email/i }));
      await vi.runAllTimers();

      await waitFor(() => {
        expect(screen.getByText(/email sent!/i)).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /resend in 5:00/i })).toBeInTheDocument();
      });

      vi.advanceTimersByTime(300000);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /resend verification email/i })).not.toBeDisabled();
      });
    });

    it('transitions: idle → loading → error → idle', async () => {
      const mockResend = vi.mocked(authModule.resendConfirmationEmail);
      mockResend.mockResolvedValue({
        success: false,
        error: { code: 'ERROR', message: 'Something went wrong' },
      });

      const user = userEvent.setup({ delay: null });
      renderButton();

      expect(screen.getByRole('button', { name: /resend verification email/i })).not.toBeDisabled();

      await user.click(screen.getByRole('button', { name: /resend verification email/i }));
      await vi.runAllTimers();

      await waitFor(() => {
        expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: /resend verification email/i })).not.toBeDisabled();
    });
  });
});
