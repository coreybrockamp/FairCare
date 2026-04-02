import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { ScanStackParamList } from '../navigation/ScanNavigator';
import { supabase } from '../services/supabase';
import { generateDisputeLetter } from '../services/disputeGenerator';
import { runErrorDetection } from '../services/errorDetection';

const COLORS = {
  primary: '#FF6B6B',
  background: '#FFF8F0',
  card: '#FFFFFF',
  text: '#2D2D2D',
  textSecondary: '#8B8B8B',
  success: '#6BCB77',
  discrepancy: '#FFF0F0',
};

interface Discrepancy {
  description: string;
  billedAmount: number;
  eobPatientOwes: number;
  difference: number;
}

interface Props {
  navigation: StackNavigationProp<ScanStackParamList, 'EOBComparison'>;
  route: { params: { billId: string; eobId: string } };
}

const getVal = (f: any): string => {
  if (f && typeof f === 'object' && f.value !== undefined) return String(f.value);
  return String(f ?? '');
};

const toNum = (v: any): number => {
  const s = getVal(v).replace(/[^0-9.]/g, '');
  return parseFloat(s) || 0;
};

const EOBComparison: React.FC<Props> = ({ navigation, route }) => {
  const { billId, eobId } = route.params;
  const [loading, setLoading] = useState(true);
  const [bill, setBill] = useState<any>(null);
  const [eob, setEob] = useState<any>(null);
  const [discrepancies, setDiscrepancies] = useState<Discrepancy[]>([]);
  const [totalOvercharge, setTotalOvercharge] = useState(0);
  const [generatingLetter, setGeneratingLetter] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [billRes, eobRes] = await Promise.all([
          supabase.from('bills').select('*').eq('id', billId).single(),
          supabase.from('eobs').select('*').eq('id', eobId).single(),
        ]);

        if (billRes.error) throw billRes.error;
        if (eobRes.error) throw eobRes.error;

        setBill(billRes.data);
        setEob(eobRes.data);

        // Compare line items
        const billItems: any[] = billRes.data.parsed_data?.line_items || [];
        const eobItems: any[] = eobRes.data.parsed_data?.line_items || [];
        const found: Discrepancy[] = [];

        for (const billItem of billItems) {
          const billDesc = getVal(billItem.description) || getVal(billItem.cpt_code);
          const billCharge = toNum(billItem.total_charge || billItem.unit_charge);

          // Find matching EOB item by description similarity
          const match = eobItems.find((eobItem) => {
            const eobDesc = getVal(eobItem.description);
            return eobDesc.toLowerCase().includes(billDesc.toLowerCase().substring(0, 10)) ||
              billDesc.toLowerCase().includes(eobDesc.toLowerCase().substring(0, 10));
          });

          const eobPatientOwes = match ? toNum(match.patient_responsibility) : 0;

          if (billCharge > 0 && match && billCharge > eobPatientOwes) {
            found.push({
              description: billDesc,
              billedAmount: billCharge,
              eobPatientOwes,
              difference: billCharge - eobPatientOwes,
            });
          }
        }

        // Also check totals as fallback
        if (found.length === 0) {
          const billTotal = toNum(billRes.data.parsed_data?.total_due);
          const eobTotal = toNum(eobRes.data.parsed_data?.total_patient_responsibility);
          if (billTotal > 0 && eobTotal > 0 && billTotal > eobTotal) {
            found.push({
              description: 'Total bill amount',
              billedAmount: billTotal,
              eobPatientOwes: eobTotal,
              difference: billTotal - eobTotal,
            });
          }
        }

        setDiscrepancies(found);
        setTotalOvercharge(found.reduce((sum, d) => sum + d.difference, 0));
      } catch (err: any) {
        console.error('EOBComparison load error', err);
        Alert.alert('Error', err.message || 'Failed to load comparison data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [billId, eobId]);

  const handleGenerateLetter = async () => {
    if (!bill) return;
    try {
      setGeneratingLetter(true);
      const errors = runErrorDetection(bill.parsed_data || {});
      const letter = await generateDisputeLetter(billId, errors, '', '');
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
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Comparing your bill with EOB...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const billParsed = bill?.parsed_data || {};
  const eobParsed = eob?.parsed_data || {};

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>

        <View style={styles.headerCard}>
          <Text style={styles.title}>Bill vs. EOB</Text>
          <Text style={styles.subtitle}>Side-by-side comparison</Text>
        </View>

        {/* Summary Card */}
        <View style={[
          styles.summaryCard,
          { borderLeftColor: discrepancies.length > 0 ? COLORS.primary : COLORS.success },
        ]}>
          {discrepancies.length > 0 ? (
            <>
              <Text style={styles.summaryIcon}>
                <Ionicons name="warning-outline" size={22} color={COLORS.primary} />
              </Text>
              <View style={styles.summaryContent}>
                <Text style={styles.summaryTitle}>
                  {discrepancies.length} discrepanc{discrepancies.length === 1 ? 'y' : 'ies'} found
                </Text>
                <Text style={styles.summaryAmount}>
                  Potential overcharge: ${totalOvercharge.toFixed(2)}
                </Text>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.summaryIcon}>
                <Ionicons name="checkmark-circle-outline" size={22} color={COLORS.success} />
              </Text>
              <View style={styles.summaryContent}>
                <Text style={[styles.summaryTitle, { color: COLORS.success }]}>
                  No discrepancies found
                </Text>
                <Text style={styles.summarySubtext}>
                  Your bill matches the EOB
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Totals Overview */}
        <View style={styles.totalsRow}>
          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>Bill Total</Text>
            <Text style={styles.totalValue}>
              ${toNum(billParsed.total_due).toFixed(2)}
            </Text>
          </View>
          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>EOB Says You Owe</Text>
            <Text style={styles.totalValue}>
              ${toNum(eobParsed.total_patient_responsibility).toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Insurance Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Insurance Company</Text>
          <Text style={styles.infoValue}>{getVal(eobParsed.insurance_company) || 'Not available'}</Text>
          <Text style={styles.infoLabel}>Insurance Paid</Text>
          <Text style={styles.infoValue}>${toNum(eobParsed.total_insurance_paid).toFixed(2)}</Text>
          <Text style={styles.infoLabel}>Allowed Amount</Text>
          <Text style={styles.infoValue}>${toNum(eobParsed.total_allowed).toFixed(2)}</Text>
        </View>

        {/* Line Item Comparison */}
        <Text style={styles.sectionTitle}>Line Item Comparison</Text>

        {(billParsed.line_items || []).map((item: any, idx: number) => {
          const desc = getVal(item.description) || getVal(item.cpt_code) || 'Unknown Service';
          const billCharge = toNum(item.total_charge || item.unit_charge);
          const eobItems: any[] = eobParsed.line_items || [];
          const match = eobItems.find((eobItem: any) => {
            const eobDesc = getVal(eobItem.description);
            return eobDesc.toLowerCase().includes(desc.toLowerCase().substring(0, 10)) ||
              desc.toLowerCase().includes(eobDesc.toLowerCase().substring(0, 10));
          });
          const eobOwes = match ? toNum(match.patient_responsibility) : null;
          const hasDiscrepancy = eobOwes !== null && billCharge > eobOwes;

          return (
            <View
              key={idx}
              style={[
                styles.lineItemCard,
                hasDiscrepancy && styles.lineItemDiscrepancy,
              ]}
            >
              <Text style={styles.lineItemDesc} numberOfLines={2}>{desc}</Text>
              <View style={styles.lineItemRow}>
                <View style={styles.lineItemCol}>
                  <Text style={styles.lineItemLabel}>Billed</Text>
                  <Text style={[
                    styles.lineItemAmount,
                    hasDiscrepancy && styles.lineItemOvercharge,
                  ]}>
                    ${billCharge.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.lineItemCol}>
                  <Text style={styles.lineItemLabel}>EOB: You Owe</Text>
                  <Text style={styles.lineItemAmount}>
                    {eobOwes !== null ? `$${eobOwes.toFixed(2)}` : '—'}
                  </Text>
                </View>
                {hasDiscrepancy && (
                  <View style={styles.lineItemCol}>
                    <Text style={styles.lineItemLabel}>Difference</Text>
                    <Text style={styles.lineItemDiff}>
                      +${(billCharge - eobOwes!).toFixed(2)}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          );
        })}

        {discrepancies.length > 0 && (
          <TouchableOpacity
            style={styles.disputeButton}
            onPress={handleGenerateLetter}
            disabled={generatingLetter}
            activeOpacity={0.8}
          >
            {generatingLetter ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.disputeButtonText}>Generate Dispute Letter</Text>
            )}
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 16,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  headerCard: {
    backgroundColor: COLORS.card,
    padding: 20,
    borderRadius: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  summaryCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  summaryIcon: {
    marginRight: 12,
  },
  summaryContent: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.primary,
  },
  summaryAmount: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 2,
  },
  summarySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  totalsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  totalCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  totalLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 4,
  },
  infoCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  infoLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginTop: 8,
  },
  infoValue: {
    fontSize: 16,
    color: COLORS.text,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  lineItemCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  lineItemDiscrepancy: {
    backgroundColor: COLORS.discrepancy,
    borderWidth: 1,
    borderColor: '#FFD4D4',
  },
  lineItemDesc: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 10,
  },
  lineItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  lineItemCol: {
    flex: 1,
  },
  lineItemLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  lineItemAmount: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  lineItemOvercharge: {
    color: COLORS.primary,
  },
  lineItemDiff: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
  },
  disputeButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  disputeButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});

export default EOBComparison;
