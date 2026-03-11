import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import Onboarding1 from '../screens/onboarding/Onboarding1';
import Onboarding2 from '../screens/onboarding/Onboarding2';
import Onboarding3 from '../screens/onboarding/Onboarding3';

export type OnboardingStackParamList = {
  Onboarding1: undefined;
  Onboarding2: undefined;
  Onboarding3: undefined;
};

const Stack = createStackNavigator<OnboardingStackParamList>();

export type OnboardingInitialTab = 'Home' | 'Scan' | 'Bills' | 'Profile';

interface Props {
  onFinish: (initialTab?: OnboardingInitialTab) => void;
}

const OnboardingNavigator: React.FC<Props> = ({ onFinish }) => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Onboarding1">
      {props => <Onboarding1 {...props} onSkip={onFinish} />}
    </Stack.Screen>
    <Stack.Screen name="Onboarding2">
      {props => <Onboarding2 {...props} onSkip={onFinish} />}
    </Stack.Screen>
    <Stack.Screen name="Onboarding3">
      {props => <Onboarding3 {...props} onComplete={onFinish} />}
    </Stack.Screen>
  </Stack.Navigator>
);

export default OnboardingNavigator;