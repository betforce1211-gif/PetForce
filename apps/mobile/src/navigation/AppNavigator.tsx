// App Navigator - Handles authenticated app screens

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AppStackParamList } from './types';

// Import screens
import { DashboardScreen } from '../features/auth/screens/DashboardScreen';

const Stack = createNativeStackNavigator<AppStackParamList>();

export function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
    </Stack.Navigator>
  );
}
