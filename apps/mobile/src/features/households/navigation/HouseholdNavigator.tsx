/**
 * Household Navigator
 *
 * Stack navigator for household-related screens.
 * Integrates into main app navigation.
 */

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  HouseholdOnboardingScreen,
  CreateHouseholdScreen,
  JoinHouseholdScreen,
  HouseholdDashboardScreen,
  HouseholdSettingsScreen,
} from '../screens';

export type HouseholdStackParamList = {
  HouseholdOnboarding: undefined;
  CreateHousehold: undefined;
  JoinHousehold: { code?: string }; // Support deep link with code
  HouseholdDashboard: undefined;
  HouseholdSettings: undefined;
};

const Stack = createNativeStackNavigator<HouseholdStackParamList>();

export function HouseholdNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#2D9B87',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="HouseholdOnboarding"
        component={HouseholdOnboardingScreen}
        options={{
          title: 'Set Up Household',
          headerShown: false, // Custom header in component
        }}
      />
      <Stack.Screen
        name="CreateHousehold"
        component={CreateHouseholdScreen}
        options={{
          title: 'Create Household',
        }}
      />
      <Stack.Screen
        name="JoinHousehold"
        component={JoinHouseholdScreen}
        options={{
          title: 'Join Household',
        }}
      />
      <Stack.Screen
        name="HouseholdDashboard"
        component={HouseholdDashboardScreen}
        options={{
          title: 'Household',
        }}
      />
      <Stack.Screen
        name="HouseholdSettings"
        component={HouseholdSettingsScreen}
        options={{
          title: 'Settings',
        }}
      />
    </Stack.Navigator>
  );
}

/**
 * Deep linking configuration for household routes
 *
 * Usage in main app linking config:
 * ```typescript
 * const linking = {
 *   prefixes: ['petforce://', 'https://petforce.app'],
 *   config: {
 *     screens: {
 *       Household: {
 *         screens: {
 *           JoinHousehold: {
 *             path: 'household/join',
 *             parse: {
 *               code: (code: string) => code,
 *             },
 *           },
 *         },
 *       },
 *     },
 *   },
 * };
 * ```
 *
 * Deep link examples:
 * - petforce://household/join?code=ZEDER-ALPHA
 * - https://petforce.app/household/join?code=ZEDER-ALPHA
 */
export const householdLinkingConfig = {
  screens: {
    HouseholdOnboarding: 'household/onboarding',
    CreateHousehold: 'household/create',
    JoinHousehold: {
      path: 'household/join',
      parse: {
        code: (code: string) => code?.toUpperCase(),
      },
    },
    HouseholdDashboard: 'household/dashboard',
    HouseholdSettings: 'household/settings',
  },
};
