import { supabase } from './supabase';

const getVal = (field: any): string | null => {
  if (!field) return null;
  if (typeof field === 'object' && field.value !== undefined) return field.value;
  return String(field);
};

export async function parseInsuranceCard(imageBase64: string) {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL + '/functions/v1/parse-insurance-card';
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + key,
      'apikey': key!,
    },
    body: JSON.stringify({ imageBase64 }),
  });

  const text = await response.text();
  if (response.status !== 200) throw new Error('parse-insurance-card failed: ' + text);
  return JSON.parse(text);
}

export async function saveInsuranceCard(parsedData: any, imageBase64?: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) throw new Error('Not authenticated');

  const record = {
    user_id: user.id,
    insurance_company: getVal(parsedData.insurance_company),
    member_id: getVal(parsedData.member_id),
    group_number: getVal(parsedData.group_number),
    plan_name: getVal(parsedData.plan_name),
    plan_type: getVal(parsedData.plan_type),
    effective_date: getVal(parsedData.effective_date),
    raw_parsed_data: parsedData,
    image_url: imageBase64 ? `data:image/jpeg;base64,${imageBase64.substring(0, 100)}...` : null,
  };

  // Upsert: delete existing card for this user, then insert new one
  await supabase.from('insurance_cards').delete().eq('user_id', user.id);

  const { data, error } = await supabase
    .from('insurance_cards')
    .insert(record)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getInsuranceCard() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) return null;

  const { data, error } = await supabase
    .from('insurance_cards')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) return null;
  return data;
}

export async function deleteInsuranceCard() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('insurance_cards')
    .delete()
    .eq('user_id', user.id);

  if (error) throw error;
}
