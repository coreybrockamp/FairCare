// TypeScript definitions for database tables

export interface Bill {
  id: string;
  user_id: string;
  raw_ocr_text: string;
  parsed_data: Record<string, any>; // stored as JSONB in the database
  images: string; // could be comma-separated urls or JSON array as string
  status: string;
  created_at: string;
}

export interface EOB {
  id: string;
  user_id: string;
  bill_id: string;
  parsed_data: Record<string, any>; // JSONB
  created_at: string;
}
