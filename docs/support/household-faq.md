# Household Management FAQ

**Last Updated**: 2026-02-02
**For**: Customer Success Team

This FAQ covers common questions and issues related to PetForce's household management system.

---

## Creating a Household

### Q: How do I create a household?

**A**: After completing registration, navigate to **Onboarding → Create Household**. Enter your household name (2-50 characters, letters/numbers/spaces only) and an optional description (up to 200 characters). Click **Create Household** to generate your unique invite code.

### Q: Can I belong to multiple households?

**A**: No, Phase 1 supports one household per user. To join a different household, you must first leave your current household. Future phases may support multiple households.

### Q: What happens if I try to create a household while already in one?

**A**: The system will show an error message: "You are already a member of a household. Please leave your current household before creating a new one." You must leave first, then create a new household.

### Q: Why was my household name rejected?

**A**: Household names must meet these requirements:
- Minimum 2 characters, maximum 50 characters
- Only letters, numbers, and spaces allowed
- No special characters or punctuation
- No HTML or script tags (security protection)

### Q: Can I change my household name after creation?

**A**: Phase 1 does not support changing household names. You would need to create a new household. Future phases may add this feature.

---

## Invite Codes

### Q: How do invite codes work?

**A**: Each household has a unique invite code in the format `PREFIX-WORD-WORD` (e.g., "ZEDER-ALPHA-BRAVO"). Share this code with family members to invite them to join your household. Codes are case-insensitive and can be entered with or without dashes.

### Q: How long are invite codes valid?

**A**: By default, invite codes expire after **30 days**. Leaders can regenerate codes at any time, which creates a new code and invalidates the old one.

### Q: My invite code expired, what do I do?

**A**: As a household leader, you can regenerate a new code by:
1. Going to **Household Settings**
2. Clicking **Regenerate Invite Code**
3. Confirming the action
4. Sharing the new code with members

**Important**: Old codes are immediately invalidated when you regenerate.

### Q: Someone tried to use an old invite code, why didn't it work?

**A**: When you regenerate an invite code, the old code is immediately invalidated for security reasons. Only the most recent code will work. Have the person use the current code displayed in your household dashboard.

### Q: Can I customize my invite code?

**A**: No, invite codes are automatically generated for security and uniqueness. The system ensures each household has a unique code.

### Q: How many times can an invite code be used?

**A**: Invite codes can be used by multiple people until the household reaches its capacity (15 members) or the code expires. Each use creates a join request that must be approved by the leader.

---

## Join Requests

### Q: I submitted a join request, now what?

**A**: Wait for the household leader to review and approve your request. You'll receive a notification when your request is processed. The leader sees all pending requests in their household dashboard.

### Q: How long do join requests stay pending?

**A**: Join requests remain pending indefinitely until the household leader approves or rejects them. There is no automatic expiration.

### Q: Can I cancel my join request?

**A**: Yes, you can withdraw your request at any time before it's processed by:
1. Viewing your pending request status
2. Clicking **Withdraw Request**
3. Confirming the action

After withdrawing, you can submit a new request to the same or different household.

### Q: I was rejected, can I try again?

**A**: Yes, you can submit a new join request with the household's invite code. However, the leader may reject repeated requests. Consider discussing directly with the household leader if you believe there was a misunderstanding.

### Q: Why can't I join a household?

**Possible reasons**:
- **Invalid invite code**: Check that you entered the code correctly (case-insensitive, dashes optional)
- **Expired invite code**: Ask the leader for a current code
- **Household at capacity**: The household has 15 members (maximum)
- **Already in a household**: Leave your current household first
- **Rate limiting**: You've submitted too many join requests (5 per hour limit)

---

## Member Management

### Q: How do I remove a member?

**A**: Only household leaders can remove members:
1. Go to **Household Settings → Manage Members**
2. Find the member in the list
3. Click **Remove Member** next to their name
4. Confirm the action

The member will immediately lose access to the household.

### Q: What happens when a member is removed?

**A**: When a member is removed:
- Their status changes to "Removed" immediately
- They lose access to household data
- Their session may be invalidated (logged out)
- They receive a notification about the removal
- They can submit a new join request if they wish to return

### Q: Can I re-join after being removed?

**A**: Yes, you can submit a new join request using the household's current invite code. However, the leader who removed you may reject your request. Consider communicating with the household leader to resolve any issues first.

### Q: Can a leader remove themselves?

**A**: No, leaders cannot remove themselves. To leave a household as a leader, use **Leave Household**, which will automatically transfer leadership to another member (if available).

---

## Leadership

### Q: How do I transfer leadership?

**A**: Leadership is transferred when a leader leaves the household:
1. Go to **Household Settings → Leave Household**
2. Optionally designate a successor (another active member)
3. Confirm the action

If you don't designate a successor, the longest-standing member automatically becomes the new leader.

### Q: Can I remove myself as leader?

**A**: No, use **Leave Household** instead. This will transfer leadership to another member (if available) and remove you from the household.

### Q: What happens if the leader leaves and there are no other members?

**A**: The household remains but becomes inactive. Only the leader is removed. If new members join (using the invite code before it expires), the first approved member becomes the new leader.

### Q: Can there be multiple leaders?

**A**: No, each household has exactly one leader at a time. This ensures clear responsibility for member management and household settings.

---

## Temporary Members

### Q: How do I add a pet sitter or dog walker temporarily?

**A**: Use the **Add Temporary Member** feature (Phase 2):
1. Go to **Household Settings → Temporary Access**
2. Click **Add Temporary Member**
3. Set their expiration date
4. Share the invite code or email invite

**Note**: This feature is coming in Phase 2.

### Q: What happens when temporary access expires?

**A**: When the expiration date is reached:
- Member automatically loses access
- Status changes to "Expired"
- They receive a notification
- Leader can extend their access if needed

### Q: Can I extend temporary access?

**A**: Yes, leaders can extend expiration dates for temporary members before or after expiration by editing the member's details in **Manage Members**.

### Q: How is a temporary member different from a regular member?

**A**: Temporary members:
- Have an expiration date
- Are marked with a "Temporary" badge
- Automatically lose access when expired
- Cannot become household leaders
- Are intended for pet sitters, dog walkers, or short-term caregivers

---

## Troubleshooting

### Q: I can't see my household after joining

**Possible causes**:
- Your join request is still pending approval
- You were removed from the household
- There's a session issue (try logging out and back in)

**Solution**: Check your join request status or contact the household leader.

### Q: Invite code shows as invalid but I'm sure it's correct

**Troubleshooting steps**:
1. Verify the code with the household leader
2. Check if the leader recently regenerated the code
3. Ensure you're not already in a household
4. Try entering the code without dashes
5. Check for typos (O vs 0, I vs 1, etc.)

### Q: I was removed unexpectedly

**A**: Member removal is a deliberate action by the household leader. Check if:
- There was miscommunication about household membership
- You violated household rules or agreements
- The leader made an accidental removal (contact them)

If you believe this was an error, communicate directly with the household leader to resolve the issue.

### Q: App is slow when managing household

**A**: Large households (10+ members) may experience slower load times. This is expected behavior. If performance is consistently poor:
- Check your internet connection
- Clear browser cache
- Try a different browser
- Report persistent issues to PetForce support

---

## Rate Limits and Security

### Q: Why can't I create another household?

**A**: Household creation is rate-limited to **5 households per day** per user to prevent spam and abuse. Wait 24 hours before creating additional households.

### Q: Why can't I regenerate my invite code again?

**A**: Invite code regeneration is limited to **10 times per day** per household for security reasons. Wait 24 hours before regenerating again.

### Q: Why can't I remove more members?

**A**: Member removal is limited to **20 members per day** per household to prevent abuse. Wait 24 hours before removing additional members.

### Q: My join requests keep failing

**A**: Join request submission is rate-limited to **5 requests per hour** per user. Wait an hour before submitting more requests.

---

## Contact Support

For issues not covered in this FAQ:
- **Technical issues**: support@petforce.com
- **Account issues**: accounts@petforce.com
- **Abuse reports**: abuse@petforce.com
- **General questions**: help@petforce.com

**Response time**: 24-48 hours for most inquiries, 1-2 hours for critical issues.
