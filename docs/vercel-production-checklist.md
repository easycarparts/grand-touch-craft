# Vercel Production Checklist

Use this when deploying `grandtouchauto.ae`.

## App status

- Vercel routing is already configured in `vercel.json`
- local development still works on `http://localhost:8080`
- production build target works as a static Vite build
- Meta Pixel in `index.html` now uses the live pixel ID:
  - `2842874119378140`

## Vercel environment variables

Set these in Vercel for Production and Preview:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

These are client-side variables, so the `VITE_` prefix is required.

## Supabase dashboard settings

Open Supabase Dashboard -> Authentication -> URL Configuration.

Set:

- `Site URL`:
  - `https://www.grandtouchauto.ae`

Add these Redirect URLs:

- `https://www.grandtouchauto.ae`
- `https://www.grandtouchauto.ae/admin/login`
- `https://grandtouchauto.ae`
- `https://grandtouchauto.ae/admin/login`
- `http://localhost:8080`
- `http://localhost:8080/admin/login`

This keeps both local admin auth and production admin auth working.

## Supabase functions / secrets

These server-side pieces are already configured in Supabase and do not belong in Vercel:

- Meta lead intake
- Telegram CRM alerts
- Meta feedback dispatch

Important current Meta feedback target:

- dataset / pixel ID: `2842874119378140`

## Recommended production test

After deploy:

1. Open `https://www.grandtouchauto.ae/admin/login`
2. Sign in to admin
3. Open `/admin/leads`
4. Confirm leads load
5. Create a manual lead
6. Confirm Telegram alert arrives
7. Update a Meta lead to `Qualified`
8. Confirm Meta feedback row shows `Sent`

## Notes

- `supabase/config.toml` still contains localhost settings because it is for local Supabase CLI development, not production hosting.
- That file does not control your live Vercel domain.
