import React from 'react';
import { View, ActivityIndicator } from 'react-native';
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
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <ActivityIndicator size="large" color="#007bff" />
  </View>
);

const RootNavigator: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading === true) {
    return <LoadingScreen />;
  }

  const isAuthenticated = user !== null && user !== undefined;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Stack.Screen name="Main" component={MainNavigator} options={{ animationEnabled: false }} />
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} options={{ animationEnabled: false }} />
      )}
    </Stack.Navigator>
  );
};

export default RootNavigator;