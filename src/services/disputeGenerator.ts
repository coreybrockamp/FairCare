import { supabase } from './supabase';
import { DetectedError } from './errorDetection/types';

export async function generateDisputeLetter(
  billId: string,
  errors: DetectedError[],
  patientName: string,
  providerName: string
): Promise<string> {
  const { data: bill, error: billError } = await supabase
    .from('bills')
    .select('*')
    .eq('id', billId)
    .single();

  if (billError || !bill) {
    throw new Error('Failed to fetch bill: ' + (billError?.message || 'Bill not found'));
  }

  const billData = bill.parsed_data || {};
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL + '/functions/v1/generate-dispute-letter';
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + key,
      'apikey': key,
    },
    body: JSON.stringify({ billData, errors, patientName, providerName }),
  });

  const resText = await res.text();
  console.log('generate-dispute-letter status:', res.status, resText.substring(0, 200));
  if (!res.ok) throw new Error('generate-dispute-letter failed: ' + resText);

  const letterContent = JSON.parse(resText)?.letter || '';

  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (userId) {
    await supabase.from('disputes').insert([{
      user_id: userId,
      bill_id: billId,
      letter_content: letterContent,
      status: 'draft',
      created_at: new Date().toISOString(),
    }]);
  }

  return letterContent;
}
