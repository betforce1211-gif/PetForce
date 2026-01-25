## ADDED Requirements

### Requirement: Email Confirmation User Experience
The system SHALL provide clear, helpful messaging throughout the email confirmation process.

#### Scenario: Registration success message
- **WHEN** a user successfully registers
- **THEN** the system SHALL display a success message
- **AND** the message SHALL say "Check your email to verify your account"
- **AND** the message SHALL include the email address they registered with
- **AND** the message SHALL explain they cannot login until verified
- **AND** the message SHALL provide a "Resend email" button

#### Scenario: Email verification pending page
- **WHEN** a user completes registration
- **THEN** the system SHALL redirect to a verification pending page
- **AND** the page SHALL show a clear email icon/illustration
- **AND** the page SHALL display: "We sent a verification email to {email}"
- **AND** the page SHALL explain: "Click the link in the email to activate your account"
- **AND** the page SHALL show "Didn't receive it?" with resend button
- **AND** the page SHALL show "Check spam folder" tip

#### Scenario: Resend verification email interaction
- **WHEN** a user clicks "Resend verification email"
- **THEN** the system SHALL show a loading state on the button
- **AND** disable the button during resend
- **AND** show success message: "Email sent! Check your inbox"
- **AND** show countdown timer: "Can resend again in 5 minutes"
- **AND** log the resend attempt

#### Scenario: Login attempt before verification
- **WHEN** an unverified user tries to login
- **THEN** the system SHALL show error message at top of login form
- **AND** the message SHALL say: "Please verify your email address first"
- **AND** include the user's email address
- **AND** provide a clickable "Resend verification email" link
- **AND** link SHALL open modal with resend functionality

### Requirement: Email Confirmation Status Indicator
The system SHALL show users their current verification status clearly.

#### Scenario: Show verification status
- **WHEN** on the verification pending page
- **THEN** the system SHALL show status: "Verification pending"
- **AND** show visual indicator (e.g., yellow warning badge)
- **AND** show time since registration: "Sent 5 minutes ago"
- **AND** update status automatically if verified (poll every 10 seconds)

#### Scenario: Auto-detect verification completion
- **WHEN** user verifies email in another tab
- **THEN** the pending page SHALL detect verification within 10 seconds
- **AND** show success animation
- **AND** display: "Email verified! Redirecting to login..."
- **AND** redirect to login page after 2 seconds

### Requirement: Error Message Clarity
The system SHALL display clear, actionable error messages for authentication issues.

#### Scenario: Unverified user login error
- **WHEN** showing login error for unverified user
- **THEN** the error SHALL use friendly language (not technical error codes)
- **AND** explain: "Your email address hasn't been verified yet"
- **AND** provide solution: "Check your email for the verification link"
- **AND** offer action: "Resend verification email" button
- **AND** use warm, reassuring tone (not alarming)

#### Scenario: Expired verification link
- **WHEN** user clicks an expired verification link
- **THEN** the system SHALL show: "This verification link has expired"
- **AND** explain: "Verification links expire after 24 hours"
- **AND** provide solution: Button to "Send new verification email"
- **AND** pre-fill email if available from link
- **AND** show success message after sending new link

### Requirement: Mobile-Responsive Verification Flow
The system SHALL provide an optimized experience on mobile devices.

#### Scenario: Mobile verification page layout
- **WHEN** viewing verification page on mobile
- **THEN** the page SHALL stack vertically (single column)
- **AND** use large, touch-friendly buttons (min 44x44px)
- **AND** show simplified email icon (centered)
- **AND** use readable font size (min 16px to prevent zoom)
- **AND** keep "Resend" button visible without scrolling

#### Scenario: Mobile email client integration
- **WHEN** user opens email on mobile device
- **THEN** clicking verification link SHALL open in mobile browser
- **AND** automatically detect if app is installed (future: deep link to app)
- **AND** provide option: "Continue on web" vs "Open in app"
- **AND** maintain context after returning from email client

### Requirement: Accessibility for Email Verification
The system SHALL ensure verification flow is accessible to all users.

#### Scenario: Screen reader support
- **WHEN** using a screen reader
- **THEN** verification page SHALL announce: "Email verification required"
- **AND** announce email address sent to
- **AND** announce "Resend email" button is available
- **AND** announce status updates (email sent, verification complete)

#### Scenario: Keyboard navigation
- **WHEN** navigating with keyboard only
- **THEN** user SHALL be able to tab to "Resend email" button
- **AND** activate button with Enter or Space
- **AND** see clear focus indicator on interactive elements
- **AND** logical tab order (title → message → resend button)

### Requirement: Email Verification Timing Guidance
The system SHALL set clear expectations about email delivery timing.

#### Scenario: Show expected delivery time
- **WHEN** on verification pending page
- **THEN** the system SHALL display: "Emails usually arrive within 1-2 minutes"
- **AND** show live timer: "Sent 30 seconds ago"
- **AND** suggest checking spam after 5 minutes
- **AND** offer resend after 2 minutes

#### Scenario: Handle delayed email delivery
- **WHEN** email hasn't arrived after 5 minutes
- **THEN** the system SHALL proactively show message: "Taking longer than usual?"
- **AND** suggest checking spam folder with icon
- **AND** offer to resend to different email (future enhancement)
- **AND** provide support contact if still no email after 10 minutes
