import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const COLORS = {
  primary: '#FF6B6B',
  background: '#FFF8F0',
  card: '#FFFFFF',
  text: '#2D2D2D',
  textSecondary: '#8B8B8B',
  dismissButton: '#F0F0F0',
  dismissText: '#6B6B6B',
};

interface EOBPromptModalProps {
  billId: string;
  visible: boolean;
  onUpload: () => void;
  onDismiss: () => void;
}

const EOBPromptModal: React.FC<EOBPromptModalProps> = ({
  billId,
  visible,
  onUpload,
  onDismiss,
}) => {
  const [showExplanation, setShowExplanation] = useState(false);

  const storageKey = `eob_prompt_shown_${billId}`;

  const handleUpload = async () => {
    await AsyncStorage.setItem(storageKey, 'true');
    onUpload();
  };

  const handleDismiss = async () => {
    await AsyncStorage.setItem(storageKey, 'true');
    onDismiss();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleDismiss}
    >
      <TouchableWithoutFeedback onPress={handleDismiss}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.sheet}>
              <View style={styles.handle} />

              <Text style={styles.header}>Do you have your EOB?</Text>
              <Text style={styles.subtitle}>
                Your Explanation of Benefits can help us find even more errors on
                your bill.
              </Text>

              <TouchableOpacity
                style={styles.uploadButton}
                onPress={handleUpload}
                activeOpacity={0.8}
              >
                <Text style={styles.uploadButtonText}>Upload EOB</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dismissButton}
                onPress={handleDismiss}
                activeOpacity={0.8}
              >
                <Text style={styles.dismissButtonText}>Not right now</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowExplanation(!showExplanation)}
                activeOpacity={0.7}
              >
                <Text style={styles.whatIsEobLink}>What is an EOB?</Text>
              </TouchableOpacity>

              {showExplanation && (
                <View style={styles.explanationBox}>
                  <Text style={styles.explanationText}>
                    An EOB (Explanation of Benefits) is a document your insurance
                    company sends after a medical visit. It shows what was
                    covered and what you owe.
                  </Text>
                </View>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 10,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  header: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  uploadButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  dismissButton: {
    backgroundColor: COLORS.dismissButton,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  dismissButtonText: {
    color: COLORS.dismissText,
    fontSize: 16,
    fontWeight: '600',
  },
  whatIsEobLink: {
    fontSize: 14,
    color: COLORS.primary,
    textAlign: 'center',
    textDecorationLine: 'underline',
    marginBottom: 8,
  },
  explanationBox: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  explanationText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
    textAlign: 'center',
  },
});

export default EOBPromptModal;
