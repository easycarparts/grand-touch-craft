# Easy Auto — Rebuild Setup & Plan

Rebuild **easyauto.ae** (WordPress directory, ~3,640 auto-service listings, ~1.3k organic visits/mo) as a
**fresh Next.js + Supabase** app. Goals: (1) preserve and grow SEO traffic, (2) capture leads and funnel
high-intent categories to our own services.

Stack: **Next.js** (server-rendered React, SEO-safe) · **Supabase** (Postgres DB, Auth, Storage, leads) · **Vercel** (hosting).

---

## Part A — New environment setup (one time)

Do these in order. Nothing here requires writing code yet.

### A1. Install the basics
- [ ] **Node.js LTS** — https://nodejs.org (download the "LTS" installer, accept defaults).
- [ ] **VS Code** — https://code.visualstudio.com (if not already installed).
- [ ] **Git** — https://git-scm.com (if not already installed).

Verify in a terminal:
```bash
node -v      # should print v20.x or v22.x
npm -v
git --version
```

### A2. Create the Next.js project
```bash
# pick a folder for the new project (NOT inside grand-touch-craft)
npx create-next-app@latest easy-auto
# When prompted, choose:
#   TypeScript ............ Yes
#   ESLint ................ Yes
#   Tailwind CSS .......... Yes
#   src/ directory ........ Yes
#   App Router ............ Yes
#   Turbopack ............. Yes
#   import alias .......... No (default @/*)
cd easy-auto
npm run dev      # open http://localhost:3000 — you should see the starter page
```

### A3. Add Supabase
```bash
npm install @supabase/supabase-js
```
Create a file named `.env.local` in the project root with your Supabase keys:
```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```
> ⚠️ **Never commit `.env.local` or paste the `service_role` key into chat.** `create-next-app` already
> git-ignores `.env*` — leave it that way. The service_role key is admin-level; treat it like a password.

### A4. Hosting account
- [ ] Create a **Vercel** account (free) and connect your GitHub — we deploy here later. Vercel + Next.js is the standard, zero-config pairing.

---

## Part B — What I need from you to start

| # | Item | How to get it | Needed for |
|---|------|---------------|-----------|
| 1 | **Listings CSV** | WP All Export (steps below) | Importing the 3,640 businesses |
| 2 | **News + Categories CSV** | WP All Export | News section + category pages |
| 3 | **Directory plugin / theme name** | WP admin → Plugins (or a screenshot of one listing's edit screen) | Knowing the exact field names |
| 4 | **Supabase project URL + anon key** | Supabase dashboard → Settings → API (paste these here OK; keep service_role in `.env.local` only) | Connecting the app |
| 5 | **Own-services funnel target** | Your WhatsApp number / booking link, + which categories should route to it (e.g. detailing, PPF, car wash) | The lead funnel |
| 6 | **Google Search Console access** | Add hello@sgservices.ae as owner, OR export Performance → top pages & queries to CSV | Phase 0 "before" baseline |

You said you'll set up Supabase and connect the API — perfect. Items **1, 2, 5** are the ones that unblock me most.

---

## Part C — Exporting your WordPress data (WP All Export)

1. WP admin → **Plugins → Add New** → search **"WP All Export"** → **Install** → **Activate**.
2. **All Export → New Export**.
3. Choose the **post type** for listings (named like *Businesses*, *Listings*, *Places*, or *GeoDirectory*
   depending on your plugin). Also do separate exports for **Posts** (news) and any **Categories/Taxonomies**.
4. In the field picker, **drag in** at minimum:
   - Title / business name
   - Permalink (URL) ← **critical for SEO mapping**
   - Description / content
   - Address, city/area, lat, long
   - Phone, WhatsApp, website
   - Category / taxonomy
   - Image URLs (featured + gallery)
   - Rating / review count (if present)
5. Export format: **CSV**. Run export → **Download**.
6. Safety backup: **Tools → Export → "All content" → Download Export File** (full WXR XML).
7. Send me the CSV(s). I'll map them to Supabase tables and write the import.

> Images: the CSV will contain image **URLs**. We can either hotlink them initially or batch-download and
> re-upload to Supabase Storage during import — decide later, not a blocker.

---

## Part D — Build phases

### Phase 0 — Baseline & safety (before any changes)
- [ ] I pull the full URL list from `sitemap_index.xml` (11 sub-sitemaps, 5 of them business listings).
- [ ] Capture current title/meta tags + top-ranking pages from Search Console.
- [ ] This is the "before" snapshot we measure against after launch.

### Phase 1 — Data
- [ ] Design Supabase tables: `businesses`, `categories`, `locations`, `news`, `reviews`, **`leads`**.
- [ ] Import the WP All Export CSVs into Supabase.

### Phase 2 — Pages Google sees (server-rendered)
- [ ] Homepage, category pages, listing pages, news — pulled from Supabase.
- [ ] **Programmatic location × category pages** ("Car Wash in Dubai Marina") — the traffic-growth lever.
- [ ] Re-apply per-page title/meta + JSON-LD structured data for rich results.

### Phase 3 — Lead engine
- [ ] Tracked WhatsApp / call / "Get a quote" buttons on every listing → logged to `leads` with category + location.
- [ ] High-intent categories matching our own services route to our funnel; others capture generic leads (flexible to monetize later).

### Phase 4 — Google-safe launch
- [ ] Match every old URL 1:1 or add 301 redirects.
- [ ] Generate and submit new `sitemap.xml` in Search Console.
- [ ] Point easyauto.ae at the new site (Vercel). Watch rankings ~2 weeks vs. Phase 0 baseline.

---

## Risk notes
- **Two careful steps:** the data migration (Phase 1) and the SEO pass (Phase 4). A mistake in either is the
  only thing that can lose traffic — both get verified, not rushed.
- **URLs are sacred.** `/business/[slug]/`, `/business-category/[cat]/`, `/news/[slug]/` must survive 1:1 or 301.
- Everything else is ordinary React + Supabase work, maintainable in-house (no recurring dev cost).
