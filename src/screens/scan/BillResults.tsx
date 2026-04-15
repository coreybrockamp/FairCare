import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import { StackNavigationProp } from '@react-navigation/stack';
import { ScanStackParamList } from '../../navigation/ScanNavigator';
import EOBPromptModal from '../../components/EOBPromptModal';
  // color system
  const COLORS = {
    primary: '#FF6B6B',
    background: '#FFF8F0',
    card: '#FFFFFF',
    text: '#2D2D2D',
    textSecondary: '#8B8B8B',
    accent: '#FFD93D',
    success: '#6BCB77',
    errorHigh: '#DC3545',
    errorMedium: '#FD7E14',
    errorLow: '#FFC107',
  };
import { supabase } from '../../services/supabase';
import { decryptField } from '../../services/billParser';
import { runErrorDetection, DetectedError } from '../../services/errorDetection';
import { generateDisputeLetter } from '../../services/disputeGenerator';

interface Props {
  navigation: StackNavigationProp<ScanStackParamList, 'BillResults'>;
  route: { params: { billId: string; imageUri: string } };
}

const BillResults: React.FC<Props> = ({ navigation, route }) => {
  const { billId, imageUri } = route.params;
  const [loading, setLoading] = useState(true);
  const [bill, setBill] = useState<any>(null);
  const [eob, setEob] = useState<any>(null);
  const [decryptedPatient, setDecryptedPatient] = useState<string | null>(null);
  const [decryptedProvider, setDecryptedProvider] = useState<string | null>(null);
  const [errors, setErrors] = useState<DetectedError[]>([]);
  const [expandedError, setExpandedError] = useState<string | null>(null);
  const [generatingLetter, setGeneratingLetter] = useState(false);
  const [showEobPrompt, setShowEobPrompt] = useState(false);
  const eobTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (eobTimerRef.current) clearTimeout(eobTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('bills')
          .select('*')
          .eq('id', billId)
          .single();
        if (error) throw error;
        setBill(data);
        // load matching EOB if available
        const { data: eobData } = await supabase
          .from('eobs')
          .select('*')
          .eq('bill_id', billId)
          .single();
        if (eobData) setEob(eobData);
        // Extract patient/provider names from parsed data
        const rawPatient = data.parsed_data?.patient_name;
        const rawProvider = data.parsed_data?.provider_name;
        // Handle both {value, confidence_score} objects and plain strings
        const patientVal = (rawPatient && typeof rawPatient === 'object' && rawPatient.value) ? rawPatient.value : String(rawPatient || '');
        const providerVal = (rawProvider && typeof rawProvider === 'object' && rawProvider.value) ? rawProvider.value : String(rawProvider || '');
        setDecryptedPatient(patientVal);
        setDecryptedProvider(providerVal);
        // Run error detection
        const detectedErrors = runErrorDetection(data.parsed_data || {});
        setErrors(detectedErrors);
        // Show EOB prompt 2 seconds after successful load (once per bill)
        const eobKey = `eob_prompt_shown_${billId}`;
        const alreadyShown = await AsyncStorage.getItem(eobKey);
        if (!alreadyShown && !eobData) {
          eobTimerRef.current = setTimeout(() => setShowEobPrompt(true), 2000);
        }
      } catch (err: any) {
        console.error('BillResults load error', err);
        Alert.alert('Error', err.message || 'Failed to load bill');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [billId]);

  const handleAddEob = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'image/*' });
      if (result.canceled) return;
      const assets = (result as DocumentPicker.DocumentPickerSuccessResult).assets;
      if (!assets || assets.length === 0) return;
      const uri = assets[0].uri;
      // read file as base64 for OCR
      const { readImageAsBase64 } = await import('../../services/storage');
      const base64 = await readImageAsBase64(uri);
      const { extractTextFromImage } = await import('../../services/ocr');
      const ocrRes = await extractTextFromImage(uri, base64);
      if (!ocrRes.success) throw new Error('OCR failed');
      const parsed = await import('../../services/billParser').then(m =>
        m.parseEob(ocrRes.fullText)
      );
      await import('../../services/billParser').then(m =>
        m.saveParsedEob(billId, parsed)
      );
      setEob({ parsed_data: parsed });
      Alert.alert('EOB saved');
    } catch (err: any) {
      console.error('Add EOB error', err);
      Alert.alert('Error', err.message || 'Failed to add EOB');
    }
  };

  const handleGenerateDisputeLetter = async () => {
    try {
      setGeneratingLetter(true);
      // Pass empty strings - disputeGenerator will extract real values from billData
      const letter = await generateDisputeLetter(
        billId,
        errors,
        '',
        ''
      );
      navigation.navigate('DisputePreview', { letter });
    } catch (err: any) {
      console.error('Generate dispute letter error', err);
      Alert.alert('Error', err.message || 'Failed to generate dispute letter');
    } finally {
      setGeneratingLetter(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  if (!bill) {
    return (
      <View style={styles.center}>
        <Text>Bill not found.</Text>
      </View>
    );
  }

  const parsed = bill.parsed_data || {};
  const eobParsed = eob?.parsed_data || {};

  const getSeverityColor = (severity: 'high' | 'medium' | 'low') => {
    switch (severity) {
      case 'high':
        return COLORS.errorHigh;
      case 'medium':
        return COLORS.errorMedium;
      default:
        return COLORS.errorLow;
    }
  };

  const getSeverityLabel = (severity: 'high' | 'medium' | 'low') => {
    switch (severity) {
      case 'high':
        return 'CRITICAL';
      case 'medium':
        return 'MEDIUM';
      default:
        return 'LOW';
    }
  };

  const totalEstimatedOvercharge = errors.reduce(
    (sum, err) => sum + (err.estimated_overcharge || 0),
    0
  );

  const lineItems: any[] = parsed.line_items || [];
  const hasCptCodes = lineItems.some(item => {
    const val = (item.cpt_code && typeof item.cpt_code === 'object' ? item.cpt_code.value : item.cpt_code) || '';
    return val && !/^#\d+$/.test(String(val)) && val !== '—' && val !== '-';
  });

  const renderLineItem = (item: any, idx: number) => {
    const getVal = (f: any) => {
      if (f && typeof f === 'object') {
        return f.value ?? '';
      }
      return f ?? '';
    };
    const bg = idx % 2 === 0 ? COLORS.background : COLORS.card;
    return (
      <View key={idx} style={[styles.row, { backgroundColor: bg }]}> 
        <Text style={styles.cell}>{/^#\d+$/.test(getVal(item.cpt_code) || '') ? '—' : (getVal(item.cpt_code) || '—')}</Text>
        <Text style={styles.cell}>{['Rem/Service description','Service description',''].includes(getVal(item.description)) ? 'Unknown Service' : (getVal(item.description) || 'Unknown Service')}</Text>
        <Text style={styles.cell}>{getVal(item.quantity) || '-'}</Text>
        <Text style={styles.cell}>{getVal(item.unit_charge) || '-'}</Text>
        <Text style={styles.cell}>{getVal(item.total_charge) ? `$${parseFloat(String(getVal(item.total_charge)).replace(/[^0-9.]/g,'')).toFixed(2)}` : '-'}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.headerCard}>
          <Text style={styles.successTitle}>Nice work!</Text>
          <Text style={styles.subtitle}>Here’s your bill breakdown</Text>
        </View>

        <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />

        {errors.length > 0 && (
          <View style={styles.alertCardContainer}>
            <TouchableOpacity
              style={styles.alertCard}
              onPress={() =>
                setExpandedError(expandedError ? null : 'all')
              }
            >
              <View style={styles.alertHeader}>
                <Text style={styles.alertIcon}>⚠️</Text>
                <View style={styles.alertContent}>
                  <Text style={styles.alertTitle}>
                    {errors.length} potential error{errors.length !== 1 ? 's' : ''} found
                  </Text>
                  <Text style={styles.alertSubtitle}>
                    Estimated ${totalEstimatedOvercharge.toFixed(2)} in overcharges
                  </Text>
                </View>
                <Text style={styles.expandIcon}>
                  {expandedError === 'all' ? '▼' : '▶'}
                </Text>
              </View>

              {expandedError === 'all' && (
                <View style={styles.errorsList}>
                  {errors.map((error) => (
                    <TouchableOpacity
                      key={error.id}
                      style={styles.errorCard}
                      onPress={() =>
                        setExpandedError(
                          expandedError === error.id ? null : error.id
                        )
                      }
                    >
                      <View style={styles.errorHeader}>
                        <View
                          style={[
                            styles.severityBadge,
                            { backgroundColor: getSeverityColor(error.severity) },
                          ]}
                        >
                          <Text style={styles.severityLabel}>
                            {getSeverityLabel(error.severity)}
                          </Text>
                        </View>
                        <View style={styles.errorTitleContainer}>
                          <Text style={styles.errorTypeLabel}>
                            {error.error_type.replace(/_/g, ' ').toUpperCase()}
                          </Text>
                          <Text style={styles.errorOvercharge}>
                            Est. ${error.estimated_overcharge.toFixed(2)} overcharge
                          </Text>
                        </View>
                        <Text style={styles.errorExpandIcon}>
                          {expandedError === error.id ? '▼' : '▶'}
                        </Text>
                      </View>

                      {expandedError === error.id && (
                        <View style={styles.errorDetails}>
                          <Text style={styles.errorDescription}>
                            {error.description}
                          </Text>
                          <View style={styles.suggestedActionBox}>
                            <Text style={styles.suggestedActionLabel}>
                              Suggested Action:
                            </Text>
                            <Text style={styles.suggestedAction}>
                              {error.suggested_action}
                            </Text>
                          </View>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.infoCard}>
          <Text style={styles.fieldLabel}>Patient</Text>
          <Text style={styles.fieldValue}>{decryptedPatient || (parsed.patient_name?.value ?? parsed.patient_name)}</Text>
          <Text style={styles.fieldLabel}>Provider</Text>
          <Text style={styles.fieldValue}>{decryptedProvider || (parsed.provider_name?.value ?? parsed.provider_name)}</Text>
        </View>

        <View style={styles.tableHeader}> 
          {hasCptCodes && <Text style={styles.headerCell}>CPT</Text>}
          <Text style={styles.headerCell}>Description</Text>
          <Text style={styles.headerCell}>Qty</Text>
          <Text style={styles.headerCell}>Unit</Text>
          <Text style={styles.headerCell}>Total</Text>
        </View>
        {lineItems.map(renderLineItem)}

        <View style={styles.summaryContainer}> 
          <View style={styles.summaryCard}> 
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{parsed.subtotal?.value ?? parsed.subtotal}</Text>
          </View>
          <View style={styles.summaryCard}> 
            <Text style={styles.summaryLabel}>Patient owes</Text>
            <Text style={styles.summaryValue}>{parsed.patient_responsibility?.value ?? parsed.patient_responsibility}</Text>
          </View>
          <View style={styles.summaryCard}> 
            <Text style={styles.summaryLabel}>Total due</Text>
            <Text style={styles.summaryValue}>{parsed.total_due?.value ?? parsed.total_due}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={handleAddEob}
          disabled={generatingLetter}
        >
          <Text style={styles.buttonText}>Add EOB</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.disputeButton]}
          onPress={handleGenerateDisputeLetter}
          disabled={generatingLetter}
        >
          {generatingLetter ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Generate Dispute Letter</Text>
          )}
        </TouchableOpacity>
        {eob && (
          <View style={styles.comparisonSection}>
            <Text style={styles.comparisonTitle}>Comparison with EOB</Text>
            <Text style={styles.compLabel}>Billed: {parsed.total_due?.value ?? parsed.total_due}</Text>
            <Text style={styles.compLabel}>Insurance paid: {eobParsed.insurance_paid?.value ?? eobParsed.insurance_paid}</Text>
            <Text style={styles.compLabel}>Patient owes: {eobParsed.patient_responsibility?.value ?? eobParsed.patient_responsibility}</Text>
            {/* further discrepancy logic could highlight differences */}
          </View>
        )}
      </ScrollView>

      <EOBPromptModal
        billId={billId}
        visible={showEobPrompt}
        onUpload={() => {
          setShowEobPrompt(false);
          navigation.navigate('EOBUpload', { billId });
        }}
        onDismiss={() => setShowEobPrompt(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  image: { width: '100%', height: 200, marginVertical: 10 },
  fieldGroup: { paddingHorizontal: 16, paddingVertical: 8 },
  label: { fontWeight: 'bold', fontSize: 16 },
  value: { fontSize: 16, marginTop: 4 },
  tableHeader: { flexDirection: 'row', padding: 8, backgroundColor: COLORS.card, borderRadius: 8 },
  headerCell: { flex: 1, fontWeight: 'bold', fontSize: 14, color: COLORS.primary },
  row: { flexDirection: 'row', padding: 8, borderBottomWidth: 1, borderColor: '#eee' },
  cell: { flex: 1, fontSize: 13, color: COLORS.text },
  cellSmall: { flex: 1, fontSize: 11, color: COLORS.textSecondary },
  button: { backgroundColor: COLORS.primary, padding: 12, margin: 16, borderRadius: 16, alignItems: 'center' },
  disputeButton: { backgroundColor: COLORS.primary, marginTop: 0 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  comparisonSection: { padding: 16, backgroundColor: COLORS.card, marginTop: 16, borderRadius: 16 },
  comparisonTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 8, color: COLORS.primary },
  // new styles for redesigned cards
  headerCard: {
    backgroundColor: COLORS.card,
    margin: 16,
    padding: 20,
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  successTitle: { fontSize: 28, fontWeight: 'bold', color: COLORS.primary },
  subtitle: { fontSize: 18, color: COLORS.textSecondary, marginTop: 4 },
  infoCard: {
    backgroundColor: COLORS.card,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  fieldLabel: { fontWeight: '600', fontSize: 14, color: COLORS.textSecondary, marginTop: 8 },
  fieldValue: { fontSize: 16, color: COLORS.text, marginTop: 2 },
  summaryContainer: { flexDirection: 'row', justifyContent: 'space-around', margin: 16 },
  summaryCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  summaryLabel: { fontSize: 12, color: COLORS.textSecondary },
  summaryValue: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginTop: 4 },
  compLabel: { fontSize: 14, color: COLORS.text, marginVertical: 2 },
  // Alert card styles
  alertCardContainer: {
    marginHorizontal: 16,
    marginVertical: 12,
  },
  alertCard: {
    backgroundColor: '#FFF5F5',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.errorHigh,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  alertIcon: {
    fontSize: 24,
    marginRight: 12,
    marginTop: 2,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.errorHigh,
    marginBottom: 2,
  },
  alertSubtitle: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  expandIcon: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 8,
  },
  errorsList: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#FFE0E0',
    paddingTop: 12,
  },
  errorCard: {
    backgroundColor: COLORS.card,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 10,
  },
  severityLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  errorTitleContainer: {
    flex: 1,
  },
  errorTypeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  errorOvercharge: {
    fontSize: 12,
    color: COLORS.errorHigh,
    fontWeight: '600',
    marginTop: 2,
  },
  errorExpandIcon: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  errorDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  errorDescription: {
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 18,
    marginBottom: 10,
  },
  suggestedActionBox: {
    backgroundColor: '#F9F9F9',
    borderRadius: 6,
    padding: 10,
  },
  suggestedActionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  suggestedAction: {
    fontSize: 12,
    color: COLORS.text,
    lineHeight: 16,
  },
});

export default BillResults;
