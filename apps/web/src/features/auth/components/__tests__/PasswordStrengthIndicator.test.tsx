// PasswordStrengthIndicator component tests

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PasswordStrengthIndicator } from '../PasswordStrengthIndicator';

describe('PasswordStrengthIndicator', () => {
  it('does not render when password is empty', () => {
    const { container } = render(<PasswordStrengthIndicator password="" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows weak strength for short password', () => {
    render(<PasswordStrengthIndicator password="abc" />);
    expect(screen.getByText(/weak/i)).toBeInTheDocument();
  });

  it('shows fair strength for medium password', () => {
    render(<PasswordStrengthIndicator password="Password1" />);
    expect(screen.getByText(/fair|good/i)).toBeInTheDocument();
  });

  it('shows strong strength for strong password', () => {
    render(<PasswordStrengthIndicator password="MyP@ssw0rd123!" />);
    expect(screen.getByText(/strong/i)).toBeInTheDocument();
  });

  it('displays only unmet password requirements', () => {
    render(<PasswordStrengthIndicator password="test" showRequirements />);

    // Should show unmet requirements
    expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
    expect(screen.getByText(/contains uppercase letter/i)).toBeInTheDocument();
    expect(screen.getByText(/contains number/i)).toBeInTheDocument();
  });

  it('hides requirements when showRequirements is false', () => {
    render(<PasswordStrengthIndicator password="test" showRequirements={false} />);

    expect(screen.queryByText(/at least 8 characters/i)).not.toBeInTheDocument();
  });

  it('shows success message when all requirements are met', () => {
    render(<PasswordStrengthIndicator password="TestPassword123" showRequirements />);

    // Should show "All requirements met" instead of individual requirements
    expect(screen.getByText(/all requirements met/i)).toBeInTheDocument();

    // Should NOT show individual requirement text
    expect(screen.queryByText(/at least 8 characters/i)).not.toBeInTheDocument();
  });

  it('hides met requirements and only shows unmet ones', () => {
    render(<PasswordStrengthIndicator password="testpassword" showRequirements />);

    // Password has lowercase and 8+ chars, but missing uppercase and number
    expect(screen.queryByText(/contains lowercase letter/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/at least 8 characters/i)).not.toBeInTheDocument();

    // Should show unmet requirements
    expect(screen.getByText(/contains uppercase letter/i)).toBeInTheDocument();
    expect(screen.getByText(/contains number/i)).toBeInTheDocument();
  });

  it('shows progress bar that increases with password strength', () => {
    const { container, rerender } = render(<PasswordStrengthIndicator password="ab" />);

    // Verify progress bar exists
    const progressBar = container.querySelector('.bg-gray-200.rounded-full');
    expect(progressBar).toBeInTheDocument();

    // Verify strength label changes for stronger password
    expect(screen.getByText(/weak/i)).toBeInTheDocument();

    rerender(<PasswordStrengthIndicator password="MyP@ssw0rd123!" />);
    expect(screen.getByText(/strong/i)).toBeInTheDocument();
  });
});
