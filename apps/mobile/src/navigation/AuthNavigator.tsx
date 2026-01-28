// Auth Navigator - Handles all authentication screens

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AuthStackParamList } from './types';

// Import screens
import { UnifiedAuthScreen } from '../features/auth/screens/UnifiedAuthScreen';
import { WelcomeScreen } from '../features/auth/screens/WelcomeScreen';
import { LoginScreen } from '../features/auth/screens/LoginScreen';
import { RegisterScreen } from '../features/auth/screens/RegisterScreen';
import { ForgotPasswordScreen } from '../features/auth/screens/ForgotPasswordScreen';
import { ResetPasswordScreen } from '../features/auth/screens/ResetPasswordScreen';
import { VerifyEmailScreen } from '../features/auth/screens/VerifyEmailScreen';
import { OAuthCallbackScreen } from '../features/auth/screens/OAuthCallbackScreen';
import { MagicLinkCallbackScreen } from '../features/auth/screens/MagicLinkCallbackScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
      initialRouteName="UnifiedAuth"
    >
      {/* New unified auth screen (default entry point) */}
      <Stack.Screen name="UnifiedAuth" component={UnifiedAuthScreen} />

      {/* Legacy screens (deprecated, kept for backward compatibility) */}
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />

      {/* Supporting auth screens */}
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
      <Stack.Screen name="OAuthCallback" component={OAuthCallbackScreen} />
      <Stack.Screen name="MagicLinkCallback" component={MagicLinkCallbackScreen} />
    </Stack.Navigator>
  );
}
