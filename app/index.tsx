import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/contexts/AuthContext';

export default function RootIndex() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const value = await AsyncStorage.getItem('@onboarding_completed');
        if (value === 'true') {
          setHasCompletedOnboarding(true);
        }
      } catch (e) {
        console.error('Error reading onboarding status', e);
      } finally {
        setOnboardingChecked(true);
      }
    };
    checkOnboarding();
  }, []);

  useEffect(() => {
    // Only proceed if we have finished checking both auth and onboarding
    if (authLoading || !onboardingChecked) return;

    // Timeout to prevent flickering and ensure router is mounted
    const timeout = setTimeout(() => {
      if (!hasCompletedOnboarding) {
        router.replace('/onboarding');
      } else if (!user) {
        router.replace('/auth');
      } else {
        router.replace('/(tabs)');
      }
    }, 100);

    return () => clearTimeout(timeout);
  }, [authLoading, onboardingChecked, hasCompletedOnboarding, user, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#1DB954" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
