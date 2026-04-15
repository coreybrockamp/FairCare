import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Linking,
} from 'react-native';

const COLORS = {
  primary: '#FF6B6B',
  background: '#FFF8F0',
  card: '#FFFFFF',
  text: '#2D2D2D',
  textSecondary: '#8B8B8B',
};

interface CharityCarePromptProps {
  hospitalName: string;
  charityUrl: string;
  onDismiss: () => void;
}

const CharityCarePrompt: React.FC<CharityCarePromptProps> = ({
  hospitalName,
  charityUrl,
  onDismiss,
}) => {
  const [showInfoModal, setShowInfoModal] = useState(false);

  const handleLearnMore = () => {
    if (charityUrl) {
      Linking.openURL(charityUrl).catch(() => {});
    }
  };

  return (
    <>
      <View style={styles.container}>
        <TouchableOpacity style={styles.dismissButton} onPress={onDismiss} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={styles.dismissX}>✕</Text>
        </TouchableOpacity>

        <Text style={styles.header}>💛 You may qualify for free care</Text>

        <Text style={styles.body}>
          {hospitalName} is a nonprofit hospital. Nonprofit hospitals are required by law to offer free or reduced care to patients who qualify based on income.
        </Text>

        <TouchableOpacity style={styles.primaryButton} onPress={handleLearnMore} activeOpacity={0.8}>
          <Text style={styles.primaryButtonText}>Learn About Financial Assistance</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={() => setShowInfoModal(true)} activeOpacity={0.8}>
          <Text style={styles.secondaryButtonText}>Learn More About Charity Care</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showInfoModal} transparent animationType="slide" onRequestClose={() => setShowInfoModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.handle} />
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>What is Charity Care?</Text>

              <Text style={styles.modalSectionTitle}>Overview</Text>
              <Text style={styles.modalText}>
                Charity care (also called financial assistance) is free or discounted medical care that nonprofit hospitals are legally required to provide. Under IRS Section 501(r), every nonprofit hospital must have a written financial assistance policy and make reasonable efforts to inform patients about it.
              </Text>

              <Text style={styles.modalSectionTitle}>Who qualifies?</Text>
              <Text style={styles.modalText}>
                Income thresholds vary by hospital, but most programs cover patients earning up to 200-400% of the Federal Poverty Level (FPL). For a single person in 2026, that's roughly $30,000-$60,000/year. Family income thresholds are higher.
              </Text>
              <Text style={styles.modalText}>
                Many hospitals also offer sliding-scale discounts for patients above these thresholds.
              </Text>

              <Text style={styles.modalSectionTitle}>How to apply</Text>
              <Text style={styles.modalBullet}>1. Ask the hospital's billing department for a financial assistance application</Text>
              <Text style={styles.modalBullet}>2. Gather proof of income (pay stubs, tax returns, benefit letters)</Text>
              <Text style={styles.modalBullet}>3. Submit the application — many hospitals accept them even after a bill has been sent to collections</Text>
              <Text style={styles.modalBullet}>4. Follow up within 2-4 weeks if you haven't heard back</Text>

              <Text style={styles.modalSectionTitle}>Free help available</Text>
              <Text style={styles.modalText}>
                Dollar For (dollarfor.org) is a free nonprofit that helps patients apply for hospital financial assistance. They've helped eliminate over $30 million in medical debt.
              </Text>

              <TouchableOpacity
                style={styles.dollarForButton}
                onPress={() => Linking.openURL('https://dollarfor.org').catch(() => {})}
                activeOpacity={0.8}
              >
                <Text style={styles.dollarForButtonText}>Visit Dollar For</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.closeButton} onPress={() => setShowInfoModal(false)} activeOpacity={0.8}>
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.primary,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  dismissButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissX: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  header: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 10,
    marginRight: 32,
  },
  body: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 21,
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#F0F0F0',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
  },

  // Info Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 12,
    maxHeight: '85%',
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
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  modalText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 21,
    marginBottom: 8,
  },
  modalBullet: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 21,
    marginBottom: 6,
    paddingLeft: 4,
  },
  dollarForButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 10,
  },
  dollarForButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  closeButton: {
    backgroundColor: '#F0F0F0',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 8,
  },
  closeButtonText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
  },
});

export default CharityCarePrompt;
