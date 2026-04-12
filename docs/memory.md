# Project Memory

Last updated: `2026-04-12` (Asia/Dubai)

This file is the high-signal memory for future sessions.
It is meant to capture:

- what the user is trying to achieve
- what has already been built or changed
- what is currently working vs not working
- what decisions were made and why
- what the next likely steps are

Do **not** store secrets here.

---

## 1. Business context

The business is trying to sell premium `PPF` work in Dubai without getting dragged into low-intent, low-price, commodity-style leads.

The real commercial problem is:

- too many price shoppers
- too many weak leads from Meta lead forms
- too much discount pressure
- not enough signal back into ad platforms about what a *good* lead is

The user is explicitly willing to accept:

- higher CPL
- lower lead volume

if that leads to:

- better-fit leads
- higher close rate
- higher job value
- less discounting

The user does **not** want:

- bloated processes
- enterprise CRM admin
- complicated sales tooling
- generic marketing fluff

The user values:

- directness
- accountability
- premium positioning
- trust / workmanship / handover proof
- fewer but better leads

---

## 2. Website / landing-page strategy

### Current decision

The live Google Ads page at `/ppf-dubai-quote` is intentionally a **hybrid**:

- newer `V1` sections / hero / trust / proof content
- older calculator quote reveal and modal
- preserved Google Ads / UTM / gclid tracking from the old live page

This hybrid is deliberate.
It should not be casually “cleaned up.”

### Routes

- `/ppf-dubai-quote` = live paid page
- `/ppf-dubai-quote-v1` = test page

### Important files

- Live page:
  - [src/pages/PpfDubaiQuote.tsx](C:/Users/seane/Desktop/GTA%20Web/grand-touch-craft/src/pages/PpfDubaiQuote.tsx)
- Test page:
  - [src/pages/PpfDubaiQuoteV1.tsx](C:/Users/seane/Desktop/GTA%20Web/grand-touch-craft/src/pages/PpfDubaiQuoteV1.tsx)
- Backup of old live page:
  - [src/pages/PpfDubaiQuoteBackupPreV1Merge.tsx](C:/Users/seane/Desktop/GTA%20Web/grand-touch-craft/src/pages/PpfDubaiQuoteBackupPreV1Merge.tsx)

### Current component choice

Live page intentionally uses:

- `PpfCostCalculatorWidget`
- `PpfQuoteSummary`

Test page still uses:

- `PpfCostCalculatorWidgetV1`
- `PpfQuoteSummaryV1`

Reason:

- new page sections are better
- old calculator reveal and old modal are better

---

## 3. Paid funnel UX learnings

### What worked on the page

The page improved most when sections became:

- shorter
- more proof-led
- more visually scannable
- less “marketing explanation”

The strongest themes were:

- trust
- risk reduction
- direct accountability
- proper prep
- registered / traceable warranty
- real handovers

### What did not work

Sections got worse when they became:

- too text-heavy
- too strategy-language-heavy
- repetitive
- over-explained
- visually empty
- dependent on the user reading a lot

### Important design judgment

For PPC traffic:

- the first `3–8 seconds` matter most
- skimmability matters more than elegant long-form copy
- proof hierarchy matters more than sheer content volume

---

## 4. Google Ads status

### Current state

Google Ads API is set up and working locally through the repo.

The account can be inspected and mutated with local scripts.

### Important docs

- workflow:
  - [docs/google-ads-workflow.md](C:/Users/seane/Desktop/GTA%20Web/grand-touch-craft/docs/google-ads-workflow.md)
- detailed handoff:
  - [docs/google-ads-handoff.md](C:/Users/seane/Desktop/GTA%20Web/grand-touch-craft/docs/google-ads-handoff.md)

### Core finding

The campaign is **under-delivering because of rank**, not budget.

Key diagnosis pulled on `2026-04-12`:

- search impression share was low
- lost impression share on rank was very high
- lost impression share on budget was low

Interpretation:

- daily budget is not the main issue
- Google is not entering/winning enough auctions
- keyword relevance and ad rank are the main delivery problems

### Secondary finding

The original RSA copy was too repetitive.

Problem:

- too many headlines doing the same “keyword intent” job
- ad combinations looked stacked and generic

Fix applied:

- updated RSA set to a more balanced mix of:
  - intent
  - trust
  - process
  - handover
  - accountability

### Other live changes already applied

- CPC ceiling increased to `AED 18`
- additional competitor/detailer negatives added
- landing page tracking preserved

### Important gotcha

The script [scripts/google-ads/apply-expansion.mjs](C:/Users/seane/Desktop/GTA%20Web/grand-touch-craft/scripts/google-ads/apply-expansion.mjs) still hardcodes a CPC ceiling of `AED 12`.

If it is re-run without updating it, it may overwrite the current live bid ceiling.

---

## 5. Google Ads tracking on the live page

The live page already captures and uses:

- Google Ads conversion fire on successful form submit
- UTM parameters
- `gclid`

These must survive refactors.

Important markers exist in:

- [src/pages/PpfDubaiQuote.tsx](C:/Users/seane/Desktop/GTA%20Web/grand-touch-craft/src/pages/PpfDubaiQuote.tsx)

---

## 6. Funnel analytics and CRM

### Current state

The project now has:

- Supabase-backed admin auth
- Supabase-backed lead capture
- Supabase-backed funnel event storage
- a live funnel dashboard
- a live lead desk

### Intent score

The intent score is now intentionally weighted around:

- time on page
- scroll depth
- section depth
- video engagement
- calculator / quote exploration
- captured contact data
- final conversion actions

The detailed weighting is documented here:

- [docs/intent-score-model.md](C:/Users/seane/Desktop/GTA%20Website/grand-touch-craft/docs/intent-score-model.md)

### Lead desk behavior

The lead desk should not only show who the lead is.
It should also show what they were trying to buy.

Important expectation:

- each lead row can be expanded to reveal package / size / finish / coverage / estimate / engagement snapshot

### Fresh-session handoff

Use this document to start the next CRM build session without reloading the entire old thread:

- [docs/crm-next-step-handoff.md](C:/Users/seane/Desktop/GTA%20Website/grand-touch-craft/docs/crm-next-step-handoff.md)

The detailed line references are in:

- [docs/google-ads-handoff.md](C:/Users/seane/Desktop/GTA%20Web/grand-touch-craft/docs/google-ads-handoff.md)

---

## 6. Meta / social ads direction

### Current diagnosis

Meta lead forms are producing:

- low-intent leads
- cheap CPL
- weak close rate
- strong price-shopping behavior

The real issue is not just CPL.
It is:

- lead quality
- close rate
- ability to hold price

### Strategic view

The user’s instinct is directionally right:

- website conversion campaigns likely fit this premium offer better than very low-friction lead forms

But this is **not** automatically solved by just sending Meta traffic to the website.

Key critical points:

- website leads will probably be more expensive
- website leads may still be better if they close at better rates
- event setup matters a lot
- sending quality feedback back to platforms matters a lot

### Recommended Meta event hierarchy

Primary optimization event:

- `Lead`
  - successful website form submit

Secondary measurement event:

- `WhatsApp click`
  - or `Contact`

Do **not** optimize Meta primarily for WhatsApp clicks.

Reason:

- that will likely train Meta to find clickers, not serious buyers

### Channel page strategy

Do **not** build four separate standalone pages from scratch immediately.

Recommended:

- shared core page
- source-specific route variants

Likely route structure:

- Google
- Meta
- TikTok later
- organic stays canonical for now

See:

- [docs/lead-desk-and-paid-funnel-plan.md](C:/Users/seane/Desktop/GTA%20Web/grand-touch-craft/docs/lead-desk-and-paid-funnel-plan.md)

---

## 7. Lead desk / CRM decision

### Final recommendation

Do **not** adopt a heavy CRM first.

Do **not** stay on Google Sheets long-term.

Build a **lightweight internal lead desk**.

### Why

The user needs:

- one place to see all leads
- simple status changes
- follow-up reminders
- quality labels
- source visibility
- eventual feedback to ad platforms

The user does **not** need:

- enterprise CRM complexity
- many pipeline views
- too much manual admin

### Best stack

Use:

- current React app
- Supabase backend

This gives:

- auth
- Postgres
- migrations
- APIs
- flexibility to add feedback loops later

### MVP scope

One simple lead desk with:

- leads table
- lead detail drawer
- notes
- status
- quality label
- follow-up date
- source metadata

Recommended statuses:

- `new`
- `contacted`
- `quoted`
- `follow_up`
- `booked`
- `won`
- `lost`
- `junk`

Recommended quality labels:

- `premium_fit`
- `price_shopper`
- `not_ready`
- `no_answer`
- `wrong_service`
- `duplicate`

Detailed plan:

- [docs/lead-desk-and-paid-funnel-plan.md](C:/Users/seane/Desktop/GTA%20Web/grand-touch-craft/docs/lead-desk-and-paid-funnel-plan.md)

---

## 8. Website event tracking direction

### Yes, more event tracking is needed

But the rule is:

- lots of analytics events
- only a few optimization events

We do **not** want to overload ad platforms with weak conversion goals.

### Important event ideas

Analytics layer:

- landing page view by source
- hero CTA click
- WhatsApp click
- video play
- quote configurator start
- package selection
- quote unlock
- form start
- form submit

Optimization layer:

- `Lead` as primary
- WhatsApp / Contact as secondary
- later:
  - qualified lead
  - booked
  - won

---

## 9. Supabase status

### Current status

The repo now has:

- [supabase/config.toml](C:/Users/seane/Desktop/GTA%20Web/grand-touch-craft/supabase/config.toml)
- [supabase/.temp](C:/Users/seane/Desktop/GTA%20Web/grand-touch-craft/supabase/.temp)

This means:

- `supabase init` has been run
- there is evidence the repo is linked to a project

### CLI note

On this Windows machine:

- plain `npx supabase ...` can fail because of PowerShell execution policy
- `npm.cmd exec supabase -- ...` works

Use that pattern in future sessions.

Example:

```powershell
npm.cmd exec supabase -- --version
```

### Important nuance

`supabase status` failed because it checks the **local Docker stack**, and Docker is not available/running here.

That does **not** mean the hosted project is unusable.

### Next useful Supabase step

Run:

```powershell
npm.cmd exec supabase -- db pull
```

That is the real test for hosted-project schema access.

---

## 10. User preferences and working style

The user prefers:

- blunt, critical feedback
- no fake agreement
- practical recommendations
- strong taste in design and conversion clarity
- short, direct, high-signal iteration

The user responds well to:

- section-by-section review
- exact copy change instructions
- clear “keep / change / delete” recommendations

The user dislikes:

- bloated admin tools
- generic marketing advice
- fluff
- too much duplicated text
- overbuilt solutions

### Important operating principle

The user wants the page / ads / CRM to support:

- higher intent
- higher ticket
- less price compression

Even if:

- CPL goes up
- lead volume goes down

That trade is acceptable if:

- close rate improves
- average selling price improves

---

## 11. Files and docs worth reading first in a future session

Start with:

1. [docs/memory.md](C:/Users/seane/Desktop/GTA%20Web/grand-touch-craft/docs/memory.md)
2. [docs/google-ads-handoff.md](C:/Users/seane/Desktop/GTA%20Web/grand-touch-craft/docs/google-ads-handoff.md)
3. [docs/lead-desk-and-paid-funnel-plan.md](C:/Users/seane/Desktop/GTA%20Web/grand-touch-craft/docs/lead-desk-and-paid-funnel-plan.md)

Then inspect:

- [src/pages/PpfDubaiQuote.tsx](C:/Users/seane/Desktop/GTA%20Web/grand-touch-craft/src/pages/PpfDubaiQuote.tsx)
- [src/pages/PpfDubaiQuoteV1.tsx](C:/Users/seane/Desktop/GTA%20Web/grand-touch-craft/src/pages/PpfDubaiQuoteV1.tsx)
- [scripts/google-ads/update-rsa-copy.mjs](C:/Users/seane/Desktop/GTA%20Web/grand-touch-craft/scripts/google-ads/update-rsa-copy.mjs)
- [scripts/google-ads/apply-expansion.mjs](C:/Users/seane/Desktop/GTA%20Web/grand-touch-craft/scripts/google-ads/apply-expansion.mjs)

---

## 12. Most likely next tasks

The highest-value next tasks are probably:

1. Supabase `db pull`
2. define first migrations for:
   - auth
   - leads
   - lead events
   - notes
   - follow-ups
3. build the lead desk MVP
4. add better website event tracking
5. create channel-specific LP variants
6. later wire Meta / Google / TikTok feedback loops

### Current execution priority

Use:

- [docs/meta-funnel-roadmap.md](C:/Users/seane/Desktop/GTA%20Website/grand-touch-craft/docs/meta-funnel-roadmap.md)

as the active build order for:

- Meta funnel
- tracking foundation
- funnel dashboard
- `/admin` lead desk

---

## 13. Non-secret safety reminders

Do **not** store in docs:

- private keys
- service account JSON
- developer tokens
- service role keys
- DB passwords

If secrets are needed:

- use local env files
- use Supabase CLI login / link locally
- keep service-role style credentials out of frontend code
