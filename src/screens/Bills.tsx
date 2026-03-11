import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { supabase } from '../services/supabase';

export default function BillsScreen({ navigation }: any) {
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    const { data } = await supabase.from('bills').select('*').order('created_at', { ascending: false });
    setBills(data || []);
    setLoading(false);
  };

  const getField = (val: any) => (val && typeof val === 'object' ? val.value : val) || '—';

  if (loading) return <SafeAreaView style={s.container}><ActivityIndicator size="large" color="#FF6B6B" /></SafeAreaView>;

  return (
    <SafeAreaView style={s.container}>
      <Text style={s.header}>Your Bills</Text>
      {bills.length === 0 ? (
        <View style={s.empty}><Text style={s.emptyText}>No bills yet!</Text><Text style={s.emptySubtext}>Scan your first bill to get started.</Text></View>
      ) : (
        <FlatList data={bills} keyExtractor={b => b.id} renderItem={({ item }) => (
          <TouchableOpacity style={s.card} onPress={() => navigation.navigate('Scan', { screen: 'BillResults', params: { billId: item.id, imageUri: item.images } })}>
            <Text style={s.provider}>{getField(item.parsed_data?.provider_name) || 'Unknown Provider'}</Text>
            <Text style={s.date}>{new Date(item.created_at).toLocaleDateString()}</Text>
            <Text style={s.total}>Total due: ${getField(item.parsed_data?.total_due) || '—'}</Text>
          </TouchableOpacity>
        )} contentContainerStyle={{ padding: 16 }} />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F0' },
  header: { fontSize: 28, fontWeight: '700', color: '#2D2D2D', padding: 20 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  provider: { fontSize: 16, fontWeight: '600', color: '#2D2D2D', marginBottom: 4 },
  date: { fontSize: 13, color: '#8B8B8B', marginBottom: 4 },
  total: { fontSize: 15, color: '#FF6B6B', fontWeight: '600' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 22, fontWeight: '700', color: '#2D2D2D', marginBottom: 8 },
  emptySubtext: { fontSize: 16, color: '#8B8B8B' },
});
