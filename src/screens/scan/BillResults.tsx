import React, { useEffect, useState } from 'react';
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
import * as DocumentPicker from 'expo-document-picker';
import { StackNavigationProp } from '@react-navigation/stack';
import { ScanStackParamList } from '../../navigation/ScanNavigator';
import { supabase } from '../../services/supabase';
import { decryptField } from '../../services/billParser';

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
        if (data.parsed_data?.patient_name) {
          setDecryptedPatient(await decryptField(data.parsed_data.patient_name));
        }
        if (data.parsed_data?.provider_name) {
          setDecryptedProvider(await decryptField(data.parsed_data.provider_name));
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

  const lineItems: any[] = parsed.line_items || [];

  const renderLineItem = (item: any, idx: number) => {
    const getVal = (f: any) => {
      if (f && typeof f === 'object') {
        return f.value ?? '';
      }
      return f ?? '';
    };
    return (
      <View key={idx} style={styles.row}>
        <Text style={styles.cell}>{getVal(item.cpt_code) || '-'}</Text>
        <Text style={styles.cell}>{getVal(item.description) || '-'}</Text>
        <Text style={styles.cell}>{getVal(item.quantity) || '-'}</Text>
        <Text style={styles.cell}>{getVal(item.unit_charge) || '-'}</Text>
        <Text style={styles.cell}>{getVal(item.total_charge) || '-'}</Text>
        {item.confidence_score !== undefined && (
          <Text style={styles.cellSmall}>{(item.confidence_score * 100).toFixed(0)}%</Text>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Patient</Text>
          <Text style={styles.value}>
            {decryptedPatient || (parsed.patient_name?.value ?? parsed.patient_name)}
          </Text>
        </View>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Provider</Text>
          <Text style={styles.value}>
            {decryptedProvider || (parsed.provider_name?.value ?? parsed.provider_name)}
          </Text>
        </View>

        <View style={styles.tableHeader}>
          <Text style={styles.headerCell}>CPT</Text>
          <Text style={styles.headerCell}>Description</Text>
          <Text style={styles.headerCell}>Qty</Text>
          <Text style={styles.headerCell}>Unit</Text>
          <Text style={styles.headerCell}>Total</Text>
        </View>
        {lineItems.map(renderLineItem)}

        <View style={styles.summary}>
          <Text>Subtotal: {parsed.subtotal?.value ?? parsed.subtotal}</Text>
          <Text>Adjustments: {parsed.insurance_adjustments?.value ?? parsed.insurance_adjustments}</Text>
          <Text>Patient owes: {parsed.patient_responsibility?.value ?? parsed.patient_responsibility}</Text>
          <Text>Total due: {parsed.total_due?.value ?? parsed.total_due}</Text>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleAddEob}>
          <Text style={styles.buttonText}>Add EOB</Text>
        </TouchableOpacity>
        {eob && (
          <View style={styles.comparisonSection}>
            <Text style={styles.comparisonTitle}>Comparison with EOB</Text>
            <Text>Billed: {parsed.total_due?.value ?? parsed.total_due}</Text>
            <Text>
              Insurance paid: {eobParsed.insurance_paid?.value ?? eobParsed.insurance_paid}
            </Text>
            <Text>
              Patient owes:{' '}
              {eobParsed.patient_responsibility?.value ?? eobParsed.patient_responsibility}
            </Text>
            {/* further discrepancy logic could highlight differences */}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  image: { width: '100%', height: 200, marginVertical: 10 },
  fieldGroup: { paddingHorizontal: 16, paddingVertical: 8 },
  label: { fontWeight: 'bold', fontSize: 16 },
  value: { fontSize: 16, marginTop: 4 },
  tableHeader: { flexDirection: 'row', padding: 8, backgroundColor: '#f0f0f0' },
  headerCell: { flex: 1, fontWeight: 'bold', fontSize: 14 },
  row: { flexDirection: 'row', padding: 8, borderBottomWidth: 1, borderColor: '#eee' },
  cell: { flex: 1, fontSize: 13 },
  cellSmall: { flex: 1, fontSize: 11, color: '#666' },
  summary: { padding: 16 },
  button: { backgroundColor: '#007bff', padding: 12, margin: 16, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  comparisonSection: { padding: 16, backgroundColor: '#f9f9f9', marginTop: 16 },
  comparisonTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
});

export default BillResults;
