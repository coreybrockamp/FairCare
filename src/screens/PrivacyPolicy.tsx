import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

const PrivacyPolicyScreen: React.FC = () => {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Privacy Policy</Text>
      <Text style={styles.paragraph}>
        Your privacy is important to us. We only collect information necessary to
        operate the FairCare app, including authentication and your scanned
        medical bills. All data is stored securely in your Supabase project, and
        you can delete it at any time from the Profile screen.
      </Text>
      <Text style={styles.paragraph}>
        We do not share your data with third parties. For more details, please
        contact us at support@faircare.example.com.
      </Text>
      <Text style={styles.paragraph}>
        This policy applies only to the mobile application and does not cover any
        external services you may access via integrations.
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 12,
  },
});

export default PrivacyPolicyScreen;