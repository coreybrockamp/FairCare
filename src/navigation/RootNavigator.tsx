import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../hooks/useAuth';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const LoadingScreen: React.FC = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
    <ActivityIndicator size="large" color="#007bff" />
  </View>
);

const ErrorScreen: React.FC<{ error: string }> = ({ error }) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
    <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>Navigation Error</Text>
    <Text style={{ fontSize: 12, color: '#666', textAlign: 'center', paddingHorizontal: 20 }}>
      {error}
    </Text>
  </View>
);

const RootNavigator: React.FC = () => {
  try {
    const auth = useAuth();

    console.log('[RootNavigator] Loading:', auth.loading, '| User:', !!auth.user);

    // Show loading screen while checking auth state
    if (auth.loading === true) {
      console.log('[RootNavigator] Showing loading screen');
      return <LoadingScreen />;
    }

    // Determine if user is authenticated
    const isAuthenticated = auth.user !== null && auth.user !== undefined;
    console.log('[RootNavigator] Is authenticated:', isAuthenticated);

    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen 
            name="Main" 
            component={MainNavigator} 
            options={{ animationEnabled: false }} 
          />
        ) : (
          <Stack.Screen 
            name="Auth" 
            component={AuthNavigator} 
            options={{ animationEnabled: false }} 
          />
        )}
      </Stack.Navigator>
    );
  } catch (error) {
    console.error('[RootNavigator] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error in RootNavigator';
    return <ErrorScreen error={errorMessage} />;
  }
};

export default RootNavigator;