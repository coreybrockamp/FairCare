-- Add status column to bills table if it doesn't exist
alter table public.bills
add column if not exists status text default 'scanned' check (status in ('scanned', 'errors_found', 'disputed', 'resolved'));

-- Create index on status for fast filtering
create index if not exists bills_status_idx on public.bills(status);
create index if not exists bills_user_status_idx on public.bills(user_id, status);
