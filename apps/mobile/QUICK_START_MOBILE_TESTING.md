# Quick Start - Mobile Registration Testing

## TL;DR - What You Need to Test

5-minute smoke test for mobile registration flow.

## Prerequisites

- iOS Simulator or Android Emulator running
- Mobile app built and running (`npm run ios` or `npm run android`)

## 5-Minute Smoke Test

### Test 1: Happy Path (2 minutes)

1. Open app
2. Navigate to registration
3. Fill in:
   - Email: test@example.com
   - Password: SecurePass123!
   - Confirm: SecurePass123!
4. Tap Submit
5. **PASS if**:
   - Keyboard dismisses immediately
   - You feel haptic feedback (iOS)
   - Form goes into loading state
   - You navigate to verification screen
   - Email is displayed on verification screen

### Test 2: Offline Mode (1 minute)

1. Enable airplane mode on device/simulator
2. Navigate to registration
3. **PASS if**:
   - Yellow offline banner appears
   - Submit button is disabled
   - Trying to submit shows error haptic (iOS)

### Test 3: Screen Reader (2 minutes)

**iOS**:

1. Settings > Accessibility > VoiceOver > ON
2. Navigate to registration form
3. Swipe through form fields
4. **PASS if**: All fields are read aloud with clear labels

**Android**:

1. Settings > Accessibility > TalkBack > ON
2. Navigate to registration form
3. Swipe through form fields
4. **PASS if**: All fields are read aloud with clear labels

## Expected Behavior

### Loading State

- Button shows spinner
- All inputs disabled
- Keyboard dismissed
- No jank/stuttering

### Offline State

- Yellow banner at top
- Submit button disabled
- Clear message about offline status

### Success State

- Haptic feedback (iOS)
- Navigation to verification screen
- Email parameter passed correctly

### Error State

- Error haptic (iOS)
- Error message displayed
- Form re-enabled for retry

## Common Issues

### Keyboard Doesn't Dismiss

- **Expected**: Dismisses in <100ms
- **If not**: Check Keyboard.dismiss() is called
- **Report to**: Maya

### No Haptic Feedback

- **Expected**: Haptic on iOS only
- **If not**: Check device haptics are enabled (Settings > Sounds & Haptics > System Haptics)
- **Report to**: Maya

### Offline Banner Doesn't Show

- **Expected**: Shows immediately in airplane mode
- **If not**: Check NetInfo installation
- **Report to**: Maya

### Screen Reader Doesn't Announce

- **Expected**: Announces all state changes
- **If not**: Check accessibility settings enabled
- **Report to**: Maya

## Device Requirements

**Minimum**:

- 1 iOS device (simulator or real)
- 1 Android device (emulator or real)

**Recommended**:

- iPhone SE (small screen)
- iPhone 14 Pro (notch)
- Pixel 5 (Android)

## Pass Criteria

All 3 tests must pass on both iOS and Android.

## Full Testing Guide

See `MOBILE_REGISTRATION_TESTING.md` for comprehensive testing checklist.

## Questions?

- **Tucker** (QA) - Testing questions
- **Maya** (Mobile) - Implementation questions

---

**Status**: Ready for Testing
**Updated**: 2026-01-28
