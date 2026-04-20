import { supabase } from './supabase';
import { DetectedError } from './errorDetection/types';
import { decryptField } from './billParser';

const getField = (val: any): string => {
  if (!val) return '';
  if (typeof val === 'object' && val.value !== undefined) return String(val.value);
  return String(val);
};

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
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  
  // Fetch user's profile for personalized patient name and address
  let userFirstName = '';
  let userLastName = '';
  let userAddress = '';
  let userCity = '';
  let userState = '';
  let userZip = '';
  
  if (user?.id) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (profile) {
        userFirstName = profile.first_name || '';
        userLastName = profile.last_name || '';
        userAddress = profile.address || '';
        userCity = profile.city || '';
        userState = profile.state || '';
        userZip = profile.zip || '';
      }
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
    }
  }
  
  // Extract real patient and provider names from billData
  let realPatientName = getField(billData.patient_name) || patientName || 'Patient';
  let realProviderName = getField(billData.provider_name) || providerName || 'Provider';
  
  // If user has saved profile, use their name instead of bill data
  if (userFirstName || userLastName) {
    realPatientName = `${userFirstName} ${userLastName}`.trim() || realPatientName;
  }
  
  // Decrypt if encrypted
  if (billData.patient_name_enc && !userFirstName && realPatientName) {
    try {
      realPatientName = await decryptField(realPatientName);
    } catch (err) {
      console.error('Failed to decrypt patient name:', err);
    }
  }
  
  if (billData.provider_name_enc && realProviderName) {
    try {
      realProviderName = await decryptField(realProviderName);
    } catch (err) {
      console.error('Failed to decrypt provider name:', err);
    }
  }
  
  // Fetch user's insurance card
  let insuranceData: { company: string; memberId: string; groupNumber: string; planName: string } | null = null;

  if (user?.id) {
    try {
      const { data: card } = await supabase
        .from('insurance_cards')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (card) {
        insuranceData = {
          company: card.insurance_company || '',
          memberId: card.member_id || '',
          groupNumber: card.group_number || '',
          planName: card.plan_name || '',
        };
      }
    } catch (err) {
      console.error('Failed to fetch insurance card:', err);
    }
  }

  // Build full address for letter signature
  const fullAddress = [userAddress, userCity, userState, userZip]
    .filter(part => part && part.trim())
    .join(', ');

  const url = process.env.EXPO_PUBLIC_SUPABASE_URL + '/functions/v1/generate-dispute-letter';
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + key,
      'apikey': key,
    },
    body: JSON.stringify({
      billData,
      errors,
      patientName: realPatientName,
      providerName: realProviderName,
      userAddress: fullAddress,
      insuranceData,
    }),
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

  // Update bill status to disputed
  await supabase
    .from('bills')
    .update({ status: 'disputed' })
    .eq('id', billId);

  return letterContent;
}
