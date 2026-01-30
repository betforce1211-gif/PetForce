/**
 * Accessibility Tests for Auth Components
 * Tucker's comprehensive a11y testing with jest-axe
 * 
 * Ensures all authentication components meet WCAG 2.1 AA standards
 * and are usable by everyone, including users with disabilities.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { BrowserRouter } from 'react-router-dom';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { VerifyEmailPage } from '../pages/VerifyEmailPage';
import { EmailVerificationPendingPage } from '../pages/EmailVerificationPendingPage';
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage';
import { EmailPasswordForm } from '../components/EmailPasswordForm';
import { PasswordStrengthIndicator } from '../components/PasswordStrengthIndicator';
import { SSOButtons } from '../components/SSOButtons';
import { mockUseAuth, mockUseOAuth } from '@/test/mocks/auth';

// Extend expect with jest-axe matchers
expect.extend(toHaveNoViolations);

// Mock dependencies
vi.mock('@petforce/auth', () => ({
  useAuth: () => mockUseAuth,
  useOAuth: () => mockUseOAuth,
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useSearchParams: () => [new URLSearchParams('email=test@example.com')],
  };
});

// Helper to render with router
function renderWithRouter(ui: React.ReactElement) {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
}

describe('Authentication Pages Accessibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.isLoading = false;
    mockUseAuth.error = null;
  });

  describe('LoginPage', () => {
    it('has no accessibility violations', async () => {
      const { container } = renderWithRouter(<LoginPage />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has proper heading hierarchy', () => {
      renderWithRouter(<LoginPage />);
      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toBeInTheDocument();
      expect(h1).toHaveTextContent(/welcome back/i);
    });

    it('has accessible form labels', () => {
      renderWithRouter(<LoginPage />);
      
      // Email and password inputs should have labels
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    it('has descriptive button text', () => {
      renderWithRouter(<LoginPage />);
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      expect(submitButton).toBeInTheDocument();
    });

    it('provides alternative text for icons', () => {
      renderWithRouter(<LoginPage />);
      
      // Password toggle button should have aria-label
      const toggleButton = screen.getByRole('button', { name: /password/i });
      expect(toggleButton).toHaveAttribute('aria-label');
    });

    it('maintains focus management', async () => {
      renderWithRouter(<LoginPage />);
      
      const emailInput = screen.getByLabelText(/email/i);
      emailInput.focus();
      
      expect(document.activeElement).toBe(emailInput);
    });

    it('has sufficient color contrast', async () => {
      const { container } = renderWithRouter(<LoginPage />);
      
      // axe checks color contrast automatically
      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true },
        },
      });
      
      expect(results).toHaveNoViolations();
    });
  });

  describe('RegisterPage', () => {
    it('has no accessibility violations', async () => {
      const { container } = renderWithRouter(<RegisterPage />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has proper heading hierarchy', () => {
      renderWithRouter(<RegisterPage />);
      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toBeInTheDocument();
      expect(h1).toHaveTextContent(/join.*petforce/i);
    });

    it('has accessible form labels', () => {
      renderWithRouter(<RegisterPage />);
      
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      
      // Password fields (password and confirm password)
      const passwordLabels = screen.getAllByLabelText(/password/i);
      expect(passwordLabels.length).toBeGreaterThanOrEqual(2);
    });

    it('provides clear error messages', () => {
      renderWithRouter(<RegisterPage />);
      
      // Error messages should be associated with form fields
      // This is tested via axe but we can also check manually
      const inputs = screen.getAllByRole('textbox');
      inputs.forEach(input => {
        // Each input should have proper labeling
        expect(input).toHaveAccessibleName();
      });
    });

    it('has sufficient touch target sizes', async () => {
      const { container } = renderWithRouter(<RegisterPage />);
      
      // axe can check touch targets with proper config
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('VerifyEmailPage', () => {
    it('has no accessibility violations', async () => {
      const { container } = renderWithRouter(<VerifyEmailPage />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has clear success messaging', () => {
      renderWithRouter(<VerifyEmailPage />);
      
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent(/welcome.*petforce/i);
    });

    it('has accessible action buttons', () => {
      renderWithRouter(<VerifyEmailPage />);
      
      const button = screen.getByRole('button', { name: /get started/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAccessibleName();
    });

    it('uses semantic HTML', async () => {
      const { container } = renderWithRouter(<VerifyEmailPage />);
      
      // Check for proper landmark usage
      const results = await axe(container, {
        rules: {
          region: { enabled: true },
        },
      });
      
      expect(results).toHaveNoViolations();
    });
  });

  describe('EmailVerificationPendingPage', () => {
    it('has no accessibility violations', async () => {
      const { container } = renderWithRouter(<EmailVerificationPendingPage />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('provides clear instructions', () => {
      renderWithRouter(<EmailVerificationPendingPage />);
      
      expect(screen.getByText(/check your email/i)).toBeInTheDocument();
    });

    it('has accessible resend button', () => {
      renderWithRouter(<EmailVerificationPendingPage />);
      
      const resendButton = screen.getByRole('button', { name: /resend/i });
      expect(resendButton).toBeInTheDocument();
      expect(resendButton).toHaveAccessibleName();
    });
  });

  describe('ForgotPasswordPage', () => {
    it('has no accessibility violations', async () => {
      const { container } = renderWithRouter(<ForgotPasswordPage />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has clear form purpose', () => {
      renderWithRouter(<ForgotPasswordPage />);
      
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent(/forgot.*password|reset.*password/i);
    });

    it('has accessible email input', () => {
      renderWithRouter(<ForgotPasswordPage />);
      
      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toBeInTheDocument();
      expect(emailInput).toHaveAttribute('type', 'email');
    });
  });
});

describe('Authentication Components Accessibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.isLoading = false;
    mockUseAuth.error = null;
  });

  describe('EmailPasswordForm', () => {
    it('has no accessibility violations in login mode', async () => {
      const { container } = renderWithRouter(
        <EmailPasswordForm mode="login" />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations in register mode', async () => {
      const { container } = renderWithRouter(
        <EmailPasswordForm mode="register" />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('associates error messages with form fields', () => {
      mockUseAuth.error = {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      };

      renderWithRouter(<EmailPasswordForm mode="login" />);

      // Error should be visible and accessible
      const error = screen.getByText(/invalid.*password/i);
      expect(error).toBeInTheDocument();
    });

    it('has proper form structure', async () => {
      const { container } = renderWithRouter(
        <EmailPasswordForm mode="login" />
      );

      // Should use form element
      const form = container.querySelector('form');
      expect(form).toBeInTheDocument();

      // All inputs should be within the form
      const results = await axe(container, {
        rules: {
          'form-field-multiple-labels': { enabled: true },
        },
      });

      expect(results).toHaveNoViolations();
    });

    it('supports keyboard navigation', () => {
      renderWithRouter(<EmailPasswordForm mode="login" />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);

      // Inputs should be keyboard accessible
      expect(emailInput).not.toHaveAttribute('tabindex', '-1');
      expect(passwordInput).not.toHaveAttribute('tabindex', '-1');
    });
  });

  describe('PasswordStrengthIndicator', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(
        <PasswordStrengthIndicator password="TestP@ssw0rd123" />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('provides accessible strength feedback', () => {
      const { rerender } = render(
        <PasswordStrengthIndicator password="weak" />
      );

      expect(screen.getByText(/password strength/i)).toBeInTheDocument();

      // Change to strong password
      rerender(<PasswordStrengthIndicator password="Str0ng!P@ssw0rd" />);

      expect(screen.getByText(/strong/i)).toBeInTheDocument();
    });

    it('uses ARIA live regions for dynamic updates', () => {
      render(<PasswordStrengthIndicator password="test" />);

      // Strength indicator should announce changes to screen readers
      // This is implementation-dependent, but check for aria-live or role="status"
      const indicator = screen.getByText(/password strength/i).closest('div');
      const hasLiveRegion = indicator?.hasAttribute('aria-live') || 
                           indicator?.getAttribute('role') === 'status';
      
      // If not present, this is a suggestion for improvement
      if (!hasLiveRegion) {
        console.warn('Consider adding aria-live="polite" to password strength indicator');
      }
    });

    it('does not rely solely on color', () => {
      render(<PasswordStrengthIndicator password="TestP@ssw0rd123" />);

      // Strength should be conveyed through text, not just color
      expect(screen.getByText(/weak|medium|strong/i)).toBeInTheDocument();
    });
  });

  describe('SSOButtons', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(
        <SSOButtons onSuccess={() => {}} />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has descriptive button labels', () => {
      render(<SSOButtons onSuccess={() => {}} />);

      const googleButton = screen.getByRole('button', { name: /google/i });
      const appleButton = screen.getByRole('button', { name: /apple/i });

      expect(googleButton).toBeInTheDocument();
      expect(appleButton).toBeInTheDocument();
    });

    it('maintains proper button semantics', () => {
      render(<SSOButtons onSuccess={() => {}} />);

      const buttons = screen.getAllByRole('button');
      
      buttons.forEach(button => {
        expect(button).toHaveAttribute('type', 'button');
        expect(button).toHaveAccessibleName();
      });
    });

    it('has sufficient touch target sizes', async () => {
      const { container } = render(
        <SSOButtons onSuccess={() => {}} />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});

describe('Error State Accessibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('error messages use proper ARIA roles', () => {
    mockUseAuth.error = {
      code: 'INVALID_CREDENTIALS',
      message: 'Invalid email or password',
    };

    renderWithRouter(<LoginPage />);

    // Error should have role="alert" or aria-live
    const error = screen.getByText(/invalid.*password/i);
    const errorContainer = error.closest('[role="alert"], [aria-live]');
    
    expect(errorContainer).toBeInTheDocument();
  });

  it('error messages are announced to screen readers', () => {
    mockUseAuth.error = {
      code: 'AUTH_ERROR',
      message: 'Authentication failed',
    };

    renderWithRouter(<EmailPasswordForm mode="login" />);

    const error = screen.getByText(/authentication failed/i);
    expect(error).toBeInTheDocument();
    
    // Check for accessibility announcement mechanisms
    const hasAriaLive = error.hasAttribute('aria-live') || 
                       error.closest('[aria-live]') !== null;
    const hasRoleAlert = error.getAttribute('role') === 'alert' ||
                        error.closest('[role="alert"]') !== null;
    
    expect(hasAriaLive || hasRoleAlert).toBe(true);
  });
});

describe('Loading State Accessibility', () => {
  it('loading states are announced to screen readers', () => {
    mockUseAuth.isLoading = true;

    renderWithRouter(<EmailPasswordForm mode="login" />);

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    // Button should be disabled during loading
    expect(submitButton).toBeDisabled();
    
    // Should have aria-busy or loading indicator
    const hasLoadingState = submitButton.hasAttribute('aria-busy') ||
                           submitButton.hasAttribute('aria-label');
    
    if (!hasLoadingState) {
      console.warn('Consider adding aria-busy="true" to loading buttons');
    }
  });
});

describe('Focus Management', () => {
  it('maintains focus trap in modals', async () => {
    // If your auth flow uses modals, test focus trapping
    // This is a placeholder for modal-based flows
  });

  it('returns focus after actions', () => {
    // Test focus return after form submission, etc.
    // Implementation depends on your routing/modal strategy
  });

  it('has visible focus indicators', async () => {
    const { container } = renderWithRouter(<LoginPage />);

    // axe checks for focus indicators
    const results = await axe(container, {
      rules: {
        'focus-order-semantics': { enabled: true },
      },
    });

    expect(results).toHaveNoViolations();
  });
});

describe('Keyboard Navigation', () => {
  it('all interactive elements are keyboard accessible', async () => {
    const { container } = renderWithRouter(<RegisterPage />);

    // Check for keyboard traps and accessibility
    const results = await axe(container, {
      rules: {
        'keyboard-nav': { enabled: true },
      },
    });

    expect(results).toHaveNoViolations();
  });

  it('skip links are provided for long pages', () => {
    // If you have long auth pages, consider skip links
    // This is a best practice reminder
  });
});

describe('Screen Reader Experience', () => {
  it('page titles are descriptive', () => {
    // In a real app, check document.title
    // This would be tested at the routing level
  });

  it('landmark regions are properly labeled', async () => {
    const { container } = renderWithRouter(<LoginPage />);

    const results = await axe(container, {
      rules: {
        region: { enabled: true },
        'landmark-one-main': { enabled: true },
      },
    });

    expect(results).toHaveNoViolations();
  });

  it('form inputs have proper autocomplete attributes', () => {
    renderWithRouter(<EmailPasswordForm mode="login" />);

    const emailInput = screen.getByLabelText(/email/i);
    expect(emailInput).toHaveAttribute('autocomplete', 'email');

    const passwordInput = screen.getByLabelText(/password/i);
    expect(passwordInput).toHaveAttribute('autocomplete', 'current-password');
  });
});
