import { supabase } from './supabase';
import { DetectedError } from './errorDetection/types';

interface BillData {
  total_due?: string | number;
  subtotal?: string | number;
  patient_responsibility?: string | number;
  line_items?: Array<{
    cpt_code?: string;
    description?: string;
    total_charge?: string | number;
  }>;
}

export async function generateDisputeLetter(
  billId: string,
  errors: DetectedError[],
  patientName: string,
  providerName: string
): Promise<string> {
  // Fetch bill details from Supabase
  const { data: bill, error: billError } = await supabase
    .from('bills')
    .select('*')
    .eq('id', billId)
    .single();

  if (billError || !bill) {
    throw new Error(`Failed to fetch bill: ${billError?.message || 'Bill not found'}`);
  }

  const billData: BillData = bill.parsed_data || {};

  try {
    // Call edge function to generate letter
    const response = await supabase.functions.invoke('generate-dispute-letter', {
      body: {
        billData,
        errors,
        patientName,
        providerName,
      },
    });

    if (response.error) {
      throw new Error(response.error.message || 'Failed to generate letter');
    }

    const letterContent = response.data?.letter || '';

    // Save letter to disputes table
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const { data: dispute, error: saveError } = await supabase
      .from('disputes')
      .insert([
        {
          user_id: userId,
          bill_id: billId,
          letter_content: letterContent,
          status: 'draft',
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (saveError) {
      console.error('Failed to save dispute:', saveError);
      // Still return the letter even if save fails
      return letterContent;
    }

    return letterContent;
  } catch (err: any) {
    console.error('Error generating dispute letter:', err);
    throw err;
  }
}
