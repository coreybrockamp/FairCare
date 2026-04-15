-- Add resolved_amount column for tracking savings on resolved bills
alter table public.bills
add column if not exists resolved_amount numeric;

-- Update status constraint to include 'clean' as a valid status
alter table public.bills drop constraint if exists bills_status_check;
alter table public.bills
add constraint bills_status_check check (status in ('scanned', 'errors_found', 'disputed', 'resolved', 'clean'));
