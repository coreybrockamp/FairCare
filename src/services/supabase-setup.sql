-- Run these statements in the Supabase SQL editor (SQL > New query)

-- Enable Row Level Security on bills table
ALTER TABLE public.bills
  ENABLE ROW LEVEL SECURITY;

-- Policy: users can read their own bills
CREATE POLICY "Select own bills" ON public.bills
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: users can insert bills for themselves
CREATE POLICY "Insert own bills" ON public.bills
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: users can update their own bills
CREATE POLICY "Update own bills" ON public.bills
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: users can delete their own bills
CREATE POLICY "Delete own bills" ON public.bills
  FOR DELETE USING (auth.uid() = user_id);

-- Enable Row Level Security on eobs table
ALTER TABLE public.eobs
  ENABLE ROW LEVEL SECURITY;

-- Policy: users can read their own eobs
CREATE POLICY "Select own eobs" ON public.eobs
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: users can insert eobs for themselves
CREATE POLICY "Insert own eobs" ON public.eobs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: users can update their own eobs
CREATE POLICY "Update own eobs" ON public.eobs
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: users can delete their own eobs
CREATE POLICY "Delete own eobs" ON public.eobs
  FOR DELETE USING (auth.uid() = user_id);

-- Use the SQL editor to run this file; make sure you have the
-- bills and eobs tables created. RLS must be enabled for policies
-- to take effect. After running, verify by checking the policies
-- page in Supabase.
