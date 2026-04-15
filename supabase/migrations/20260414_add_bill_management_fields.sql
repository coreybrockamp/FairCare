-- Add due_date and family_member columns to bills table for bill management
alter table public.bills
add column if not exists due_date date,
add column if not exists family_member text;
