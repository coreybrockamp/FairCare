export interface DetectedError {
  id: string;
  error_type: 'duplicate' | 'upcoding' | 'unbundling';
  severity: 'high' | 'medium' | 'low';
  confidence: number;
  affected_line_items: number[];
  description: string;
  estimated_overcharge: number;
  suggested_action: string;
}

export interface LineItem {
  cpt_code?: any;
  description?: any;
  quantity?: any;
  unit_charge?: any;
  total_charge?: any;
  confidence_score?: number;
}

export interface ParsedBill {
  patient_name?: any;
  provider_name?: any;
  line_items?: LineItem[];
  total_due?: any;
  subtotal?: any;
  created_at?: string;
  [key: string]: any;
}
