import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { OnboardingStackParamList } from '../../navigation/OnboardingNavigator';

type NavProp = StackNavigationProp<OnboardingStackParamList, 'Onboarding2'>;

interface Props {
  navigation: NavProp;
  onSkip: () => void;
}

const steps = [
  {
    emoji: '📸',
    title: 'Scan Your Bill',
    subtitle: 'Take a photo or upload a PDF of your medical bill',
  },
  {
    emoji: '🔍',
    title: 'We Find Errors',
    subtitle: 'AI detects duplicate charges, upcoding, and billing mistakes',
  },
  {
    emoji: '✉️',
    title: 'Dispute & Save',
    subtitle: 'Generate a professional dispute letter in one tap',
  },
];

const Onboarding2: React.FC<Props> = ({ navigation, onSkip }) => {
  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.skip} onPress={onSkip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Here's how FairCare works</Text>

        <View style={styles.stepsContainer}>
          {steps.map((step, index) => (
            <View key={index} style={styles.stepCard}>
              <View style={styles.coralBorder} />
              <View style={styles.stepInner}>
                <Text style={styles.stepEmoji}>{step.emoji}</Text>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepSubtitle}>{step.subtitle}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.nextButton}
          onPress={() => navigation.navigate('Onboarding3')}
          activeOpacity={0.8}
        >
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>

        <View style={styles.dots}>
          <View style={styles.dot} />
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
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
  skip: {
    position: 'absolute',
    top: 60,
    right: 24,
    zIndex: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  skipText: {
    fontSize: 16,
    color: '#8B8B8B',
    fontWeight: '500',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2D2D2D',
    textAlign: 'center',
    marginBottom: 36,
    lineHeight: 40,
  },
  stepsContainer: {
    gap: 16,
  },
  stepCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  coralBorder: {
    width: 4,
    backgroundColor: '#FF6B6B',
  },
  stepInner: {
    flex: 1,
    padding: 20,
  },
  stepEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D2D2D',
    marginBottom: 6,
  },
  stepSubtitle: {
    fontSize: 15,
    color: '#8B8B8B',
    lineHeight: 22,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  nextButton: {
    backgroundColor: '#FF6B6B',
    height: 56,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
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

export default Onboarding2;
