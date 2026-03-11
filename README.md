# FairCare

This mobile app helps users scan and manage medical bills. It is built with
Expo SDK 54, React Native, TypeScript, and Supabase.

## Project Notes

- **Database Types**: see `src/types/database.ts` for interfaces representing
	the `bills` and `eobs` tables; use them with Supabase queries.
- **Row Level Security**: run `src/services/supabase-setup.sql` in the Supabase
	SQL editor to enable RLS policies that limit users to their own records.
- **Onboarding Flow**: a three‑screen introduction appears once on first
	launch. Completion is tracked via AsyncStorage.
- **Privacy & Data Deletion**: the Profile tab includes a Privacy Policy screen
	and a button to delete all of the user's data and their account.

