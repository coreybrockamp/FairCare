import { supabase } from './supabase';

export async function parseEOB(imageBase64: string) {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL + '/functions/v1/parse-eob';
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
  if (response.status !== 200) throw new Error('parse-eob failed: ' + text);
  return JSON.parse(text);
}

export async function saveEOB(billId: string, parsedData: any) {
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('eobs')
    .insert({
      user_id: user?.id,
      bill_id: billId,
      parsed_data: parsedData,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
