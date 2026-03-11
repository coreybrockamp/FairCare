import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { supabase } from '../services/supabase';
import { decryptField } from '../services/billParser';

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

interface BillsScreenProps {
  navigation: StackNavigationProp<any>;
}

function BillsScreen({ navigation }: BillsScreenProps) {
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch bills when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      const fetchBills = async () => {
        try {
          setLoading(true);

          const { data, error } = await supabase
            .from('bills')
            .select('id, created_at, images, parsed_data')
            .order('created_at', { ascending: false });

          if (error) throw error;

          // Decrypt provider names
          const decryptedBills = await Promise.all(
            (data || []).map(async (bill) => {
              let providerName = bill.parsed_data?.provider_name?.value || bill.parsed_data?.provider_name || 'Unknown Provider';
              if (bill.parsed_data?.provider_name_enc) {
                try {
                  providerName = await decryptField(bill.parsed_data.provider_name);
                } catch (e) {
                  console.error('Decrypt error:', e);
                }
              }
              return {
                ...bill,
                providerName,
              };
            })
          );
          setBills(decryptedBills);
        } catch (err: any) {
          console.error('Bills: Error fetching bills:', err);
        } finally {
          setLoading(false);
        }
      };

      fetchBills();
    }, [])
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDueAmount = (val: any) => {
    if (!val) return '$0.00';
    const numVal = parseFloat(String(val).replace(/[^0-9.]/g, ''));
    return isNaN(numVal) ? '$0.00' : `$${numVal.toFixed(2)}`;
  };

  const getStatus = () => {
    return 'Pending Review';
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>All Bills</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading your bills...</Text>
          </View>
        ) : bills.length === 0 ? (
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
        ) : (
          <View style={styles.billsList}>
            {bills.map((bill) => (
              <TouchableOpacity
                key={bill.id}
                style={styles.billCard}
                onPress={() =>
                  navigation.navigate('Scan' as any, {
                    screen: 'BillResults',
                    params: { billId: bill.id, imageUri: bill.images },
                  })
                }
              >
                <View style={styles.billCardTop}>
                  <View>
                    <Text style={styles.billProvider}>{bill.providerName}</Text>
                    <Text style={styles.billDate}>{formatDate(bill.created_at)}</Text>
                  </View>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>{getStatus()}</Text>
                  </View>
                </View>

                <View style={styles.billCardBottom}>
                  <View>
                    <Text style={styles.billLabel}>Total Due</Text>
                    <Text style={styles.billDue}>
                      {formatDueAmount(
                        bill.parsed_data?.total_due?.value || bill.parsed_data?.total_due
                      )}
                    </Text>
                  </View>
                  <Text style={styles.arrowIcon}>›</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  billsList: {
    padding: 16,
  },
  billCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  billCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  billProvider: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  billDate: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  statusBadge: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.primary,
  },
  billCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  billLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  billDue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  arrowIcon: {
    fontSize: 28,
    color: COLORS.textSecondary,
    marginRight: -8,
  },
  loadingContainer: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
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
});

export default BillsScreen;
