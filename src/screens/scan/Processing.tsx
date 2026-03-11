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
import { StackNavigationProp } from '@react-navigation/stack';
// OCR no longer used; parsing happens via parse-bill edge function

interface ProcessingScreenProps {
  navigation: StackNavigationProp<any>;
  route: any;
}

const ProcessingScreen: React.FC<ProcessingScreenProps> = ({ navigation, route }) => {
  const { imageUri, imageBase64, fileName } = route.params;
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processImage = async () => {
      try {
        console.log('Processing: Starting bill parse via edge function');
        setIsProcessing(true);

        // call parse-bill directly using base64 payload
        const parsed: any = await import('../../services/billParser').then(m =>
          m.parseBill({ imageBase64 })
        );
        console.log('Processing: parse-bill returned', parsed);

        // create database row and save parsed data
        const bill: any = await import('../../services/billParser').then(m =>
          m.createBill('', imageUri)
        );
        if (!bill || !bill.id) throw new Error('Failed to create bill record');
        await import('../../services/billParser').then(m =>
          m.saveParsedBill(bill.id, parsed)
        );

        // navigate to final results screen showing parsed bill
        navigation.replace('BillResults', { billId: bill.id, imageUri });
      } catch (err: any) {
        console.error('Processing: Error during OCR:', err);
        setError(err.message || 'An error occurred while processing the image');
        setIsProcessing(false);
      }
    };

    processImage();
  }, [imageUri, imageBase64, fileName, navigation]);

  const handleRetry = () => {
    // same as initial processing
    setError(null);
    setIsProcessing(true);
    const run = async () => {
      try {
        const parsed: any = await import('../../services/billParser').then(m =>
          m.parseBill({ imageBase64 })
        );
        const bill: any = await import('../../services/billParser').then(m =>
          m.createBill('', imageUri)
        );
        if (!bill || !bill.id) throw new Error('Failed to create bill record');
        await import('../../services/billParser').then(m =>
          m.saveParsedBill(bill.id, parsed)
        );
        navigation.replace('BillResults', { billId: bill.id, imageUri });
      } catch (err: any) {
        console.error('Processing: Retry failed:', err);
        setError(err.message || 'An error occurred while processing the image');
        setIsProcessing(false);
      }
    };
    run();
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
            <Text style={styles.subtitle}>Parsing bill image...</Text>
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