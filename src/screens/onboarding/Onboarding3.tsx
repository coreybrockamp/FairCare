import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { OnboardingStackParamList } from '../../navigation/OnboardingNavigator';

type NavProp = StackNavigationProp<OnboardingStackParamList, 'Onboarding3'>;

interface Props {
  navigation: NavProp;
  onComplete: () => void;
}

const Onboarding3: React.FC<Props> = ({ navigation, onComplete }) => {
  const handleStart = () => {
    // completeOnboarding writes flag and hides this navigator; once the
    // root navigator re-renders it will show MainNavigator.  After the flag
    // has been saved we also programmatically send the user to the Scan
    // tab's Camera screen so they land exactly where the CTA promises.
    (async () => {
      await onComplete();
      // navigate the parent (root) stack to Main -> Scan -> Camera
      // `getParent()` may be undefined in tests but that's ok.
      const parentNav: any | undefined = navigation.getParent();
      parentNav?.navigate('Main', {
        screen: 'Scan',
        params: { screen: 'Camera' },
      });
    })();
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.skip} onPress={onComplete}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>
      <View style={styles.content}>
        <Text style={styles.title}>Scan your first bill</Text>
      </View>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.nextButton} onPress={handleStart}>
          <Text style={styles.nextButtonText}>Start Scanning</Text>
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
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  footer: { padding: 20 },
  nextButton: { backgroundColor: '#007bff', padding: 15, borderRadius: 8, alignItems: 'center' },
  nextButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
});

export default Onboarding3;