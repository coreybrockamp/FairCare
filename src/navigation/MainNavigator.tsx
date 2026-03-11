import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
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
    >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Scan" component={ScanNavigator} />
        <Tab.Screen name="Bills" component={BillsScreen} />
        <Tab.Screen name="Profile" component={ProfileNavigator} />
      </Tab.Navigator>
  );
};

export default MainNavigator;