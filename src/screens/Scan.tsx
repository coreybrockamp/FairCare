import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import UploadBill, { UploadedFile } from '../components/UploadBill';
import { extractTextFromImage } from '../services/ocr';
import { readImageAsBase64 } from '../services/storage';

const { width: screenWidth } = Dimensions.get('window');

interface ScanScreenProps {
  navigation: StackNavigationProp<any>;
}

const ScanScreen: React.FC<ScanScreenProps> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState<'capture' | 'upload'>('capture');
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const handleStartCapture = () => {
    console.log('ScanScreen: Starting camera capture flow');
    navigation.navigate('Camera');
  };

  const handleFileSelected = async (file: UploadedFile) => {
    console.log('ScanScreen: File selected:', file.name);
    setSelectedFile(file);

    // Auto-process the selected file
    try {
      setIsUploading(true);
      setUploadProgress(20);

      // Read file as base64
      const base64 = await readImageAsBase64(file.uri);
      setUploadProgress(50);

      // Process with OCR
      const ocrResult = await extractTextFromImage(file.uri, base64);
      setUploadProgress(100);

      console.log('ScanScreen: File processing complete');

      // Navigate to results
      navigation.navigate('Results', {
        ocrResult,
        imageUri: file.uri,
        fileName: file.name,
      });
    } catch (error: any) {
      console.error('ScanScreen: Error processing file:', error);
      // Error will be shown in UploadBill component
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Tab Navigation */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'capture' && styles.activeTab]}
          onPress={() => setActiveTab('capture')}
        >
          <MaterialIcons
            name="photo-camera"
            size={20}
            color={activeTab === 'capture' ? '#007bff' : '#999'}
          />
          <Text style={[styles.tabText, activeTab === 'capture' && styles.activeTabText]}>
            Capture
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'upload' && styles.activeTab]}
          onPress={() => setActiveTab('upload')}
        >
          <MaterialIcons
            name="upload-file"
            size={20}
            color={activeTab === 'upload' ? '#007bff' : '#999'}
          />
          <Text style={[styles.tabText, activeTab === 'upload' && styles.activeTabText]}>
            Upload
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'capture' ? (
        <View style={styles.captureContent}>
          <View style={styles.illustration}>
            <MaterialIcons name="photo-camera" size={80} color="#007bff" />
          </View>
          <Text style={styles.title}>Capture Bill</Text>
          <Text style={styles.subtitle}>Use your camera to scan bills and receipts</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={handleStartCapture}>
            <MaterialIcons name="photo-camera" size={20} color="#fff" />
            <Text style={styles.primaryButtonText}>Start Camera</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <UploadBill
          onFileSelected={handleFileSelected}
          onUploadProgress={setUploadProgress}
          isUploading={isUploading}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007bff',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#999',
  },
  activeTabText: {
    color: '#007bff',
  },
  captureContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  illustration: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  primaryButton: {
    flexDirection: 'row',
    backgroundColor: '#007bff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ScanScreen;