// Root Navigator - Switches between Auth and App navigators

import { NavigationContainer, type LinkingOptions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '@petforce/auth';
import { useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { AuthNavigator } from './AuthNavigator';
import { AppNavigator } from './AppNavigator';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

// Deep linking configuration
const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['petforce://', 'https://petforce.app'],
  config: {
    screens: {
      Auth: {
        screens: {
          Welcome: 'auth/welcome',
          Login: 'auth/login',
          Register: 'auth/register',
          ForgotPassword: 'auth/forgot-password',
          ResetPassword: 'auth/reset-password',
          VerifyEmail: 'auth/verify-email',
          OAuthCallback: 'auth/callback',
          MagicLinkCallback: 'auth/magic-link',
        },
      },
      App: {
        screens: {
          Dashboard: 'dashboard',
        },
      },
    },
  },
};

export function RootNavigator() {
  const { isAuthenticated, isHydrated, refreshSession } = useAuthStore();

  useEffect(() => {
    // Try to refresh the session on mount if we have tokens
    if (isHydrated && !isAuthenticated) {
      refreshSession();
    }
  }, [isHydrated, isAuthenticated, refreshSession]);

  // Show loading while hydrating from storage
  if (!isHydrated) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2D9B87" />
      </View>
    );
  }

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
      >
        {isAuthenticated ? (
          <Stack.Screen name="App" component={AppNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
  },
});
