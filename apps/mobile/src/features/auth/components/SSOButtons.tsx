// SSO Buttons - Google and Apple sign-in for React Native

import { View, StyleSheet } from 'react-native';
import { Button } from '../../../components/ui/Button';
import { useOAuth } from '@petforce/auth';

export interface SSOButtonsProps {
  onSuccess?: () => void;
}

export function SSOButtons({ onSuccess: _onSuccess }: SSOButtonsProps) {
  const { loginWithGoogle, loginWithApple, isLoading } = useOAuth();

  const handleGoogleSignIn = async () => {
    await loginWithGoogle();
    // OAuth flow will handle navigation via deep link
  };

  const handleAppleSignIn = async () => {
    await loginWithApple();
    // OAuth flow will handle navigation via deep link
  };

  return (
    <View style={styles.container}>
      <Button
        variant="outline"
        size="lg"
        onPress={handleGoogleSignIn}
        isLoading={isLoading}
        style={styles.button}
      >
        Continue with Google
      </Button>

      <Button
        variant="outline"
        size="lg"
        onPress={handleAppleSignIn}
        isLoading={isLoading}
        style={styles.button}
      >
        Continue with Apple
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  button: {
    width: '100%',
  },
});
