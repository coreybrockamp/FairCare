import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { OnboardingStackParamList } from '../../navigation/OnboardingNavigator';

type NavProp = StackNavigationProp<OnboardingStackParamList, 'Onboarding1'>;

interface Props {
  navigation: NavProp;
  onSkip: () => void;
}

const Onboarding1: React.FC<Props> = ({ navigation, onSkip }) => {
  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.skip} onPress={onSkip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.emojiStack}>
          <View style={styles.emojiCard}>
            <Text style={styles.emoji}>🏥</Text>
          </View>
          <View style={styles.emojiCard}>
            <Text style={styles.emoji}>📄</Text>
          </View>
          <View style={styles.emojiCard}>
            <Text style={styles.emoji}>💰</Text>
          </View>
        </View>

        <Text style={styles.title}>Take back control of your medical bills</Text>
        <Text style={styles.subtitle}>
          The average medical bill has $1,300 in errors. We find them for you.
        </Text>

        <View style={styles.statBadge}>
          <Text style={styles.statText}>80% of bills contain errors</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.nextButton}
          onPress={() => navigation.navigate('Onboarding2')}
          activeOpacity={0.8}
        >
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>

        <View style={styles.dots}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emojiStack: {
    alignItems: 'center',
    marginBottom: 40,
    gap: 16,
  },
  emojiCard: {
    width: 80,
    height: 80,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  emoji: {
    fontSize: 36,
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
    marginBottom: 24,
  },
  statBadge: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 30,
  },
  statText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
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

export default Onboarding1;
