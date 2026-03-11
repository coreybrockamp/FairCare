import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { OnboardingStackParamList } from '../../navigation/OnboardingNavigator';

type NavProp = StackNavigationProp<OnboardingStackParamList, 'Onboarding1'>;

interface Props {
  navigation: NavProp;
  onSkip: () => void;
}

const Onboarding1: React.FC<Props> = ({ navigation, onSkip }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.skip} onPress={onSkip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>
      <View style={styles.content}>
        <View style={styles.heroPlaceholder} />
        <Text style={styles.title}>Take back control of your medical bills</Text>
        <Text style={styles.stat}>80% of medical bills contain errors</Text>
      </View>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.nextButton} onPress={() => navigation.navigate('Onboarding2')}>
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  skip: { position: 'absolute', top: 40, right: 20 },
  skipText: { fontSize: 16, color: '#007bff' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  heroPlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: '#eee',
    borderRadius: 100,
    marginBottom: 30,
  },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  stat: { fontSize: 18, color: '#333', textAlign: 'center' },
  footer: { padding: 20 },
  nextButton: { backgroundColor: '#007bff', padding: 15, borderRadius: 8, alignItems: 'center' },
  nextButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
});

export default Onboarding1;