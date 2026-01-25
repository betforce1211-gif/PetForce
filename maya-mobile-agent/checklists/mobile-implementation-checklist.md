# Maya - Mobile Implementation Quality Checklist

**Version**: 1.0
**Feature**: [Feature Name]
**Date**: [YYYY-MM-DD]
**Reviewer**: Maya (Mobile Development)

## Checklist Items

### Offline-First & Network Handling
- [ ] Offline-first architecture implemented (network unreliability assumed)
- [ ] Graceful degradation when network unavailable
- [ ] Data sync strategy defined and implemented
- [ ] Loading, error, and offline states handled

### Platform Conventions
- [ ] iOS Human Interface Guidelines respected
- [ ] Android Material Design guidelines followed
- [ ] Platform-native navigation patterns used
- [ ] Safe areas respected (notch, home indicator)

### Touch & Interaction
- [ ] Touch targets meet minimum size (44pt iOS, 48dp Android)
- [ ] Touch feedback provided (haptics on iOS, ripple on Android)
- [ ] Gestures follow platform conventions
- [ ] Keyboard handling implemented correctly

### Performance & Optimization
- [ ] Renders at 60fps without jank
- [ ] App startup time meets targets (< 2s cold start)
- [ ] Memory usage optimized (< 100MB baseline)
- [ ] Battery impact minimized (background tasks limited)

### Permissions & States
- [ ] All permission states handled (granted, denied, not determined)
- [ ] Permission requests justified with clear messaging
- [ ] Dark mode supported
- [ ] Screen rotation handled appropriately

### Testing & Device Coverage
- [ ] Tested on real devices (not just simulators)
- [ ] Small, standard, and large screen sizes tested
- [ ] iOS and Android platforms tested
- [ ] Edge cases tested (interruptions, low memory, background/foreground)

## Summary

**Status**: [ ] ✅ APPROVED / [ ] ⚠️ APPROVED WITH NOTES / [ ] ❌ REJECTED

**Notes**:
[Any platform-specific concerns, performance issues, or device compatibility notes]

**Signature**: Maya - [Date]
