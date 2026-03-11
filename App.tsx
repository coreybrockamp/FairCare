import React from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './src/contexts/AuthContext';
import { OnboardingProvider } from './src/contexts/OnboardingContext';
import RootNavigator from './src/navigation/RootNavigator';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>App Error</Text>
          <Text style={{ fontSize: 14, color: '#666', textAlign: 'center', paddingHorizontal: 20 }}>
            {this.state.error?.message || 'Unknown error'}
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  console.log('App: Rendering');
  return (
    <ErrorBoundary>
      <AuthProvider>
          <OnboardingProvider>
            <NavigationContainer
          fallback={
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <Text>Loading Navigation...</Text>
            </View>
          }
          onReady={() => console.log('NavigationContainer ready')}
        >
          <RootNavigator />
            </NavigationContainer>
          </OnboardingProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}