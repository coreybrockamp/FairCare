import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';

// warm friendly palette
const COLORS = {
  primary: '#FF6B6B',
  background: '#FFF8F0',
  card: '#FFFFFF',
  text: '#2D2D2D',
  textSecondary: '#8B8B8B',
  accent: '#FFD93D',
  success: '#6BCB77',
};

const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const name = user?.email?.split('@')[0] || 'there';

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.greeting}>Hi {name} 👋</Text>
      <Text style={styles.subheading}>Scan a bill to get started</Text>

      <TouchableOpacity
        style={styles.scanButton}
        onPress={() => navigation.navigate('Scan' as any)}
      >
        <Text style={styles.scanButtonText}>Scan a Bill</Text>
      </TouchableOpacity>

      <View style={styles.statCard}>
        <Text style={styles.statText}>
          80% of bills have errors — let&apos;s check yours
        </Text>
      </View>

      <View style={styles.recentPlaceholder}>
        <Text style={styles.recentText}>Recent bills will appear here</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 24,
  },
  greeting: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  subheading: {
    fontSize: 18,
    color: COLORS.textSecondary,
    marginBottom: 24,
  },
  scanButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  statText: {
    fontSize: 16,
    color: COLORS.text,
  },
  recentPlaceholder: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.textSecondary,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  recentText: {
    color: COLORS.textSecondary,
  },
});

export default HomeScreen;