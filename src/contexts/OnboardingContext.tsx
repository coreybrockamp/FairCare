import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = 'onboardingComplete';

type OnboardingContextType = {
  loading: boolean;
  showOnboarding: boolean;
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(
  undefined
);

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
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

  const resetOnboarding = async () => {
    try {
      await AsyncStorage.removeItem(ONBOARDING_KEY);
    } catch (e) {
      console.error('[Onboarding] failed to clear flag', e);
    }
    setShowOnboarding(true);
  };

  return (
    <OnboardingContext.Provider
      value={{ loading, showOnboarding, completeOnboarding, resetOnboarding }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return ctx;
}
