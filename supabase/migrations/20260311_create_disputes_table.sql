-- Create disputes table for storing generated dispute letters
create table public.disputes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  bill_id uuid not null references public.bills(id) on delete cascade,
  letter_content text not null,
  status text default 'draft' check (status in ('draft', 'submitted', 'resolved', 'rejected')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create index on user_id for faster queries
create index disputes_user_id_idx on public.disputes(user_id);
create index disputes_bill_id_idx on public.disputes(bill_id);

-- Enable RLS for disputes table
alter table public.disputes enable row level security;

-- RLS policy: users can only see their own disputes
create policy "Users can view their own disputes"
  on public.disputes
  for select
  using (auth.uid() = user_id);

-- RLS policy: users can only insert their own disputes
create policy "Users can insert their own disputes"
  on public.disputes
  for insert
  with check (auth.uid() = user_id);

-- RLS policy: users can only update their own disputes
create policy "Users can update their own disputes"
  on public.disputes
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- RLS policy: users can only delete their own disputes
create policy "Users can delete their own disputes"
  on public.disputes
  for delete
  using (auth.uid() = user_id);
