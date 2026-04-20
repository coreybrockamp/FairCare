import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
  SafeAreaView,
  ActivityIndicator,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useOnboarding } from '../contexts/OnboardingContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase';
import { StackNavigationProp } from '@react-navigation/stack';
import { ProfileStackParamList } from '../navigation/ProfileNavigator';
import {
  parseInsuranceCard,
  saveInsuranceCard,
  getInsuranceCard,
  deleteInsuranceCard,
} from '../services/insuranceCardParser';

const COLORS = {
  primary: '#FF6B6B',
  background: '#FFF8F0',
  card: '#FFFFFF',
  text: '#2D2D2D',
  textSecondary: '#8B8B8B',
  accent: '#FFD93D',
  success: '#6BCB77',
};

const ProfileScreen: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigation = useNavigation<StackNavigationProp<ProfileStackParamList>>();
  
  // Profile form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(true);

  // Insurance card state
  const [insuranceCard, setInsuranceCard] = useState<any>(null);
  const [scanningCard, setScanningCard] = useState(false);

  // Load profile on mount
  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) return;
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (error && error.code !== 'PGRST116') {
          console.error('Error loading profile:', error);
          return;
        }
        
        if (data) {
          setFirstName(data.first_name || '');
          setLastName(data.last_name || '');
          setAddress(data.address || '');
          setCity(data.city || '');
          setState(data.state || '');
          setZip(data.zip || '');
          setIsEditing(false);
        }
      } catch (err: any) {
        console.error('Profile load error:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadProfile();
  }, [user?.id]);

  // Load insurance card
  useFocusEffect(
    React.useCallback(() => {
      const loadCard = async () => {
        const card = await getInsuranceCard();
        setInsuranceCard(card);
      };
      loadCard();
    }, [])
  );

  const processInsuranceImage = async (uri: string, base64: string) => {
    setScanningCard(true);
    try {
      const parsed = await parseInsuranceCard(base64);
      const saved = await saveInsuranceCard(parsed, base64, uri);
      setInsuranceCard(saved);
      Alert.alert('Success', 'Insurance card saved');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to scan insurance card');
    } finally {
      setScanningCard(false);
    }
  };

  const handleTakeCardPhoto = async () => {
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
      await processInsuranceImage(result.assets[0].uri, result.assets[0].base64);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to scan insurance card');
    }
  };

  const handleUploadCardFromLibrary = async () => {
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
      await processInsuranceImage(result.assets[0].uri, result.assets[0].base64);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to scan insurance card');
    }
  };

  const handleScanInsuranceCard = () => {
    Alert.alert('Scan Insurance Card', 'Choose how to add your card', [
      { text: 'Take Photo', onPress: handleTakeCardPhoto },
      { text: 'Upload from Library', onPress: handleUploadCardFromLibrary },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleRemoveInsuranceCard = () => {
    Alert.alert('Remove Card', 'Are you sure you want to remove your insurance card?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteInsuranceCard();
            setInsuranceCard(null);
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to remove card');
          }
        },
      },
    ]);
  };

  const handleSaveProfile = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          first_name: firstName || null,
          last_name: lastName || null,
          address: address || null,
          city: city || null,
          state: state || null,
          zip: zip || null,
        })
        .eq('user_id', user.id);

      if (error) throw error;
      setIsEditing(false);
      Alert.alert('Success', 'Profile saved successfully');
    } catch (err: any) {
      console.error('Profile save error:', err);
      Alert.alert('Error', err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await new Promise<boolean>(resolve => {
      Alert.alert(
        'Delete All Data',
        'This will permanently remove your bills, eobs and account data. Continue?',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Delete', style: 'destructive', onPress: () => resolve(true) },
        ],
      );
    });
    if (!confirmed) return;
    try {
      console.log('[Profile] deleting user data');
      if (user?.id) {
        await supabase.from('insurance_cards').delete().eq('user_id', user.id);
        await supabase.from('eobs').delete().eq('user_id', user.id);
        await supabase.from('bills').delete().eq('user_id', user.id);
        await supabase.from('profiles').delete().eq('user_id', user.id);
      }
    } catch (err: any) {
      console.error('[Profile] delete failure', err);
      Alert.alert('Error', err.message || 'Unable to delete data');
    } finally {
      signOut();
    }
  };

  const { resetOnboarding } = useOnboarding();
  const handleResetOnboarding = async () => {
    try {
      await resetOnboarding();
      Alert.alert('Onboarding reset', 'The onboarding flag has been cleared.');
    } catch (err: any) {
      console.error('[Profile] reset onboarding failed', err);
      Alert.alert('Error', err.message || 'Unable to reset onboarding');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerSection}>
          <Text style={styles.headerTitle}>Your Profile</Text>
          <Text style={styles.headerSubtitle}>
            {user?.email}
          </Text>
        </View>

        {/* Profile Form Card */}
        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <Text style={styles.sectionDescription}>
            This information is used to personalize your dispute letters with your contact details.
          </Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>First Name</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.inputDisabled]}
              placeholder="John"
              value={firstName}
              onChangeText={setFirstName}
              placeholderTextColor={COLORS.textSecondary}
              editable={isEditing}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Last Name</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.inputDisabled]}
              placeholder="Doe"
              value={lastName}
              onChangeText={setLastName}
              placeholderTextColor={COLORS.textSecondary}
              editable={isEditing}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Mailing Address</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.inputDisabled]}
              placeholder="123 Main Street"
              value={address}
              onChangeText={setAddress}
              placeholderTextColor={COLORS.textSecondary}
              editable={isEditing}
            />
          </View>

          <View style={styles.rowGroup}>
            <View style={[styles.fieldGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>City</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                placeholder="San Francisco"
                value={city}
                onChangeText={setCity}
                placeholderTextColor={COLORS.textSecondary}
                editable={isEditing}
              />
            </View>
            <View style={[styles.fieldGroup, { flex: 0.4 }]}>
              <Text style={styles.label}>State</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                placeholder="CA"
                value={state}
                onChangeText={setState}
                maxLength={2}
                placeholderTextColor={COLORS.textSecondary}
                editable={isEditing}
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>ZIP Code</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.inputDisabled]}
              placeholder="94105"
              value={zip}
              onChangeText={setZip}
              keyboardType="number-pad"
              placeholderTextColor={COLORS.textSecondary}
              editable={isEditing}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, isEditing ? styles.saveButton : styles.editButton]}
            onPress={isEditing ? handleSaveProfile : () => setIsEditing(true)}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={[styles.buttonText, !isEditing && styles.editButtonText]}>
                {isEditing ? 'Save Profile' : 'Edit Profile'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Insurance Card */}
        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Insurance Card</Text>
          {insuranceCard ? (
            <>
              {insuranceCard.image_url && (
                <View style={styles.cardImageWrapper}>
                  <Image
                    source={{ uri: insuranceCard.image_url }}
                    style={styles.cardImage}
                    resizeMode="cover"
                  />
                </View>
              )}
              <View style={styles.insuranceInfo}>
                {insuranceCard.insurance_company && (
                  <View style={styles.insuranceRow}>
                    <Text style={styles.insuranceLabel}>Insurance Company</Text>
                    <Text style={styles.insuranceValue}>{insuranceCard.insurance_company}</Text>
                  </View>
                )}
                {insuranceCard.member_id && (
                  <View style={styles.insuranceRow}>
                    <Text style={styles.insuranceLabel}>Member ID</Text>
                    <Text style={styles.insuranceValue}>{insuranceCard.member_id}</Text>
                  </View>
                )}
                {insuranceCard.group_number && (
                  <View style={styles.insuranceRow}>
                    <Text style={styles.insuranceLabel}>Group Number</Text>
                    <Text style={styles.insuranceValue}>{insuranceCard.group_number}</Text>
                  </View>
                )}
                {insuranceCard.plan_name && (
                  <View style={styles.insuranceRow}>
                    <Text style={styles.insuranceLabel}>Plan Name</Text>
                    <Text style={styles.insuranceValue}>{insuranceCard.plan_name}</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity
                style={[styles.button, styles.editButton]}
                onPress={handleScanInsuranceCard}
                disabled={scanningCard}
              >
                {scanningCard ? (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                ) : (
                  <Text style={[styles.buttonText, styles.editButtonText]}>Update Card</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.removeCardButton}
                onPress={handleRemoveInsuranceCard}
              >
                <Text style={styles.removeCardText}>Remove Card</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.sectionDescription}>
                Add your insurance card to pre-fill dispute letters and catch more billing errors.
              </Text>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleScanInsuranceCard}
                disabled={scanningCard}
              >
                {scanningCard ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>Add Insurance Card</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Account Actions */}
        <View style={styles.actionsCard}>
          <Text style={styles.sectionTitle}>Account</Text>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('PrivacyPolicy')}
          >
            <Text style={styles.actionButtonText}>Privacy Policy</Text>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonBorder]}
            onPress={handleResetOnboarding}
          >
            <Text style={styles.actionButtonText}>Reset Onboarding</Text>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonBorder, styles.deleteButton]}
            onPress={handleDelete}
          >
            <Text style={[styles.actionButtonText, styles.deleteText]}>Delete My Data</Text>
            <Text style={[styles.actionArrow, styles.deleteText]}>›</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.signOutButton}
          onPress={signOut}
        >
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  formCard: {
    backgroundColor: COLORS.card,
    marginHorizontal: 16,
    marginVertical: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
  },
  sectionDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 16,
    lineHeight: 18,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  rowGroup: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
    backgroundColor: '#FAFAFA',
  },
  button: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  editButton: {
    backgroundColor: COLORS.card,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  editButtonText: {
    color: COLORS.primary,
  },
  inputDisabled: {
    backgroundColor: '#F0F0F0',
    borderColor: '#E8E8E8',
    color: COLORS.text,
  },
  actionsCard: {
    backgroundColor: COLORS.card,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  actionButtonBorder: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
  },
  actionArrow: {
    fontSize: 18,
    color: COLORS.textSecondary,
  },
  deleteButton: {
    backgroundColor: '#FFF5F5',
  },
  deleteText: {
    color: '#DC3545',
  },
  signOutButton: {
    marginHorizontal: 16,
    marginVertical: 20,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  cardImageWrapper: {
    marginTop: 12,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
  },
  insuranceInfo: {
    marginBottom: 16,
  },
  insuranceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  insuranceLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  insuranceValue: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'right',
    marginLeft: 16,
  },
  removeCardButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 4,
  },
  removeCardText: {
    fontSize: 14,
    color: '#DC3545',
    fontWeight: '500',
  },
});

export default ProfileScreen;