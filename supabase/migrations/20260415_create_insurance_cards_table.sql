-- Create insurance_cards table
create table public.insurance_cards (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  image_url text,
  insurance_company text,
  member_id text,
  group_number text,
  plan_name text,
  plan_type text,
  effective_date text,
  raw_parsed_data jsonb,
  created_at timestamp with time zone default now()
);

-- RLS policies
alter table public.insurance_cards enable row level security;

create policy "Users can view own insurance cards"
  on public.insurance_cards for select
  using (auth.uid() = user_id);

create policy "Users can insert own insurance cards"
  on public.insurance_cards for insert
  with check (auth.uid() = user_id);

create policy "Users can update own insurance cards"
  on public.insurance_cards for update
  using (auth.uid() = user_id);

create policy "Users can delete own insurance cards"
  on public.insurance_cards for delete
  using (auth.uid() = user_id);

-- Index for fast user lookups
create index insurance_cards_user_id_idx on public.insurance_cards(user_id);
