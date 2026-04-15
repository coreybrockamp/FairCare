import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { OnboardingStackParamList } from '../../navigation/OnboardingNavigator';

type NavProp = StackNavigationProp<OnboardingStackParamList, 'Onboarding3'>;

interface Props {
  navigation: NavProp;
  onComplete: (initialTab?: 'Home' | 'Scan' | 'Bills' | 'Profile') => void;
}

const Onboarding3: React.FC<Props> = ({ navigation, onComplete }) => {
  const handleStart = () => {
    navigation.navigate('Onboarding4');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.emojiCard}>
          <Text style={styles.emoji}>🎯</Text>
        </View>

        <Text style={styles.title}>Ready to find errors?</Text>
        <Text style={styles.subtitle}>
          Scan your first bill and see what you might be overpaying
        </Text>

        <View style={styles.statCard}>
          <Text style={styles.statText}>
            FairCare users save an average of $345/year
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.scanButton}
          onPress={handleStart}
          activeOpacity={0.8}
        >
          <Text style={styles.scanButtonText}>Scan My First Bill</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.laterButton}
          onPress={() => navigation.navigate('Onboarding4')}
          activeOpacity={0.6}
        >
          <Text style={styles.laterText}>I'll do it later</Text>
        </TouchableOpacity>

        <View style={styles.dots}>
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
    backgroundColor: '#FFF8F0',
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
    backgroundColor: '#FFFFFF',
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
    color: '#2D2D2D',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 17,
    color: '#8B8B8B',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 28,
  },
  statCard: {
    backgroundColor: '#FF6B6B',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 28,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  statText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  scanButton: {
    backgroundColor: '#FF6B6B',
    height: 56,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  laterButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  laterText: {
    fontSize: 16,
    color: '#8B8B8B',
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
    backgroundColor: '#FF6B6B',
    width: 24,
  },
});

export default Onboarding3;
