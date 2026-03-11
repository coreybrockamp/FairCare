import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { Bill, EOB } from '../types/database';
import { supabase } from '../services/supabase';
import { StackNavigationProp } from '@react-navigation/stack';
import { ProfileStackParamList } from '../navigation/ProfileNavigator';

const ProfileScreen: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigation = useNavigation<StackNavigationProp<ProfileStackParamList>>();

  const handleDelete = async () => {
    const confirmed = await new Promise<boolean>(resolve => {
      require('react-native').Alert.alert(
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
      // remove bills and eobs rows
      if (user?.id) {
        await supabase.from('eobs').delete().eq('user_id', user.id);
        await supabase.from('bills').delete().eq('user_id', user.id);
      }
      // attempt to delete auth user
      // Supabase client cannot delete the auth user from the client side; the
      // account will be removed if you trigger this via an admin key. We simply
      // sign out after deleting data.
    } catch (err: any) {
      console.error('[Profile] delete failure', err);
      require('react-native').Alert.alert('Error', err.message || 'Unable to delete data');
    } finally {
      signOut();
    }
  };

  // temporary dev helper to clear the onboarding flag so the flow shows again
  const handleResetOnboarding = async () => {
    try {
      await AsyncStorage.removeItem('onboardingComplete');
      Alert.alert('Onboarding reset', 'The onboarding flag has been cleared. The app will reload now.');
      // reload the JS bundle so the root navigator re-reads storage
      await Updates.reloadAsync();
    } catch (err: any) {
      console.error('[Profile] reset onboarding failed', err);
      Alert.alert('Error', err.message || 'Unable to reset onboarding');
    }
  };

  return (
    <View style={styles.container}>
      <Text>Profile Screen</Text>
      <Text>Email: {user?.email}</Text>
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('PrivacyPolicy')}>
        <Text style={styles.buttonText}>Privacy Policy</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleDelete}>
        <Text style={styles.buttonText}>Delete My Data</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={signOut}>
        <Text style={styles.buttonText}>Sign Out</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.resetButton]}
        onPress={handleResetOnboarding}
      >
        <Text style={styles.buttonText}>Reset Onboarding</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
  },
  resetButton: {
    backgroundColor: '#ff9500',
  },
});

export default ProfileScreen;