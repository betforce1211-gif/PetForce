// @petforce/auth
// Shared authentication package for web and mobile

// API
export * from './api/supabase-client';
export * from './api/auth-api';
export * from './api/magic-link';
export * from './api/oauth';
export * from './api/biometrics';
export * from './api/household-api';
export * from './api/household-analytics-api';

// Types
export * from './types/auth';

// Utils
export * from './utils/validation';
export * from './utils/storage';
export * from './utils/logger';
export * from './utils/metrics';
export * from './utils/window-adapter';

// Config
export * from './config/constants';

// Hooks
export * from './hooks';

// Stores
export * from './stores';
