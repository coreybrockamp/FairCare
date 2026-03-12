import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
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

const TIPS = [
  '80% of medical bills contain errors',
  'Always compare your bill to your EOB',
  'You have the right to request an itemized bill',
  'Medical billing errors cost Americans $68 billion per year',
  'Never pay a bill before your insurance processes it',
];

const getField = (val: any) => (val && typeof val === 'object' ? val.value : val) || 'Unknown';

const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [totalBills, setTotalBills] = useState(0);
  const [totalDue, setTotalDue] = useState('$0.00');
  const [recentBills, setRecentBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileName, setProfileName] = useState<string | null>(null);

  // Fetch profile name on mount
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;
      try {
        const { data } = await supabase
          .from('profiles')
          .select('first_name')
          .eq('user_id', user.id)
          .single();
        if (data?.first_name) {
          setProfileName(data.first_name);
        }
      } catch (err) {
        // No profile yet, will use fallback
      }
    };
    fetchProfile();
  }, [user?.id]);

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    const namePart = profileName ? `, ${profileName.charAt(0).toUpperCase() + profileName.slice(1)}` : '';
    if (hour >= 5 && hour < 12) return `Good morning${namePart}`;
    if (hour >= 12 && hour < 18) return `Good afternoon${namePart}`;
    return `Good evening${namePart}`;
  };

  // Hide header on this screen
  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  // Rotate tips every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % TIPS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Fetch bills data when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      const fetchBillsData = async () => {
        try {
          setLoading(true);

          // Fetch all bills for count and total due
          const { data: allBills, error: allError } = await supabase
            .from('bills')
            .select('parsed_data')
            .order('created_at', { ascending: false });

          if (allError) throw allError;

          setTotalBills(allBills?.length || 0);

          // Calculate total due
          let total = 0;
          allBills?.forEach((bill) => {
            const totalDueVal = bill.parsed_data?.total_due?.value || bill.parsed_data?.total_due;
            if (totalDueVal) {
              const numVal = parseFloat(String(totalDueVal).replace(/[^0-9.]/g, ''));
              if (!isNaN(numVal)) total += numVal;
            }
          });
          setTotalDue(`$${total.toFixed(2)}`);

          // Fetch 3 most recent bills with decryption
          const { data: recent, error: recentError } = await supabase
            .from('bills')
            .select('id, created_at, images, parsed_data')
            .order('created_at', { ascending: false })
            .limit(3);

          if (recentError) throw recentError;

          // Decrypt provider names
          const decryptedRecent = await Promise.all(
            (recent || []).map(async (bill) => {
              let providerName = getField(bill.parsed_data?.provider_name);
              if (bill.parsed_data?.provider_name_enc && typeof bill.parsed_data.provider_name === 'string') {
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
          setRecentBills(decryptedRecent);
        } catch (err: any) {
          console.error('Home: Error fetching bills:', err);
        } finally {
          setLoading(false);
        }
      };

      fetchBillsData();
    }, [])
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatDueAmount = (val: any) => {
    if (!val) return '$0.00';
    const numVal = parseFloat(String(val).replace(/[^0-9.]/g, ''));
    return isNaN(numVal) ? '$0.00' : `$${numVal.toFixed(2)}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Greeting */}
        <Text style={styles.greeting}>{getGreeting()}! 👋</Text>
        <Text style={styles.subheading}>Your bills are safe with us</Text>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalBills}</Text>
            <Text style={styles.statLabel}>Bills Scanned</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalDue}</Text>
            <Text style={styles.statLabel}>Amount Due</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Errors Found</Text>
          </View>
        </View>

        {/* Scan Button */}
        <TouchableOpacity
          style={styles.scanButton}
          onPress={() => navigation.navigate('Scan' as any)}
        >
          <Text style={styles.scanButtonText}>Scan a Bill</Text>
        </TouchableOpacity>

        {/* Recent Bills Section */}
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Recent Bills</Text>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : recentBills.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No bills yet</Text>
              <Text style={styles.emptyStateSubtext}>Tap the button above to scan your first bill</Text>
            </View>
          ) : (
            recentBills.map((bill) => (
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
                <View style={styles.billCardContent}>
                  <Text style={styles.billProvider}>{bill.providerName}</Text>
                  <Text style={styles.billDate}>{formatDate(bill.created_at)}</Text>
                </View>
                <Text style={styles.billDue}>
                  {formatDueAmount(bill.parsed_data?.total_due?.value || bill.parsed_data?.total_due)}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Rotating Tip Card */}
        <View style={styles.tipCard}>
          <Text style={styles.tipLabel}>💡 Did you know?</Text>
          <Text style={styles.tipText}>{TIPS[currentTipIndex]}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  tipCard: {
    backgroundColor: COLORS.primary,
    margin: 16,
    marginTop: 24,
    marginBottom: 32,
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  tipLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    opacity: 0.9,
  },
  tipText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 2,
  },
  subheading: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginHorizontal: 16,
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 24,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  scanButton: {
    backgroundColor: COLORS.primary,
    marginHorizontal: 16,
    marginBottom: 24,
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  recentSection: {
    marginHorizontal: 16,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  billCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  billCardContent: {
    flex: 1,
  },
  billProvider: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  billDate: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  billDue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginLeft: 12,
  },
  loadingContainer: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

export default HomeScreen;