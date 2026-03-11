import React, { useState, useEffect } from 'react';
import {
  View,
  Image,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { saveImageToStorage, readImageAsBase64 } from '../../services/storage';

const { width: screenWidth } = Dimensions.get('window');

interface PreviewScreenProps {
  navigation: StackNavigationProp<any>;
  route: any;
}

const PreviewScreen: React.FC<PreviewScreenProps> = ({ navigation, route }) => {
  const { photoUri } = route.params;
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirm = async () => {
    if (isProcessing) return;

    setIsProcessing(true);
    try {
      console.log('Preview: Confirming captured image, saving to storage...');

      // Save image to app storage
      const timestamp = Date.now();
      const fileName = `bill-${timestamp}.jpg`;
      const storagePath = await saveImageToStorage(photoUri, fileName);

      console.log('Preview: Image saved to storage');

      // Read as base64 for OCR
      const base64 = await readImageAsBase64(storagePath);
      console.log('Preview: Image converted to base64');

      // Navigate to processing screen
      navigation.navigate('Processing', {
        imageUri: storagePath,
        imageBase64: base64,
        fileName,
      });
    } catch (error: any) {
      console.error('Preview: Error confirming image:', error);
      Alert.alert('Error', error.message || 'Failed to process image');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetake = () => {
    console.log('Preview: User requested retake');
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleRetake} disabled={isProcessing}>
          <MaterialIcons name="close" size={28} color="#007bff" />
        </TouchableOpacity>
        <Text style={styles.title}>Preview</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.imageContainer}>
        <Image source={{ uri: photoUri }} style={styles.image} resizeMode="contain" />
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.button, styles.retakeButton]}
          onPress={handleRetake}
          disabled={isProcessing}
        >
          <MaterialIcons name="refresh" size={20} color="#007bff" />
          <Text style={styles.retakeButtonText}>Retake</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.confirmButton, isProcessing && styles.buttonDisabled]}
          onPress={handleConfirm}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <MaterialIcons name="check" size={20} color="#fff" />
              <Text style={styles.confirmButtonText}>Confirm</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  image: {
    width: screenWidth - 32,
    height: '100%',
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
  },
  controls: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  retakeButton: {
    borderWidth: 1.5,
    borderColor: '#007bff',
    backgroundColor: '#fff',
  },
  retakeButtonText: {
    color: '#007bff',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#007bff',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

export default PreviewScreen;