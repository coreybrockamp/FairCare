import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const CameraScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text>Camera Screen</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CameraScreen;