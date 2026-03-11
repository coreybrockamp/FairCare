import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = 'onboardingComplete';

export function useOnboarding() {
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const checkFlag = async () => {
      try {
        const value = await AsyncStorage.getItem(ONBOARDING_KEY);
        setShowOnboarding(value !== 'true');
      } catch (e) {
        console.error('[Onboarding] failed to read flag', e);
        setShowOnboarding(true);
      } finally {
        setLoading(false);
      }
    };
    checkFlag();
  }, []);

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    } catch (e) {
      console.error('[Onboarding] failed to write flag', e);
    }
    setShowOnboarding(false);
  };

  return { loading, showOnboarding, completeOnboarding };
}
