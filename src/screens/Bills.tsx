import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  ActionSheetIOS,
  Platform,
  TextInput,
  Modal,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { supabase } from '../services/supabase';
import { decryptField } from '../services/billParser';
import { runErrorDetection, DetectedError } from '../services/errorDetection';

// warm friendly palette
const COLORS = {
  primary: '#FF6B6B',
  background: '#FFF8F0',
  card: '#FFFFFF',
  text: '#2D2D2D',
  textSecondary: '#8B8B8B',
  accent: '#FFD93D',
  success: '#6BCB77',
  errorRed: '#DC3545',
  warningOrange: '#FD7E14',
};

type FilterTab = 'All' | 'Errors Found' | 'Disputed' | 'Resolved' | 'Clean';
const FILTER_TABS: FilterTab[] = ['All', 'Errors Found', 'Disputed', 'Resolved', 'Clean'];

type BillStatus = 'errors_found' | 'disputed' | 'resolved' | 'clean' | 'pending_review';

interface EnrichedBill {
  id: string;
  created_at: string;
  images: string;
  parsed_data: any;
  status: string;
  due_date: string | null;
  family_member: string | null;
  providerName: string;
  totalDue: number;
  computedStatus: BillStatus;
  errorCount: number;
  errors: DetectedError[];
  hasDispute: boolean;
  totalSavings: number;
  resolved_amount: number | null;
}

interface BillsScreenProps {
  navigation: StackNavigationProp<any>;
}

function BillsScreen({ navigation }: BillsScreenProps) {
  const [bills, setBills] = useState<EnrichedBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('All');

  // Modal states
  const [dueDatePickerVisible, setDueDatePickerVisible] = useState(false);
  const [dueDatePickerBillId, setDueDatePickerBillId] = useState<string | null>(null);
  const [dueDateValue, setDueDateValue] = useState(new Date());
  const [familyTagModalVisible, setFamilyTagModalVisible] = useState(false);
  const [familyTagBillId, setFamilyTagBillId] = useState<string | null>(null);
  const [familyTagValue, setFamilyTagValue] = useState('');
  const [resolvedModalVisible, setResolvedModalVisible] = useState(false);
  const [resolvedBillId, setResolvedBillId] = useState<string | null>(null);
  const [resolvedAmountValue, setResolvedAmountValue] = useState('');

  const fetchBills = useCallback(async () => {
    try {
      setLoading(true);

      const [billsResult, disputesResult] = await Promise.all([
        supabase
          .from('bills')
          .select('id, created_at, images, parsed_data, status, due_date, family_member, resolved_amount')
          .order('created_at', { ascending: false }),
        supabase
          .from('disputes')
          .select('bill_id, status'),
      ]);

      if (billsResult.error) throw billsResult.error;

      // Build dispute lookup: bill_id -> true
      const disputeMap = new Map<string, boolean>();
      (disputesResult.data || []).forEach((d: any) => {
        disputeMap.set(d.bill_id, true);
      });

      const enriched: EnrichedBill[] = await Promise.all(
        (billsResult.data || []).map(async (bill: any) => {
          // Decrypt provider name
          let providerName = bill.parsed_data?.provider_name?.value || bill.parsed_data?.provider_name || 'Unknown Provider';
          if (bill.parsed_data?.provider_name_enc) {
            try {
              providerName = await decryptField(bill.parsed_data.provider_name);
            } catch (e) {
              // fallback to unencrypted
            }
          }

          // Parse total due
          const rawDue = bill.parsed_data?.total_due?.value || bill.parsed_data?.total_due;
          const totalDue = rawDue ? parseFloat(String(rawDue).replace(/[^0-9.]/g, '')) || 0 : 0;

          // Run error detection client-side
          const errors = runErrorDetection(bill.parsed_data || {});
          const errorCount = errors.length;
          const totalSavings = bill.resolved_amount || errors.reduce((sum: number, e: DetectedError) => sum + (e.estimated_overcharge || 0), 0);

          // Determine computed status
          const hasDispute = disputeMap.has(bill.id);
          let computedStatus: BillStatus = 'pending_review';

          if (bill.status === 'resolved') {
            computedStatus = 'resolved';
          } else if (hasDispute || bill.status === 'disputed') {
            computedStatus = 'disputed';
          } else if (errorCount > 0 || bill.status === 'errors_found') {
            computedStatus = 'errors_found';
          } else if (bill.status === 'scanned' && errorCount === 0) {
            computedStatus = 'clean';
          }

          return {
            ...bill,
            providerName,
            totalDue,
            computedStatus,
            errorCount,
            errors,
            hasDispute,
            totalSavings,
          };
        })
      );

      setBills(enriched);
    } catch (err: any) {
      console.error('Bills: Error fetching bills:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchBills();
    }, [fetchBills])
  );

  // --- Summary calculations ---
  const totalOutstanding = bills
    .filter(b => b.computedStatus !== 'resolved')
    .reduce((sum, b) => sum + b.totalDue, 0);

  // --- Filtering ---
  const filteredBills = bills.filter(b => {
    switch (activeFilter) {
      case 'Errors Found': return b.computedStatus === 'errors_found';
      case 'Disputed': return b.computedStatus === 'disputed';
      case 'Resolved': return b.computedStatus === 'resolved';
      case 'Clean': return b.computedStatus === 'clean';
      default: return true;
    }
  });

  // --- Helpers ---
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

  const getDueDateDisplay = (dueDate: string | null) => {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    const now = new Date();
    const diffMs = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: 'OVERDUE', color: COLORS.errorRed };
    } else if (diffDays <= 7) {
      return { text: `Due in ${diffDays} day${diffDays !== 1 ? 's' : ''}`, color: COLORS.warningOrange };
    } else {
      const formatted = due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return { text: `Due ${formatted}`, color: COLORS.textSecondary };
    }
  };

  const getStatusConfig = (status: BillStatus) => {
    switch (status) {
      case 'errors_found':
        return { label: 'Errors Found', bg: '#FFF0F0', color: COLORS.errorRed };
      case 'disputed':
        return { label: 'Disputed', bg: '#FFF8E1', color: COLORS.warningOrange };
      case 'resolved':
        return { label: 'Resolved', bg: '#E8F5E9', color: COLORS.success };
      case 'clean':
        return { label: 'Clean', bg: '#E8F5E9', color: COLORS.success };
      default:
        return { label: 'Pending Review', bg: '#F5F5F5', color: COLORS.textSecondary };
    }
  };

  // --- Long press actions ---
  const handleLongPress = (bill: EnrichedBill) => {
    const options = ['Set Due Date', 'Tag Family Member', 'Mark as Resolved', 'Delete Bill', 'Cancel'];
    const destructiveButtonIndex = 3;
    const cancelButtonIndex = 4;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, destructiveButtonIndex, cancelButtonIndex },
        (buttonIndex) => handleActionSelection(buttonIndex, bill),
      );
    } else {
      // Fallback for Android
      Alert.alert('Actions', 'Choose an action', [
        { text: 'Set Due Date', onPress: () => handleActionSelection(0, bill) },
        { text: 'Tag Family Member', onPress: () => handleActionSelection(1, bill) },
        { text: 'Mark as Resolved', onPress: () => handleActionSelection(2, bill) },
        { text: 'Delete Bill', style: 'destructive', onPress: () => handleActionSelection(3, bill) },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  const handleActionSelection = (index: number, bill: EnrichedBill) => {
    switch (index) {
      case 0: // Set Due Date
        setDueDatePickerBillId(bill.id);
        setDueDateValue(bill.due_date ? new Date(bill.due_date) : new Date());
        setDueDatePickerVisible(true);
        break;
      case 1: // Tag Family Member
        setFamilyTagBillId(bill.id);
        setFamilyTagValue(bill.family_member || '');
        setFamilyTagModalVisible(true);
        break;
      case 2: // Mark as Resolved
        markAsResolved(bill.id);
        break;
      case 3: // Delete Bill
        confirmDelete(bill.id);
        break;
    }
  };

  const saveDueDate = async () => {
    if (!dueDatePickerBillId) return;
    try {
      await supabase
        .from('bills')
        .update({ due_date: dueDateValue.toISOString().split('T')[0] })
        .eq('id', dueDatePickerBillId);
      setDueDatePickerVisible(false);
      fetchBills();
    } catch (err) {
      Alert.alert('Error', 'Failed to set due date');
    }
  };

  const saveFamilyTag = async () => {
    if (!familyTagBillId) return;
    try {
      await supabase
        .from('bills')
        .update({ family_member: familyTagValue.trim() || null })
        .eq('id', familyTagBillId);
      setFamilyTagModalVisible(false);
      fetchBills();
    } catch (err) {
      Alert.alert('Error', 'Failed to tag family member');
    }
  };

  const markAsResolved = (billId: string) => {
    setResolvedBillId(billId);
    setResolvedAmountValue('');
    setResolvedModalVisible(true);
  };

  const saveResolved = async () => {
    if (!resolvedBillId) return;
    try {
      const amount = parseFloat(resolvedAmountValue.replace(/[^0-9.]/g, '')) || 0;
      await supabase
        .from('bills')
        .update({ status: 'resolved', resolved_amount: amount > 0 ? amount : null })
        .eq('id', resolvedBillId);
      setResolvedModalVisible(false);
      fetchBills();
    } catch (err) {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const confirmDelete = (billId: string) => {
    Alert.alert(
      'Delete Bill',
      'Are you sure you want to delete this bill? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await supabase.from('bills').delete().eq('id', billId);
              fetchBills();
            } catch (err) {
              Alert.alert('Error', 'Failed to delete bill');
            }
          },
        },
      ]
    );
  };

  // --- Render ---
  const renderFilterTabs = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filterContainer}
    >
      {FILTER_TABS.map(tab => {
        const isActive = activeFilter === tab;
        return (
          <TouchableOpacity
            key={tab}
            style={[styles.filterTab, isActive && styles.filterTabActive]}
            onPress={() => setActiveFilter(tab)}
          >
            <Text style={[styles.filterTabText, isActive && styles.filterTabTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  const renderBillCard = (bill: EnrichedBill) => {
    const statusConfig = getStatusConfig(bill.computedStatus);
    const dueInfo = getDueDateDisplay(bill.due_date);

    return (
      <TouchableOpacity
        key={bill.id}
        style={styles.billCard}
        activeOpacity={0.7}
        onPress={() =>
          navigation.navigate('Scan' as any, {
            screen: 'BillResults',
            params: { billId: bill.id, imageUri: bill.images },
          })
        }
        onLongPress={() => handleLongPress(bill)}
        delayLongPress={400}
      >
        {/* Top row: Provider + Status */}
        <View style={styles.billCardTop}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={styles.billProvider} numberOfLines={1}>{bill.providerName}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.billDate}>{formatDate(bill.created_at)}</Text>
              {dueInfo && (
                <Text style={[styles.dueDate, { color: dueInfo.color }]}>
                  {' · '}{dueInfo.text}
                </Text>
              )}
            </View>
          </View>
          <View style={styles.badgeRow}>
            {bill.family_member ? (
              <View style={styles.familyBadge}>
                <Text style={styles.familyBadgeText}>{bill.family_member}</Text>
              </View>
            ) : null}
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
              <Text style={[styles.statusText, { color: statusConfig.color }]}>
                {statusConfig.label}
              </Text>
            </View>
          </View>
        </View>

        {/* Bottom row: Amount + Error count */}
        <View style={styles.billCardBottom}>
          <Text style={styles.billDue}>{formatCurrency(bill.totalDue)}</Text>
          <View style={styles.rightInfo}>
            {bill.errorCount > 0 && (
              <View style={styles.errorCountBadge}>
                <Text style={styles.errorCountText}>{bill.errorCount}</Text>
              </View>
            )}
            <Text style={styles.arrowIcon}>›</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bills</Text>
        {!loading && bills.length > 0 && (
          <Text style={styles.headerSummary}>
            {bills.length} bill{bills.length !== 1 ? 's' : ''} · {formatCurrency(totalOutstanding)} total outstanding
          </Text>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading your bills...</Text>
        </View>
      ) : bills.length === 0 ? (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateEmoji}>📋</Text>
            <Text style={styles.emptyStateTitle}>No bills yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Start by scanning your first medical bill to get detailed analysis and error detection.
            </Text>
            <TouchableOpacity
              style={styles.ctaButton}
              onPress={() => navigation.navigate('Scan' as any)}
            >
              <Text style={styles.ctaButtonText}>Scan Your First Bill</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <>
          {renderFilterTabs()}
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.billsList}>
              {filteredBills.length === 0 ? (
                <View style={styles.noResults}>
                  <Text style={styles.noResultsText}>No bills match this filter</Text>
                </View>
              ) : (
                filteredBills.map(renderBillCard)
              )}
            </View>
          </ScrollView>
        </>
      )}

      {/* Due Date Picker Modal */}
      <Modal visible={dueDatePickerVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Set Due Date</Text>
            <DateTimePicker
              value={dueDateValue}
              mode="date"
              display="spinner"
              onChange={(_, date) => date && setDueDateValue(date)}
              style={{ height: 180 }}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonCancel}
                onPress={() => setDueDatePickerVisible(false)}
              >
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButtonSave} onPress={saveDueDate}>
                <Text style={styles.modalButtonSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Family Tag Modal */}
      <Modal visible={familyTagModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Tag Family Member</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Corey, Dre, Mom"
              placeholderTextColor={COLORS.textSecondary}
              value={familyTagValue}
              onChangeText={setFamilyTagValue}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={saveFamilyTag}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonCancel}
                onPress={() => setFamilyTagModalVisible(false)}
              >
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButtonSave} onPress={saveFamilyTag}>
                <Text style={styles.modalButtonSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Resolved Savings Modal */}
      <Modal visible={resolvedModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>How much did you save?</Text>
            <TextInput
              style={styles.textInput}
              placeholder="$0.00"
              placeholderTextColor={COLORS.textSecondary}
              value={resolvedAmountValue}
              onChangeText={setResolvedAmountValue}
              keyboardType="decimal-pad"
              autoFocus
              returnKeyType="done"
              onSubmitEditing={saveResolved}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonCancel}
                onPress={() => setResolvedModalVisible(false)}
              >
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButtonSave} onPress={saveResolved}>
                <Text style={styles.modalButtonSaveText}>Resolve</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerSummary: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },

  // Filter tabs
  filterContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  filterTab: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: '#F0F0F0',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    lineHeight: 18,
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },

  // Bill cards
  billsList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  billCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  billCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  billProvider: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  billDate: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  dueDate: {
    fontSize: 13,
    fontWeight: '600',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  familyBadge: {
    backgroundColor: '#FFF0F0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  familyBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  billCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  billDue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  rightInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorCountBadge: {
    backgroundColor: COLORS.errorRed,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorCountText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  arrowIcon: {
    fontSize: 28,
    color: COLORS.textSecondary,
  },

  // No results
  noResults: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  // Empty state
  emptyState: {
    marginTop: 60,
    marginHorizontal: 16,
    alignItems: 'center',
  },
  emptyStateEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  ctaButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  ctaButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  textInput: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButtonCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
  },
  modalButtonCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  modalButtonSave: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  modalButtonSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default BillsScreen;
