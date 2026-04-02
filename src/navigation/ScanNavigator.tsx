import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import CameraScreen from '../screens/scan/Camera';
import PreviewScreen from '../screens/scan/Preview';
import ProcessingScreen from '../screens/scan/Processing';
import ResultsScreen from '../screens/scan/Results';
import DisputePreviewScreen from '../screens/DisputePreview';
import EOBUploadScreen from '../screens/EOBUpload';
import EOBComparisonScreen from '../screens/EOBComparison';

export type ScanStackParamList = {
  Camera: undefined;
  Preview: { photoUri: string };
  Processing: { imageUri: string; imageBase64: string; fileName: string };
  Results: { ocrResult: any; imageUri: string; fileName: string };
  BillResults: { billId: string; imageUri: string };
  DisputePreview: { letter: string };
  EOBUpload: { billId: string };
  EOBComparison: { billId: string; eobId: string };
};

const Stack = createStackNavigator<ScanStackParamList>();

const ScanNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Camera"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Camera" component={CameraScreen} />
      <Stack.Screen name="Preview" component={PreviewScreen} />
      <Stack.Screen name="Processing" component={ProcessingScreen} />
      <Stack.Screen name="Results" component={ResultsScreen} />
      <Stack.Screen name="BillResults" component={
        require('../screens/scan/BillResults').default
      } />
      <Stack.Screen name="DisputePreview" component={DisputePreviewScreen} />
      <Stack.Screen name="EOBUpload" component={EOBUploadScreen} />
      <Stack.Screen name="EOBComparison" component={EOBComparisonScreen} />
    </Stack.Navigator>
  );
};

export default ScanNavigator;
