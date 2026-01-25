import { StatusBar } from 'expo-status-bar';
import { createSupabaseClient } from '@petforce/auth';
import { RootNavigator } from './src/navigation/RootNavigator';

// Initialize Supabase client
// TODO: Set these environment variables in your .env file
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const legacyAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (supabaseUrl && (publishableKey || legacyAnonKey)) {
  createSupabaseClient(supabaseUrl, publishableKey, legacyAnonKey);
}

export default function App() {
  return (
    <>
      <RootNavigator />
      <StatusBar style="auto" />
    </>
  );
}
