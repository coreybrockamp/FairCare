import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = 'onboardingComplete';

// simple list of tabs we might land on after onboarding
export type OnboardingInitialTab = 'Home' | 'Scan' | 'Bills' | 'Profile';

type OnboardingContextType = {
  loading: boolean;
  showOnboarding: boolean;
  completeOnboarding: (initialTab?: OnboardingInitialTab) => Promise<void>;
  resetOnboarding: () => Promise<void>;
  // if non-null, the Main navigator should use this as its initial tab
  initialTab: OnboardingInitialTab | null;
  clearInitialTab: () => void;
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(
  undefined
);

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [initialTab, setInitialTab] = useState<OnboardingInitialTab | null>(
    null
  );

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

  const completeOnboarding = async (initial?: OnboardingInitialTab) => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    } catch (e) {
      console.error('[Onboarding] failed to write flag', e);
    }
    if (initial) {
      setInitialTab(initial);
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

  const clearInitialTab = () => setInitialTab(null);

  return (
    <OnboardingContext.Provider
      value={{
        loading,
        showOnboarding,
        completeOnboarding,
        resetOnboarding,
        initialTab,
        clearInitialTab,
      }}
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
