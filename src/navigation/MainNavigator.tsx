import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/Home';
import ScanNavigator from './ScanNavigator';
import BillsScreen from '../screens/Bills';
import ProfileNavigator from './ProfileNavigator';

export type MainTabParamList = {
  Home: undefined;
  Scan: undefined;
  Bills: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

interface Props {
  initialTab?: 'Home' | 'Scan' | 'Bills' | 'Profile' | null;
}

const MainNavigator: React.FC<Props> = ({ initialTab }) => {
  return (
    <Tab.Navigator
      initialRouteName={initialTab ?? 'Home'}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Home') iconName = 'home';
          else if (route.name === 'Scan') iconName = 'scan';
          else if (route.name === 'Bills') iconName = 'document-text';
          else if (route.name === 'Profile') iconName = 'person';
          else iconName = 'home';

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#FF6B6B',
        tabBarInactiveTintColor: '#8B8B8B',
        tabBarStyle: { backgroundColor: '#FFFFFF', borderTopColor: '#f0f0f0' },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      })}
    >
        <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
        <Tab.Screen name="Scan" component={ScanNavigator} options={{ title: 'Scan' }} />
        <Tab.Screen name="Bills" component={BillsScreen} options={{ title: 'Bills' }} />
        <Tab.Screen name="Profile" component={ProfileNavigator} options={{ title: 'Profile' }} />
      </Tab.Navigator>
  );
};

export default MainNavigator;