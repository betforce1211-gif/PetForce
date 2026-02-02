/**
 * Household Email Invites
 *
 * Email service for sending personalized household invitations.
 * Includes branded templates with deep links and invite codes.
 */

import { logger } from '../utils/logger';

export interface EmailInviteOptions {
  toEmail: string;
  fromName: string;
  householdName: string;
  householdDescription?: string;
  inviteCode: string;
  invitedBy: string;
}

/**
 * Send a personalized email invite to join a household.
 *
 * Includes:
 * - Branded email template with PetForce design
 * - Personalized invite link with tracking
 * - Manual invite code entry option
 * - Privacy and terms links
 *
 * @param options - Email invite options
 * @returns Success result or error
 */
export async function sendHouseholdEmailInvite(
  options: EmailInviteOptions
): Promise<{ success: boolean; error?: string }> {
  const { toEmail, fromName, householdName, householdDescription, inviteCode, invitedBy } = options;

  try {
    // Generate personalized invite link with tracking
    const inviteLink = `https://petforce.app/households/join?code=${inviteCode}&ref=email`;

    // Email template with personalization
    const emailHTML = generateEmailHTML({
      fromName,
      householdName,
      householdDescription,
      inviteLink,
      inviteCode,
    });

    // Plain text version for email clients that don't support HTML
    const emailText = generateEmailText({
      fromName,
      householdName,
      householdDescription,
      inviteLink,
      inviteCode,
    });

    await sendEmail({
      to: toEmail,
      from: 'invites@petforce.app',
      replyTo: 'noreply@petforce.app',
      subject: `${fromName} invited you to join ${householdName} on PetForce`,
      html: emailHTML,
      text: emailText,
    });

    logger.info('Email invite sent', {
      toEmail,
      householdName,
      invitedBy,
      correlationId: logger.generateRequestId(),
    });

    return { success: true };
  } catch (error) {
    logger.error('Failed to send email invite', {
      error: error instanceof Error ? error.message : 'Unknown error',
      toEmail,
      householdName,
    });
    return { success: false, error: 'Failed to send email' };
  }
}

/**
 * Generate HTML email template with PetForce branding.
 */
function generateEmailHTML(options: {
  fromName: string;
  householdName: string;
  householdDescription?: string;
  inviteLink: string;
  inviteCode: string;
}): string {
  const { fromName, householdName, householdDescription, inviteLink, inviteCode } = options;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Join ${householdName} on PetForce</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          margin: 0;
          padding: 0;
          background-color: #f3f4f6;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 40px 30px;
          text-align: center;
          border-radius: 8px 8px 0 0;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
        }
        .content {
          background: white;
          padding: 40px 30px;
          border: 1px solid #e5e7eb;
          border-top: none;
          line-height: 1.6;
        }
        .content p {
          color: #374151;
          font-size: 16px;
          margin: 16px 0;
        }
        .content h2 {
          color: #667eea;
          margin: 30px 0 16px 0;
          font-size: 24px;
        }
        .button-container {
          text-align: center;
          margin: 40px 0;
        }
        .button {
          display: inline-block;
          background: #667eea;
          color: white;
          padding: 16px 32px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
          transition: background 0.2s;
        }
        .button:hover {
          background: #5568d3;
        }
        .invite-code {
          font-size: 28px;
          font-weight: bold;
          letter-spacing: 3px;
          background: #f9fafb;
          padding: 20px;
          text-align: center;
          border-radius: 8px;
          margin: 30px 0;
          border: 2px dashed #d1d5db;
          color: #1f2937;
        }
        .description {
          background: #f9fafb;
          border-left: 4px solid #667eea;
          padding: 16px 20px;
          margin: 20px 0;
          color: #6b7280;
          font-style: italic;
        }
        .feature-list {
          margin: 20px 0;
          padding-left: 0;
        }
        .feature-list li {
          list-style: none;
          padding: 8px 0;
          color: #374151;
        }
        .feature-list li:before {
          content: "🐾 ";
          margin-right: 8px;
        }
        .footer {
          text-align: center;
          color: #6b7280;
          font-size: 14px;
          margin-top: 40px;
          padding: 20px;
        }
        .footer a {
          color: #667eea;
          text-decoration: none;
        }
        .footer a:hover {
          text-decoration: underline;
        }
        .note {
          color: #6b7280;
          font-size: 13px;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🐾 You're Invited to PetForce!</h1>
        </div>
        <div class="content">
          <p>Hi there!</p>

          <p><strong>${fromName}</strong> has invited you to join their household on PetForce:</p>

          <h2>${householdName}</h2>

          ${householdDescription ? `<div class="description">${householdDescription}</div>` : ''}

          <p>PetForce helps families collaborate on pet care. Here's what you can do together:</p>

          <ul class="feature-list">
            <li>Track feeding schedules and portions</li>
            <li>Manage medications and vet appointments</li>
            <li>Share photos and memories</li>
            <li>Coordinate care tasks with family members</li>
            <li>Keep all pet information in one place</li>
          </ul>

          <div class="button-container">
            <a href="${inviteLink}" class="button">Join ${householdName}</a>
          </div>

          <p style="color: #6b7280; font-size: 14px; text-align: center;">
            Or enter this invite code manually in the app:
          </p>

          <div class="invite-code">${inviteCode}</div>

          <p class="note">
            This invite code will expire in 30 days. If you don't want to join this household, you can safely ignore this email.
          </p>
        </div>

        <div class="footer">
          <p>Made with ❤️ by PetForce</p>
          <p>
            <a href="https://petforce.app/privacy">Privacy Policy</a> |
            <a href="https://petforce.app/terms">Terms of Service</a> |
            <a href="https://petforce.app/help">Help Center</a>
          </p>
          <p style="margin-top: 20px; font-size: 12px; color: #9ca3af;">
            © ${new Date().getFullYear()} PetForce. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate plain text email version for clients that don't support HTML.
 */
function generateEmailText(options: {
  fromName: string;
  householdName: string;
  householdDescription?: string;
  inviteLink: string;
  inviteCode: string;
}): string {
  const { fromName, householdName, householdDescription, inviteLink, inviteCode } = options;

  return `
You're Invited to PetForce!

${fromName} has invited you to join their household: ${householdName}
${householdDescription ? `\n${householdDescription}\n` : ''}

PetForce helps families collaborate on pet care. Here's what you can do together:
- Track feeding schedules and portions
- Manage medications and vet appointments
- Share photos and memories
- Coordinate care tasks with family members
- Keep all pet information in one place

Join now: ${inviteLink}

Or enter this invite code manually in the app:
${inviteCode}

This invite code will expire in 30 days. If you don't want to join this household, you can safely ignore this email.

---
Made with ❤️ by PetForce
Privacy Policy: https://petforce.app/privacy
Terms of Service: https://petforce.app/terms
Help Center: https://petforce.app/help

© ${new Date().getFullYear()} PetForce. All rights reserved.
  `.trim();
}

/**
 * Provider-agnostic email sender.
 *
 * This is a placeholder implementation. In production, this would:
 * 1. Integrate with SendGrid, Mailgun, AWS SES, or similar service
 * 2. Handle bounce tracking and delivery receipts
 * 3. Manage email preferences and unsubscribe lists
 * 4. Track open rates and click rates
 *
 * @param options - Email sending options
 */
async function sendEmail(options: {
  to: string;
  from: string;
  replyTo: string;
  subject: string;
  html: string;
  text: string;
}): Promise<void> {
  // TODO: Integrate with SendGrid, Mailgun, or AWS SES
  logger.info('Email queued', {
    to: options.to,
    subject: options.subject,
    from: options.from,
  });

  // In production, this would send via email service:
  // Example with SendGrid:
  // const msg = {
  //   to: options.to,
  //   from: options.from,
  //   replyTo: options.replyTo,
  //   subject: options.subject,
  //   text: options.text,
  //   html: options.html,
  // };
  // await sgMail.send(msg);
  //
  // Example with AWS SES:
  // await ses.sendEmail({
  //   Source: options.from,
  //   Destination: { ToAddresses: [options.to] },
  //   Message: {
  //     Subject: { Data: options.subject },
  //     Body: {
  //       Text: { Data: options.text },
  //       Html: { Data: options.html },
  //     },
  //   },
  // });
}

/**
 * Send batch email invites to multiple recipients.
 *
 * More efficient than sending individual invites.
 *
 * @param invites - Array of email invite options
 */
export async function sendBatchEmailInvites(
  invites: EmailInviteOptions[]
): Promise<{ success: boolean; errors?: string[] }> {
  const results = await Promise.allSettled(
    invites.map(sendHouseholdEmailInvite)
  );

  const errors = results
    .filter((r) => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success))
    .map((r) =>
      r.status === 'rejected'
        ? r.reason?.message || 'Unknown error'
        : (r as PromiseFulfilledResult<{ success: boolean; error?: string }>).value.error || 'Unknown error'
    );

  logger.info('Batch email invites sent', {
    total: invites.length,
    successful: results.length - errors.length,
    failed: errors.length,
  });

  return {
    success: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}
