// UI Constants
// Centralized configuration for all magic numbers in web app

/**
 * Animation Timings (milliseconds)
 */
export const ANIMATION_TIMINGS = {
  CONFETTI_DELAY: 500,
  CONFETTI_MIN_DURATION: 2000,
  CONFETTI_MAX_DURATION: 4000,
  CONFETTI_RANDOM_DELAY: 500,
  BUTTON_DEBOUNCE: 300,
} as const;

/**
 * UI Element Counts
 */
export const UI_COUNTS = {
  CONFETTI_PARTICLES: 50,
  COLOR_PALETTE_SIZE: 4,
} as const;

/**
 * Animation Values
 */
export const ANIMATION_VALUES = {
  CONFETTI_FALL_DISTANCE: 100, // Additional distance beyond window height
  CONFETTI_MAX_ROTATION: 360,
  WINDOW_HEIGHT_FALLBACK: 600, // Fallback when window height is unavailable
} as const;

/**
 * UI Color Palette
 */
export const UI_COLORS = {
  PRIMARY: '#2D9B87',
  SECONDARY: '#FF9F40',
  SUCCESS: '#4CAF50',
  INFO: '#2196F3',
  WARNING: '#FFC107',
  DANGER: '#EF4444',
} as const;

/**
 * Confetti Colors
 */
export const CONFETTI_COLORS = [
  UI_COLORS.PRIMARY,
  UI_COLORS.SECONDARY,
  UI_COLORS.SUCCESS,
  UI_COLORS.INFO,
] as const;

/**
 * Icon Sizes (pixels)
 */
export const ICON_SIZES = {
  SUCCESS_ICON_CONTAINER: 24,
  SUCCESS_ICON: 12,
  ERROR_ICON_CONTAINER: 20,
  ERROR_ICON: 10,
  CONFETTI_PARTICLE: 2,
} as const;

/**
 * Responsive Breakpoints (pixels)
 */
export const BREAKPOINTS = {
  XS: 0,
  SM: 576,
  MD: 768,
  LG: 992,
  XL: 1200,
  XXL: 1400,
} as const;

/**
 * Z-Index Layers
 */
export const Z_INDEX = {
  CONFETTI: 10,
  MODAL: 1000,
  TOAST: 2000,
  TOOLTIP: 3000,
} as const;
