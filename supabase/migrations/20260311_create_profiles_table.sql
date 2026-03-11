-- Create profiles table for storing user profile information
create table public.profiles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null unique references auth.users(id) on delete cascade,
  first_name text,
  last_name text,
  address text,
  city text,
  state text,
  zip text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create index on user_id for fast queries
create index profiles_user_id_idx on public.profiles(user_id);

-- Enable RLS for profiles table
alter table public.profiles enable row level security;

-- RLS policy: users can only see their own profile
create policy "Users can view their own profile"
  on public.profiles
  for select
  using (auth.uid() = user_id);

-- RLS policy: users can insert their own profile
create policy "Users can insert their own profile"
  on public.profiles
  for insert
  with check (auth.uid() = user_id);

-- RLS policy: users can update their own profile
create policy "Users can update their own profile"
  on public.profiles
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- RLS policy: users can delete their own profile
create policy "Users can delete their own profile"
  on public.profiles
  for delete
  using (auth.uid() = user_id);
