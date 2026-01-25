// Navigation types for React Native app

import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token: string };
  VerifyEmail: undefined;
  OAuthCallback: { accessToken: string; refreshToken: string };
  MagicLinkCallback: { token: string; type?: 'magiclink' | 'email' };
};

export type AppStackParamList = {
  Dashboard: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  App: undefined;
};

// Screen props types
export type WelcomeScreenProps = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;
export type LoginScreenProps = NativeStackScreenProps<AuthStackParamList, 'Login'>;
export type RegisterScreenProps = NativeStackScreenProps<AuthStackParamList, 'Register'>;
export type ForgotPasswordScreenProps = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;
export type ResetPasswordScreenProps = NativeStackScreenProps<AuthStackParamList, 'ResetPassword'>;
export type VerifyEmailScreenProps = NativeStackScreenProps<AuthStackParamList, 'VerifyEmail'>;
export type DashboardScreenProps = NativeStackScreenProps<AppStackParamList, 'Dashboard'>;
