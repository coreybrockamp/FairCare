import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { ScanStackParamList } from '../navigation/ScanNavigator';
import { parseEOB, saveEOB } from '../services/eobParser';

const COLORS = {
  primary: '#FF6B6B',
  background: '#FFF8F0',
  card: '#FFFFFF',
  text: '#2D2D2D',
  textSecondary: '#8B8B8B',
};

interface Props {
  navigation: StackNavigationProp<ScanStackParamList, 'EOBUpload'>;
  route: { params: { billId: string } };
}

const EOBUpload: React.FC<Props> = ({ navigation, route }) => {
  const { billId } = route.params;
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState('');

  const pickImage = async (useCamera: boolean) => {
    const pickerFn = useCamera
      ? ImagePicker.launchCameraAsync
      : ImagePicker.launchImageLibraryAsync;

    const result = await pickerFn({
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleUpload = async () => {
    if (!imageUri) return;

    try {
      setLoading(true);
      setStatusText('Reading image...');

      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      setStatusText('Analyzing your EOB...');
      const parsed = await parseEOB(base64);

      setStatusText('Saving...');
      const saved = await saveEOB(billId, parsed);

      navigation.replace('EOBComparison', { billId, eobId: saved.id });
    } catch (err: any) {
      console.error('EOB upload error', err);
      Alert.alert('Error', err.message || 'Failed to process EOB');
    } finally {
      setLoading(false);
      setStatusText('');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>

        <View style={styles.headerCard}>
          <Text style={styles.title}>Upload your EOB</Text>
          <Text style={styles.subtitle}>
            Take a photo or choose from your library
          </Text>
        </View>

        {imageUri ? (
          <View style={styles.previewCard}>
            <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="contain" />
            <TouchableOpacity
              style={styles.changeButton}
              onPress={() => setImageUri(null)}
            >
              <Text style={styles.changeButtonText}>Choose different image</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.pickersRow}>
            <TouchableOpacity
              style={styles.pickerCard}
              onPress={() => pickImage(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="camera-outline" size={40} color={COLORS.primary} />
              <Text style={styles.pickerLabel}>Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.pickerCard}
              onPress={() => pickImage(false)}
              activeOpacity={0.8}
            >
              <Ionicons name="images-outline" size={40} color={COLORS.primary} />
              <Text style={styles.pickerLabel}>Photo Library</Text>
            </TouchableOpacity>
          </View>
        )}

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>{statusText}</Text>
          </View>
        ) : imageUri ? (
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={handleUpload}
            activeOpacity={0.8}
          >
            <Text style={styles.uploadButtonText}>Analyze EOB</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  headerCard: {
    backgroundColor: COLORS.card,
    padding: 20,
    borderRadius: 24,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginTop: 6,
  },
  pickersRow: {
    flexDirection: 'row',
    gap: 16,
  },
  pickerCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  pickerLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 12,
  },
  previewCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  preview: {
    width: '100%',
    height: 300,
    borderRadius: 12,
  },
  changeButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  changeButtonText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 32,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 12,
  },
  uploadButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});

export default EOBUpload;
