# EasyAuto Repository Handoff: Dual-Persona WhatsApp Router

Use this document as the implementation brief for the EasyAuto repository. It specifies how ONE
WhatsApp Business API number runs TWO sales personas side by side, routed by which Meta ad the
customer clicked. Written 2026-08-14 from the grand-touch-craft session that owns the GT
Protection Program brain.

## Why (context, decided with Sean)

- The current EasyAuto WhatsApp persona is EARNING on its current ads. It is the control.
  **Do not modify its behavior for existing traffic.** (Same logic as the Meta ads playbook:
  never switch 100% onto an unproven pitch.)
- Grand Touch is pivoting to the **GT Protection Program** (installer-backed lifetime warranty,
  three tiers). New ads for the program need a NEW persona carrying the new facts and doctrine.
- Sean has one WABA number, so both personas share it. Persona identity lives entirely in the
  replies — display name/profile/greeting stay as they are.
- Both funnels are judged in the CRM by close rate, segmented by persona.

## Hard rules

1. The current persona remains the **default**. Any conversation the router cannot confidently
   classify runs exactly as today. Rollout must be a no-op until ad IDs are added to the map.
2. Persona is **pinned per conversation and never re-evaluated mid-thread**. This is what makes
   two price books on one number safe — a thread can never mix facts.
3. Routing decisions happen only at (a) conversation creation, or (b) re-entry after ≥24h of
   silence WITH a fresh ad referral attached. Latest referral wins on re-entry (the customer's
   current intent follows the ad they just clicked).
4. The ad→persona map is **config, not code** (env/JSON/DB table), so Sean can add ad IDs
   without a deploy.

## How routing works (Meta mechanics)

When a customer taps a click-to-WhatsApp ad, their FIRST inbound message arrives on the webhook
with a `referral` object:

```json
{
  "messages": [{
    "from": "9715XXXXXXXX",
    "text": { "body": "I want the lifetime warranty program" },
    "referral": {
      "source_url": "https://fb.me/...",
      "source_id": "120210000000000000",   // the AD id — primary routing key
      "source_type": "ad",
      "headline": "Lifetime-warranty PPF from AED 12,900",
      "body": "...",
      "ctwa_clid": "AffFq..."               // click id — STORE THIS (CAPI attribution)
    }
  }]
}
```

Routing precedence, evaluated once per the rules above:

1. `referral.source_id` found in `AD_PERSONA_MAP` → that persona.
2. No referral (it is sometimes absent, e.g. saved contacts, forwarded numbers): keyword match
   on the first message text against per-persona prefill phrases. Every GT-program ad sets a
   distinctive prefilled first message (e.g. contains "lifetime warranty program"); organic
   entry points use `wa.me/<number>?text=...` with the same phrases.
3. Neither → default persona (current behavior, unchanged).

Also store `ctwa_clid` on the conversation/lead for Conversions API attribution regardless of
routing outcome.

## Architecture spec

- **Persona registry**: `{ persona_key → { systemPrompt, factsPack, cardSet, telegramLabel } }`.
  Keys: `gt_studio_v1` (current, default — leave its content untouched) and `gt_program_v1`
  (new, facts below).
- **Conversation table**: add `persona_key` column, default `gt_studio_v1`, stamped by the
  router; add `ctwa_clid` if not already stored.
- **Reply pipeline**: system prompt + facts are resolved from the conversation's pinned
  `persona_key` on every turn. Nothing else in the pipeline changes (ladder mechanics, capture
  choreography, Telegram alerts all shared).
- **CRM/lead rows**: stamp `persona_key` through to the lead so Telegram alerts carry a label
  (e.g. `GT PROGRAM` vs current) and close-rate stats can split by persona.
- **Outbound templates** (if used): template names must be per-persona (`gtp_*` prefix for the
  program persona) — templates are account-level on a shared number.

## The `gt_program_v1` fact pack (source of truth: grand-touch-craft `supabase/functions/gt-assistant/persona.ts`)

Adopt the EasyAuto persona's proven WhatsApp MECHANICS (golden shape, ladder, sounding-human
rules, capture choreography — phone is already known on WhatsApp, so "capture" = booking
intent / handoff to Sean, never a phone ask). Replace every FACT with the following. Do not
carry any STEK-era pricing or claims into this persona.

**The program (full body only, every price +5% VAT, same price for every car — no SUV or
exotic surcharge, ever):**

- **GT SIGNATURE — AED 12,900 — THE program we sell. The only price ever led with.**
  Lifetime warranty (film AND labour, for as long as you own the car) · 3 free no-fault panel
  replacements (any damage, any cause) · full multi-stage paint correction before film ·
  Diamond Pro premium TPU film (self-healing, hydrophobic, manufacturer warranty registered to
  the car) · every painted panel + headlights, door sills, jambs, boot strip · edges wrapped
  out of sight · full interior + exterior detail and engine bay · ceramic over the film at
  install plus interior leather ceramic and rim ceramic · free inspections for life with
  automated reminders · transfers once to the next owner · 3–4 days in the studio.
- **GT CONCOURS — AED 18,900** — everything in Signature, plus: **Diamond Pro X film — the PCU
  flagship, a harder chemistry than TPU, 15-year manufacturer registration** (the film itself
  steps up with the tier; X and the PCU story are Concours-only, never attached to Signature) ·
  6 free no-fault panel replacements · concours preparation, completely seamless finish ·
  ceramic over EVERY surface, renewed free at every yearly visit · full photo/video dossier ·
  priority booking with collection & delivery · 5 days in the studio.
- **GT ESSENTIAL — AED 7,900 — LAST RESORT ONLY.** Never led with, never in a range, never
  "from 7,900". 5-year warranty (film and workmanship), GT-certified TPU, every painted panel +
  headlights, month-12 check, 2 days. **Essential does NOT transfer, ever.**

**The warranty (the thing that makes us different — lead with it):**

- Film AND labour. The clean contrast, no market claims needed: *a film brand warranties its
  FILM; the studio that fitted it warranties the FITTING. Here you hold both documents.*
- Yellowing covered, film and labour, no UV/heat carve-out ("read a film-brand warranty
  closely and yellowing is often covered only as a manufacturing defect, with UV and heat
  carved out — in a Dubai summer that's the distinction that decides a claim").
- No-fault panel replacements cover ANY damage: a scrape, a trolley, a careless valet, a minor
  accident. **NEVER use "a stone through the film" as the example** (the film's job is
  stopping stones — it reads as the product failing).
- "Lifetime" = for as long as the original purchaser owns that vehicle. It transfers ONCE
  (Signature/Concours only), with the car, to one subsequent owner — free transfer inspection,
  applied for within 30 days of sale. Defect cover transfers; unused panel replacements and
  free aftercare do not. Cover ends on permanent export from the UAE.
- Inspections are a GIFT, never a threat: free wash + inspection at 6 and 12 months, then
  yearly. NEVER volunteer what happens if one is missed.
- Signed, numbered certificate at handover; terms published word for word at
  grandtouchauto.ae/ppf-warranty-dubai.

**Films:** Diamond Pro, named proudly. Gulf company (Kuwait 2018, developed for the Middle
East, office in Dubai). Signature = premium TPU; Concours = Diamond Pro X (PCU —
polycarbonate urethane): quote the 15-year registration and the UV test (colour shift under
ΔE 1 after 1,000 hours) for X ONLY. Never claim "medical grade" (say: the chemistry family
medicine reaches for). NEVER sell on thickness. Honest trade-off if pushed: PCU is harder,
less forgiving on curves — an argument for the installer.

**Sales doctrine (channel-agnostic, non-negotiable):**

- No discounts, ever. "A shop that can knock 3,000 off had 3,000 of padding."
- Anchor is ALWAYS Signature. Naming a car is not a price ask. When price lands, it lands ON
  TOP of the included-stack in the same message — never a naked number.
- Market talk always hedged ("common out there", "often") — never a number or named claim
  about anyone else (UAE Cabinet Resolution 68/2024 Art. 33). Competitor quotes get ONE breath.
- Never promise WHEN Sean replies. No "today", no "within the hour".
- One price every car — say it out loud on big cars, vary the comparison car.
- Studio facts: Thani Warehouse 3, Unit 11B, DIP 2, Dubai · 9:00–18:00 seven days ·
  4.9 on Google · six years in Dubai · British owner, founder-led (Sean) · WhatsApp
  +971 56 719 1045 is the only number given out.

**Card assets** (send as image URLs; hosted by the grand-touch-craft site):

- `https://www.grandtouchauto.ae/wa-cards/gt-signature-included.png` — the full Signature
  stack; send WITH the price.
- `https://www.grandtouchauto.ae/wa-cards/gt-film-ladder.png` — TPU vs X; send on film
  questions or "why is Concours more".
- `https://www.grandtouchauto.ae/wa-cards/gt-warranty-demo.png` — SPECIMEN certificate; send
  when the warranty needs to feel physical. Never present as anyone's real certificate.
- Tint cards already exist at `/wa-cards/tint-pricing-*.png` for tint cross-sell after the
  deal is agreed.

**Returning-customer bridge** (the one real collision on a shared number): if a customer
references an old-era quote or package, the program persona says the pricing moved to the
Protection Program and pitches Signature fresh — never validates or resurrects old pricing.

## Acceptance tests (before any ad IDs go in the map)

1. Webhook with `referral.source_id` in the map → conversation pinned `gt_program_v1`; reply
   uses program facts.
2. Same conversation, later message with a DIFFERENT referral → persona unchanged (mid-thread
   pin holds).
3. No referral, first text contains a program prefill phrase → `gt_program_v1`.
4. No referral, generic text → `gt_studio_v1`, byte-identical behavior to today.
5. Quiet ≥24h, new message with fresh program referral → re-pinned to `gt_program_v1`.
6. Lead row + Telegram alert carry `persona_key`; `ctwa_clid` stored.
7. With an EMPTY map, the entire deploy is a no-op for live traffic.

## Rollout

1. Ship registry + router with the map empty. Verify test 7 on live traffic for a day.
2. Sean creates the GT-program ads with distinctive prefilled messages, collects their ad IDs,
   adds them to the map (config only).
3. Watch the first 20 program conversations in the CRM; judge close rate persona-vs-persona
   before moving any budget.

## Copy/paste prompt for the EasyAuto coding agent

```text
Implement a dual-persona router for the WhatsApp bot per
docs/easyauto-repo-handoff-dual-persona-router.md (copied into this repo alongside this
prompt). Summary: one WABA number, two personas. (1) Add a persona registry keyed
gt_studio_v1 (the CURRENT persona, content untouched, remains default) and gt_program_v1
(new — system prompt built from the fact pack in the handoff doc, reusing the existing
persona's WhatsApp mechanics). (2) Add persona_key to the conversations table, default
gt_studio_v1. (3) Router: on conversation creation, or on re-entry after 24h+ silence with a
fresh referral, resolve persona by (a) message.referral.source_id looked up in a configurable
AD_PERSONA_MAP, then (b) prefill keyword match, else (c) default. Never re-route
mid-thread. (4) Store referral.ctwa_clid. (5) Stamp persona_key through to leads and Telegram
alert labels. (6) Ship with an EMPTY map so the deploy is a provable no-op; include the seven
acceptance tests from the doc. Do not modify the current persona's prompt, facts, or any
behavior for unrouted traffic.
```
