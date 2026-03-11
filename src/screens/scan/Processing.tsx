import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { extractTextFromImage } from '../../services/ocr';

interface ProcessingScreenProps {
  navigation: NativeStackNavigationProp<any>;
  route: any;
}

const ProcessingScreen: React.FC<ProcessingScreenProps> = ({ navigation, route }) => {
  const { imageUri, imageBase64, fileName } = route.params;
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processImage = async () => {
      try {
        console.log('Processing: Starting OCR extraction...');
        setIsProcessing(true);

        const ocrResult = await extractTextFromImage(imageUri, imageBase64);

        console.log('Processing: OCR complete, success:', ocrResult.success);

        if (!ocrResult.success) {
          throw new Error(ocrResult.error || 'Failed to extract text from image');
        }

        // Navigate to results screen
        navigation.replace('Results', {
          ocrResult,
          imageUri,
          fileName,
        });
      } catch (err: any) {
        console.error('Processing: Error during OCR:', err);
        setError(err.message || 'An error occurred while processing the image');
        setIsProcessing(false);
      }
    };

    processImage();
  }, [imageUri, imageBase64, fileName, navigation]);

  const handleRetry = () => {
    setError(null);
    setIsProcessing(true);
    const processImage = async () => {
      try {
        console.log('Processing: Retrying OCR extraction...');
        const ocrResult = await extractTextFromImage(imageUri, imageBase64);

        if (!ocrResult.success) {
          throw new Error(ocrResult.error || 'Failed to extract text from image');
        }

        navigation.replace('Results', {
          ocrResult,
          imageUri,
          fileName,
        });
      } catch (err: any) {
        console.error('Processing: Retry failed:', err);
        setError(err.message || 'An error occurred while processing the image');
        setIsProcessing(false);
      }
    };
    processImage();
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {isProcessing && !error ? (
          <>
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#007bff" />
            </View>
            <Text style={styles.title}>Processing Bill</Text>
            <Text style={styles.subtitle}>Extracting text from image...</Text>
          </>
        ) : error ? (
          <>
            <MaterialIcons name="error-outline" size={64} color="#d32f2f" />
            <Text style={styles.title}>Processing Failed</Text>
            <Text style={styles.errorMessage}>{error}</Text>
            <View style={styles.buttons}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : null}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  loaderContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: '#d32f2f',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 24,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  retryButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProcessingScreen;