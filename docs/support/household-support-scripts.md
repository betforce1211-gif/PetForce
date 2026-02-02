# Household Support Scripts

**Last Updated**: 2026-02-02
**For**: Customer Success Team

Pre-written scripts for common household management support scenarios. Use these to provide consistent, professional responses.

---

## Script 1: User Reports "Invalid Invite Code"

**Customer Message**: "I'm trying to join my family's household but the invite code isn't working. I've triple-checked it."

**Support Script**:

> Hi [Customer Name],
>
> I'm sorry you're having trouble joining your family's household. Let's troubleshoot this together.
>
> **First, please verify:**
> 1. The invite code format is `PREFIX-WORD-WORD` (e.g., "ZEDER-ALPHA-BRAVO")
> 2. The code is case-insensitive, so "ALPHA" and "alpha" both work
> 3. You can enter it with or without dashes
>
> **Common causes of "Invalid invite code":**
> - **Code was regenerated**: The household leader may have created a new code, invalidating the old one. Please ask them to check their household dashboard for the current code.
> - **Code expired**: Invite codes expire after 30 days. The leader can regenerate a new code in Household Settings.
> - **Typo in the code**: Double-check for similar-looking characters (O vs 0, I vs 1).
> - **You're already in a household**: You can only be in one household at a time. Check your account status.
>
> **Next steps:**
> 1. Confirm the current invite code with the household leader
> 2. If the code is still not working, please provide me with the first 3 characters of the code (e.g., "ZED") so I can verify in our system
> 3. If needed, I can assist the household leader in regenerating a new code
>
> Let me know if the issue persists!
>
> Best regards,
> [Your Name]
> PetForce Customer Success

---

## Script 2: User's Join Request Stuck "Pending"

**Customer Message**: "I submitted a request to join my household 3 days ago but it's still pending. What's going on?"

**Support Script**:

> Hi [Customer Name],
>
> Thank you for reaching out! Join requests remain pending until the household leader reviews them. Here's what's happening:
>
> **Why your request is pending:**
> - Join requests don't auto-expire; they wait for leader action
> - The household leader may not have checked their dashboard yet
> - They may be waiting to verify your identity before approving
>
> **What you can do:**
> 1. **Contact the household leader directly** to let them know you're waiting. They'll see your request in their Household Dashboard under "Pending Requests."
> 2. If you'd like to cancel your request, you can click "Withdraw Request" and try joining a different household
> 3. If the leader is unresponsive, you can create your own household instead
>
> **What I can do:**
> - I can verify that your join request is in the system (Status: Pending)
> - I can confirm which household you requested to join
> - Unfortunately, I cannot approve requests on behalf of household leaders (only they can approve/reject)
>
> Would you like me to verify the request status, or would you prefer to withdraw it and create your own household?
>
> Best regards,
> [Your Name]
> PetForce Customer Success

---

## Script 3: Member Removed Unexpectedly

**Customer Message**: "I was removed from my household without warning! What happened?"

**Support Script**:

> Hi [Customer Name],
>
> I'm sorry to hear you were removed from your household unexpectedly. Let me help you understand what happened.
>
> **What I found:**
> - Your account shows you were removed from household [ID] on [Date] at [Time]
> - This action was performed by the household leader: [Leader Name or "the household leader"]
> - Member removal is a manual action that only household leaders can perform
>
> **Important to know:**
> - Member removals are intentional actions by the household leader (they cannot happen accidentally or automatically)
> - As a platform, we cannot override household leader decisions or reinstate members without their approval
> - You have not lost any of your personal PetForce data (pets, records, etc.)
>
> **Your options:**
> 1. **Contact the household leader** to discuss why you were removed and whether it was a mistake
> 2. **Request to rejoin** by submitting a new join request with the household's invite code (if the leader agrees)
> 3. **Create your own household** and continue using PetForce independently
> 4. **Join a different household** if you have access to another household's invite code
>
> **If you believe this was abusive behavior:**
> If you feel this removal was part of a pattern of harassment or abuse, please contact our Trust & Safety team at abuse@petforce.com with details.
>
> I understand this is frustrating. Is there anything else I can help you with?
>
> Best regards,
> [Your Name]
> PetForce Customer Success

---

## Script 4: Leadership Transfer Issue

**Customer Message**: "I left my household but it seems like there are two leaders now / no leader / leadership didn't transfer correctly."

**Support Script**:

> Hi [Customer Name],
>
> Thank you for reporting this leadership transfer issue. This is a critical data integrity problem that requires immediate attention.
>
> **What I need from you:**
> 1. Household ID (found in household settings)
> 2. When you left the household (date and approximate time)
> 3. Did you designate a successor when leaving? (Yes/No)
> 4. Screenshots of the household member list showing the leadership issue (if possible)
>
> **What I'll do:**
> 1. Verify the household data in our system
> 2. Check for duplicate leaders or missing leaders
> 3. Review the leadership transfer logs
> 4. **Escalate to Engineering immediately** (this is a P0 data integrity issue)
>
> **Typical resolution time:**
> - Issue verified: Within 2 hours
> - Engineering fix: 4-8 hours for critical issues
> - You'll receive an email update when resolved
>
> **Temporary workaround:**
> - If the household has no leader, the first member who tries to perform a leader action may be auto-promoted
> - If there are two leaders, avoid making household changes until we resolve this
>
> I'm escalating this to our engineering team right now. You should hear from us within 2 hours with an update.
>
> Best regards,
> [Your Name]
> PetForce Customer Success
>
> **[INTERNAL NOTE: Create P0 ticket, tag @engineering, include household ID and timestamp]**

---

## Script 5: User Can't Find Invite Code

**Customer Message**: "I created a household but I can't find my invite code. Where is it?"

**Support Script**:

> Hi [Customer Name],
>
> I can help you locate your household invite code!
>
> **Where to find your invite code:**
> 1. Go to your **Household Dashboard** (main household screen after login)
> 2. Look for the "Invite Code" section, usually prominently displayed near the top
> 3. The code format is `PREFIX-WORD-WORD` (e.g., "ZEDER-ALPHA-BRAVO")
> 4. There's usually a "Copy" button next to it for easy sharing
>
> **Alternative locations:**
> - **Household Settings** → "Invite & Share" section
> - **Mobile app**: Tap "Share Household" → "View Invite Code"
>
> **If you still can't find it:**
> - Make sure you're logged into the account that created the household
> - Verify you're viewing the correct household (if you've been in multiple)
> - Try refreshing the page or restarting the app
>
> **If the code still doesn't appear:**
> Please send me a screenshot of your Household Dashboard (with any personal info blurred) and I'll investigate further. There may be a display issue we need to fix.
>
> **Security reminder:**
> - Only share your invite code with people you trust
> - You can regenerate it anytime if you think it's been compromised
> - Each household has a unique code
>
> Let me know if you find it or need further assistance!
>
> Best regards,
> [Your Name]
> PetForce Customer Success

---

## Script 6: Household at Capacity

**Customer Message**: "I'm trying to add someone to my household but it says it's at capacity. What does that mean?"

**Support Script**:

> Hi [Customer Name],
>
> Thank you for reaching out! Your household has reached the maximum member capacity.
>
> **Household capacity limits:**
> - **Maximum members**: 15 per household (based on research with competitor PetNote+)
> - **Current members**: [X] active members
> - **Why this limit exists**: To ensure app performance and prevent abuse
>
> **Your options:**
> 1. **Remove inactive members**: If any members are no longer active, you can remove them to make space (Household Settings → Manage Members)
> 2. **Create a second household**: For very large families, consider creating a separate household (e.g., "Smith Family - House 1" and "Smith Family - House 2")
> 3. **Use temporary member access**: For pet sitters or dog walkers, use temporary member slots (coming in Phase 2)
>
> **Request capacity increase:**
> If your family genuinely needs more than 15 members, we can consider a capacity increase on a case-by-case basis:
> - Email support@petforce.com with "Household Capacity Increase Request" in the subject
> - Explain your use case (e.g., multi-generational family, foster home, etc.)
> - Provide your household ID
> - Typical review time: 3-5 business days
>
> **Future plans:**
> We're exploring higher capacity options for Premium accounts in future releases.
>
> Would you like me to help you identify inactive members to remove, or would you prefer to request a capacity increase?
>
> Best regards,
> [Your Name]
> PetForce Customer Success

---

## Script 7: Rate Limit Hit

**Customer Message**: "It says I've made too many requests and need to wait. I'm not spamming! What's going on?"

**Support Script**:

> Hi [Customer Name],
>
> I apologize for the inconvenience! You've hit a rate limit, which is a security measure to prevent abuse. Let me explain what happened and how to resolve it.
>
> **Rate limits in PetForce:**
> - **Household creation**: 5 per day
> - **Join requests**: 5 per hour
> - **Invite code regeneration**: 10 per day
> - **Member removal**: 20 per day
>
> **Why we have rate limits:**
> - Prevents spam and abuse
> - Protects system performance
> - Ensures fair usage for all users
>
> **Based on your message, you hit the [TYPE] limit:**
> [Select appropriate response below]
>
> **For join request limit:**
> You submitted [X] join requests in the past hour. This typically happens if:
> - You're trying multiple households to find the right one
> - An invite code wasn't working and you retried multiple times
> - You're testing the feature
>
> **Resolution**: Wait 1 hour from your first request, then try again. In the meantime, verify you have the correct invite code with the household leader.
>
> **For household creation limit:**
> You created [X] households today. This limit resets at midnight.
>
> **Resolution**: Wait until tomorrow to create additional households. If you need to merge or delete test households, let me know and I can help.
>
> **If you believe this is an error:**
> - Provide your account email
> - Tell me what action you were trying to perform
> - I'll review your account activity logs
>
> **For legitimate high-volume needs** (e.g., managing multiple properties, kennels, etc.), we can discuss custom rate limits.
>
> Let me know how I can help!
>
> Best regards,
> [Your Name]
> PetForce Customer Success

---

## Escalation Criteria

**Escalate to Engineering when:**
- Multiple leaders or no leader in household (data integrity issue)
- Invite codes not generating correctly
- Member removal not working (status not updating)
- Database errors or timeouts
- Session invalidation failures
- Rate limit cache issues

**Escalate to Trust & Safety when:**
- Reports of household abuse or harassment
- Excessive household creation (>10 per day)
- Suspicious member removal patterns
- Invite code sharing/selling
- Account takeover concerns

**Escalate to Customer Success Manager when:**
- Leader vs. member disputes (interpersonal conflicts)
- Capacity increase requests (>15 members)
- VIP customer issues
- Feature requests with business justification
- Policy questions or edge cases

---

## Response Time SLAs

- **Critical (P0)**: 1-2 hours - Data integrity issues, security concerns
- **High (P1)**: 4-8 hours - Feature not working, user blocked from access
- **Medium (P2)**: 24 hours - Questions, minor bugs, clarifications
- **Low (P3)**: 48 hours - Feature requests, enhancements, nice-to-haves

---

## Quick Reference: Common Error Messages

| Error Message | Meaning | Solution |
|--------------|---------|----------|
| "Invalid invite code" | Code doesn't exist, expired, or regenerated | Verify current code with leader |
| "Already in a household" | User is already an active member | Leave current household first |
| "Household at capacity" | 15 member limit reached | Remove inactive members or create second household |
| "Rate limit exceeded" | Too many requests in time window | Wait for time window to reset |
| "Not household leader" | Only leaders can perform this action | Contact household leader |
| "Expired invite code" | Code is older than 30 days | Leader must regenerate code |
| "Duplicate request" | User already has pending request | Wait for leader to respond or withdraw request |

---

## Internal Tools

**Database Queries** (for support team with database access):

```sql
-- Check household leadership
SELECT h.id, h.name, h.leader_id, u.email as leader_email
FROM households h
JOIN users u ON h.leader_id = u.id
WHERE h.id = '[HOUSEHOLD_ID]';

-- Check member status
SELECT hm.user_id, u.email, hm.role, hm.status, hm.joined_at
FROM household_members hm
JOIN users u ON hm.user_id = u.id
WHERE hm.household_id = '[HOUSEHOLD_ID]'
ORDER BY hm.joined_at;

-- Check pending join requests
SELECT jr.id, jr.user_id, u.email, jr.status, jr.requested_at
FROM household_join_requests jr
JOIN users u ON jr.user_id = u.id
WHERE jr.household_id = '[HOUSEHOLD_ID]' AND jr.status = 'pending'
ORDER BY jr.requested_at;
```

**Admin Panel Actions:**
- Verify household data integrity
- Check rate limit violations
- View audit logs for household actions
- Manually invalidate sessions (with approval)
- Generate diagnostic reports

---

## Updates and Feedback

This document is maintained by the Customer Success team. If you encounter a common scenario not covered here, or if a script needs improvement:

- **Slack**: #customer-success-docs
- **Email**: cs-team@petforce.com
- **Update frequency**: Monthly review, immediate updates for critical issues
