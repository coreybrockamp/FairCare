import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { OnboardingStackParamList } from '../../navigation/OnboardingNavigator';

type NavProp = StackNavigationProp<OnboardingStackParamList, 'Onboarding2'>;

interface Props {
  navigation: NavProp;
  onSkip: () => void;
}

const Onboarding2: React.FC<Props> = ({ navigation, onSkip }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.skip} onPress={onSkip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>
      <View style={styles.content}>
        <Text style={styles.title}>How it works</Text>
        <View style={styles.step}>
          <Text style={styles.stepNumber}>1</Text>
          <Text style={styles.stepText}>Scan</Text>
        </View>
        <View style={styles.step}>
          <Text style={styles.stepNumber}>2</Text>
          <Text style={styles.stepText}>Detect</Text>
        </View>
        <View style={styles.step}>
          <Text style={styles.stepNumber}>3</Text>
          <Text style={styles.stepText}>Dispute</Text>
        </View>
      </View>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.nextButton} onPress={() => navigation.navigate('Onboarding3')}>
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
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 30 },
  step: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  stepNumber: { fontSize: 20, fontWeight: 'bold', width: 30 },
  stepText: { fontSize: 18, marginLeft: 10 },
  footer: { padding: 20 },
  nextButton: { backgroundColor: '#007bff', padding: 15, borderRadius: 8, alignItems: 'center' },
  nextButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
});

export default Onboarding2;