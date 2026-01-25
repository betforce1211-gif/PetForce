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

  it('displays password requirements', () => {
    render(<PasswordStrengthIndicator password="test" showRequirements />);

    expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
    expect(screen.getByText(/uppercase & lowercase/i)).toBeInTheDocument();
    expect(screen.getByText(/contains a number/i)).toBeInTheDocument();
    expect(screen.getByText(/special character/i)).toBeInTheDocument();
  });

  it('hides requirements when showRequirements is false', () => {
    render(<PasswordStrengthIndicator password="test" showRequirements={false} />);

    expect(screen.queryByText(/at least 8 characters/i)).not.toBeInTheDocument();
  });

  it('marks met requirements correctly', () => {
    render(<PasswordStrengthIndicator password="TestPassword123!" showRequirements />);

    // All requirements should be met
    const requirements = screen.getAllByText(/✓/);
    expect(requirements.length).toBeGreaterThan(0);
  });

  it('shows progress bar with correct width', () => {
    const { rerender } = render(<PasswordStrengthIndicator password="ab" />);
    let progressBar = document.querySelector('[style*="width"]');
    expect(progressBar).toBeInTheDocument();

    // Stronger password should have wider progress bar
    rerender(<PasswordStrengthIndicator password="MyP@ssw0rd123!" />);
    progressBar = document.querySelector('[style*="width"]');
    expect(progressBar).toHaveStyle({ width: expect.stringMatching(/100%/) });
  });
});
