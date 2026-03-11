import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import CameraScreen from '../screens/scan/Camera';
import PreviewScreen from '../screens/scan/Preview';
import ProcessingScreen from '../screens/scan/Processing';
import ResultsScreen from '../screens/scan/Results';

export type ScanStackParamList = {
  Camera: undefined;
  Preview: undefined;
  Processing: undefined;
  Results: undefined;
};

const Stack = createStackNavigator<ScanStackParamList>();

const ScanNavigator: React.FC = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Camera" component={CameraScreen} />
      <Stack.Screen name="Preview" component={PreviewScreen} />
      <Stack.Screen name="Processing" component={ProcessingScreen} />
      <Stack.Screen name="Results" component={ResultsScreen} />
    </Stack.Navigator>
  );
};

export default ScanNavigator;