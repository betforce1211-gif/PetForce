// Shared Design Tokens
// Used across web and mobile apps for consistent theming

/**
 * Color Palette
 * Pet-friendly, warm, and approachable colors
 */
export const colors = {
  // Primary - Pet-friendly teal
  primary: {
    50: '#EEF8F7',
    100: '#D6EEE9',
    200: '#ADDDD3',
    300: '#7FC9BB',
    400: '#4DB4A3',
    500: '#2D9B87', // Main brand color
    600: '#238075',
    700: '#1A655F',
    800: '#124A47',
    900: '#0F3D3A',
  },

  // Secondary - Warm accent (friendly orange)
  secondary: {
    50: '#FFF5E6',
    100: '#FFE6CC',
    200: '#FFCC99',
    300: '#FFB366',
    400: '#FF9F40', // Main accent
    500: '#E68A2E',
    600: '#CC7629',
    700: '#B36623',
    800: '#99561E',
    900: '#804619',
  },

  // Neutral - Grays for text and backgrounds
  neutral: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },

  // Semantic colors
  success: '#4CAF50',
  error: '#EF4444',
  warning: '#FFC107',
  info: '#2196F3',

  // Special
  white: '#FFFFFF',
  black: '#000000',
} as const;

/**
 * Typography
 * Font families, sizes, weights, and line heights
 */
export const typography = {
  fonts: {
    heading: 'Poppins, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', // Friendly but professional
    body: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', // Clean and readable
    mono: '"SF Mono", Monaco, "Cascadia Code", "Courier New", monospace',
  },

  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
    '6xl': 60,
  },

  weights: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },

  lineHeights: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

/**
 * Spacing Scale
 * Consistent spacing for layouts, padding, margins
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
  '4xl': 96,
} as const;

/**
 * Border Radius
 * Rounded corners for UI elements
 */
export const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
} as const;

/**
 * Shadows
 * Elevation and depth for cards, modals, etc.
 */
export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
} as const;

/**
 * Breakpoints
 * Responsive design breakpoints
 */
export const breakpoints = {
  xs: 320,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

/**
 * Z-Index Scale
 * Layering for modals, dropdowns, tooltips
 */
export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  fixed: 1200,
  modalBackdrop: 1300,
  modal: 1400,
  popover: 1500,
  tooltip: 1600,
} as const;

/**
 * Complete Theme Object
 * Export all tokens as a single object
 */
export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  breakpoints,
  zIndex,
} as const;

// TypeScript type for the theme
export type Theme = typeof theme;
