import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
  ActivityIndicator,
  Clipboard,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ScanStackParamList } from '../navigation/ScanNavigator';

const COLORS = {
  primary: '#FF6B6B',
  background: '#FFF8F0',
  card: '#FFFFFF',
  text: '#2D2D2D',
  textSecondary: '#8B8B8B',
  accent: '#FFD93D',
  success: '#6BCB77',
};

interface Props {
  navigation: StackNavigationProp<ScanStackParamList, 'DisputePreview'>;
  route: {
    params: {
      letter: string;
    };
  };
}

const DisputePreview: React.FC<Props> = ({ navigation, route }) => {
  const { letter } = route.params;
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      Clipboard.setString(letter);
      setCopied(true);
      Alert.alert('Copied', 'Letter copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
      Alert.alert('Error', 'Failed to copy letter');
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: letter,
        title: 'Medical Bill Dispute Letter',
      });
    } catch (err: any) {
      console.error('Share failed:', err);
      Alert.alert('Error', 'Failed to share letter');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Dispute Letter</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={true}>
        {/* Letter content */}
        <View style={styles.letterCard}>
          <Text style={styles.letterText}>{letter}</Text>
          <Text style={styles.disclaimerNote}>
            Review and personalize before sending. Replace any placeholder text in brackets.
          </Text>
        </View>
      </ScrollView>

      {/* Action buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.copyButton]}
          onPress={handleCopy}
        >
          <Text style={styles.buttonText}>
            {copied ? '✓ Copied' : 'Copy Letter'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.shareButton]}
          onPress={handleShare}
        >
          <Text style={styles.buttonText}>Share</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  backButton: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '500',
    width: 50,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
    textAlign: 'center',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  letterCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  letterText: {
    fontSize: 14,
    lineHeight: 22,
    color: COLORS.text,
    fontFamily: 'System',
  },
  disclaimerNote: {
    fontSize: 12,
    lineHeight: 16,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 12,
    gap: 12,
    backgroundColor: COLORS.background,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  copyButton: {
    backgroundColor: COLORS.primary,
  },
  shareButton: {
    backgroundColor: COLORS.accent,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
});

export default DisputePreview;
