import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { StackNavigationProp } from '@react-navigation/stack';
import { OnboardingStackParamList } from '../../navigation/OnboardingNavigator';
import { parseInsuranceCard, saveInsuranceCard } from '../../services/insuranceCardParser';

type NavProp = StackNavigationProp<OnboardingStackParamList, 'Onboarding4'>;

interface Props {
  navigation: NavProp;
  onComplete: (initialTab?: 'Home' | 'Scan' | 'Bills' | 'Profile') => void;
}

const COLORS = {
  primary: '#FF6B6B',
  background: '#FFF8F0',
  card: '#FFFFFF',
  text: '#2D2D2D',
  textSecondary: '#8B8B8B',
  success: '#6BCB77',
};

const getVal = (field: any): string | null => {
  if (!field) return null;
  if (typeof field === 'object' && field.value !== undefined) return field.value;
  return String(field);
};

const Onboarding4: React.FC<Props> = ({ navigation, onComplete }) => {
  const [scanning, setScanning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [parsedData, setParsedData] = useState<any>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);

  const processImage = async (uri: string, base64: string) => {
    setScanning(true);
    try {
      setImageUri(uri);
      setImageBase64(base64);
      const parsed = await parseInsuranceCard(base64);
      setParsedData(parsed);
    } catch (err: any) {
      Alert.alert('Scan failed', err.message || 'Could not read insurance card. Try again.');
    } finally {
      setScanning(false);
    }
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow camera access to take a photo of your insurance card.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        base64: true,
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.[0]?.base64) return;
      await processImage(result.assets[0].uri, result.assets[0].base64);
    } catch (err: any) {
      Alert.alert('Scan failed', err.message || 'Could not read insurance card. Try again.');
    }
  };

  const handleUploadFromLibrary = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow photo access to scan your insurance card.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        base64: true,
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.[0]?.base64) return;
      await processImage(result.assets[0].uri, result.assets[0].base64);
    } catch (err: any) {
      Alert.alert('Scan failed', err.message || 'Could not read insurance card. Try again.');
    }
  };

  const handleSave = async () => {
    if (!parsedData) return;
    setSaving(true);
    try {
      await saveInsuranceCard(parsedData, imageBase64 || undefined, imageUri || undefined);
      onComplete();
    } catch (err: any) {
      Alert.alert('Save failed', err.message || 'Could not save card.');
    } finally {
      setSaving(false);
    }
  };

  const company = getVal(parsedData?.insurance_company);
  const memberId = getVal(parsedData?.member_id);
  const plan = getVal(parsedData?.plan_name);
  const groupNum = getVal(parsedData?.group_number);
  const planType = getVal(parsedData?.plan_type);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {!parsedData ? (
          <>
            <View style={styles.emojiCard}>
              <Text style={styles.emoji}>💳</Text>
            </View>

            <Text style={styles.title}>Add your insurance card</Text>
            <Text style={styles.subtitle}>
              We'll use this to find more errors and pre-fill your dispute letters
            </Text>
          </>
        ) : (
          <>
            <View style={[styles.emojiCard, { backgroundColor: '#E8F5E9' }]}>
              <Text style={styles.emoji}>✅</Text>
            </View>

            <Text style={styles.title}>Card scanned!</Text>

            {imageUri && (
              <Image
                source={{ uri: imageUri }}
                style={styles.cardImage}
                resizeMode="cover"
              />
            )}

            <View style={styles.previewCard}>
              {company && (
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>Company</Text>
                  <Text style={styles.previewValue}>{company}</Text>
                </View>
              )}
              {memberId && (
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>Member ID</Text>
                  <Text style={styles.previewValue}>{memberId}</Text>
                </View>
              )}
              {plan && (
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>Plan</Text>
                  <Text style={styles.previewValue}>{plan}</Text>
                </View>
              )}
              {groupNum && (
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>Group #</Text>
                  <Text style={styles.previewValue}>{groupNum}</Text>
                </View>
              )}
              {planType && (
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>Type</Text>
                  <Text style={styles.previewValue}>{planType}</Text>
                </View>
              )}
            </View>
          </>
        )}
      </View>

      <View style={styles.footer}>
        {!parsedData ? (
          scanning ? (
            <View style={styles.scanButton}>
              <ActivityIndicator size="small" color="#FFFFFF" />
            </View>
          ) : (
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.scanButton, styles.buttonHalf]}
                onPress={handleTakePhoto}
                activeOpacity={0.8}
              >
                <Text style={styles.scanButtonText}>Take Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.libraryButton, styles.buttonHalf]}
                onPress={handleUploadFromLibrary}
                activeOpacity={0.8}
              >
                <Text style={styles.libraryButtonText}>Upload from Library</Text>
              </TouchableOpacity>
            </View>
          )
        ) : (
          <>
            <TouchableOpacity
              style={styles.scanButton}
              onPress={handleSave}
              activeOpacity={0.8}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.scanButtonText}>Looks good, save it</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.rescanButton}
              onPress={() => {
                setParsedData(null);
                setImageBase64(null);
                setImageUri(null);
              }}
              activeOpacity={0.6}
            >
              <Text style={styles.rescanText}>Rescan card</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => onComplete()}
          activeOpacity={0.6}
        >
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>

        <View style={styles.dots}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={[styles.dot, styles.dotActive]} />
        </View>
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emojiCard: {
    width: 100,
    height: 100,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  emoji: {
    fontSize: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 17,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 28,
  },
  cardImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  previewCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  previewLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  previewValue: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'right',
    marginLeft: 16,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  buttonHalf: {
    flex: 1,
  },
  scanButton: {
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  libraryButton: {
    backgroundColor: '#E8E8E8',
    height: 56,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  libraryButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
  },
  rescanButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  rescanText: {
    fontSize: 15,
    color: COLORS.primary,
    fontWeight: '600',
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  skipText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D9D9D9',
  },
  dotActive: {
    backgroundColor: COLORS.primary,
    width: 24,
  },
});

export default Onboarding4;
