-- Placeholder for a migration applied directly in the Supabase dashboard on
-- 2026-07-04, which therefore exists in the remote migration ledger but had no
-- local file. That mismatch blocks `supabase db push`.
--
-- Intentionally empty: the remote already records version 20260704105220 as applied, so the
-- CLI skips it. This file exists only so local and remote histories line up.
-- The original SQL was not captured; run `supabase db pull` if you ever need
-- the real schema definition in version control.
select 1;
