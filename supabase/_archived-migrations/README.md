# Archived migrations

These migrations were never applied to the remote database (project lkikhrrzhddrdjfbbwjk).
Parked on 2026-08-05 at Sean's request so `supabase db push` never replays them.

They are kept rather than deleted because they document intent, and several of the
schema objects they describe were later created directly in the Supabase dashboard
(the remote has 6 migrations with no local file, from 2026-07-04).

All were verified additive at parking time: no DROP TABLE, DROP COLUMN, TRUNCATE,
DELETE or RENAME statements. To restore one, move it back into supabase/migrations/.
