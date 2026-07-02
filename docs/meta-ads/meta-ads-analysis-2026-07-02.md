# Meta Ads — Full Account Analysis & Ad Ranking (2026-07-02)

Source: `meta-ads-export-2026-07-02.csv` (this folder) — reporting window 2025-10-25 → 2026-07-02, 100 ad rows, **AED 53,262 total spend**. Only ads with meaningful spend are ranked (owner rule: ~AED 1,000+; a few 500–1,000 noted as honorable mentions).

Result types are NOT comparable to each other — ranked within type:
- `leadgen.other` = Meta instant lead forms (name+number inside Meta)
- `fb_pixel_lead` = website pixel Lead (the gated calculator funnel)
- `messaging_conversation_started` = WhatsApp/DM conversations (unqualified-prone)

---

## 🥇 The headline finding: vehicle-specific creatives beat generic offers, every time

| Creative style | Examples | CPL range |
|---|---|---:|
| **Specific car model** | Jetour/G700, Patrol, Defender, 911 | **AED 15–52** |
| Generic offer | "20% off PPF", "Fast PPF", "New Leads ad (General)" | AED 57–88+ |

Every ad worth rerunning is a *car-model* ad. Every generic "offer" ad underperformed. This is the single most valuable pattern in the account.

---

## Lead-form ads ranked (spend ≥ ~1,000 AED)

| # | Ad | Ad set | Spend | Leads | CPL | Verdict |
|--:|---|---|--:|--:|--:|---|
| 1 | **Jetour Ad01** | G700 Ads | 1,905 | 125 | **15.24** | All-time best ad in the account. G700 product (not PPF). |
| 1b | Jetour Ad01 (scaled) | G700 Qauli Form | 21,440 | 565 | 37.95 | Same ad at scale: CPL 2.5×'d and freq hit 3.5 (fatigue) — the vertical-scaling lesson in one row. |
| 2 | **Colour PPF – Sean** | Colour PPF | 1,619 | 54 | **29.99** | Cheapest PPF-adjacent CPL at scale. ⚠️ Colour-change intent — does NOT fit the gloss/matte full-PPF calculator funnel. Rerun only as a lead-form campaign for the colour service. |
| 3 | New Leads ad | Ceramic | 1,877 | 62 | 30.27 | Ceramic service, strong CPL — separate offer, not PPF funnel. |
| 4 | **Patrol Ad01** | Patrol Qauli | 2,378 | 53 | **44.86** | ★ Best true-PPF ad at scale. Patrol = UAE's biggest SUV market. |
| 5 | **Defender Ad3** | Defender PPF | 1,803 | 39 | **46.22** | ★ Proven PPF ad. (Defender Ad1 did 35.10 CPL on 316 spend — same concept validated twice.) |
| 6 | **911 1** | 911 Premium | 1,868 | 36 | **51.88** | ★ Proven premium/sports segment ad. |
| 7 | New Leads ad | 20% off | 1,029 | 18 | 57.17 | Generic offer — weak. |
| 8 | 20% of PPF – SEAN | Sean Offerings | 1,413 | 24 | 58.89 | Generic offer — weak. |

Honorable mentions (500–1,000 spend): Jetour Ad02 (34.07), New Leads/wrap (36.57), Jetour Blue (45.46), ROX01 (45.69).

**Do NOT rerun** (proven expensive): Hubabe Prado (68.37), 911 orig (76.68), Fast PPF (76.73), Defender Ad2 (100.51), V01 Long Form (144.64), Retargeting X7 (153.51), New Leads ad/PPF (267.03), old website ad 29/10 (321.19).

## Website pixel-lead ads (the funnel that feeds the CRM)

| Ad | Ad set | Spend | Leads | CPL | Note |
|---|---|--:|--:|--:|---|
| **New Leads Ad** | test 1 | 1,137 | 28 | **40.62** | The proven website-funnel ad. Quality rank "below avg" (creative fatigue) but conversion rank "above avg" — the funnel converts, the creative is tired. |
| New Leads Ad | test 2 | 157 | 1 | 156.65 | The failed scaling duplicate — killed correctly. |

## WhatsApp/messaging ads
Ceramic GTS4 (13.58/convo), Detail (16.21), 250 colors (22.32) — cheap conversations, but these are the unqualified-chat type the owner has confirmed rarely close. Fine for ceramic/detailing fillers; not the PPF growth engine.

---

## Recommended new campaign (the V3-experience website test)

**Structure** — a NEW campaign (required: the existing "test 1/test 2" campaign is CBO, so a fixed-budget ad set can't live inside it):
- Campaign: `PPF Website Leads - Gated Funnel - Jul 2026`, Leads objective, **ABO** (ad set budget), no CBO.
- 1 ad set · **AED 100/day** (the proven pocket — both scaling attempts above 100/day broke: test 2 at 156 CPL, Jetour at 2.5× CPL). Advantage+ audience, UAE, website conversion location, **pixel Lead event**, 7-day click/1-day view.
- **3 ads (re-cut for website clicks, not lead forms):**
  1. **Patrol Ad01** creative
  2. **Defender Ad3** creative
  3. **911 1** creative
  — the three proven true-PPF vehicle ads, covering SUV mainstream / SUV premium / sports. CTA: "See your price in 60 seconds" → calculator.
- ⚠️ **Destination URL must be** `https://www.grandtouchauto.ae/ppf-meta-full-car-ppf-v2` (+ your fb UTMs). This IS the "V3 experience" (gated price, direct WhatsApp) — but on the Meta route, which fires the pixel `Lead` events the ad set optimizes on. **Do NOT use the `-guided-v3` URL: that route fires Google tags only — the ad set would record zero Leads.**
- Keep **test 1 running unchanged** alongside — it's the control.

**Operating rules (from this account's own scars):**
1. No edits for 7 days after launch.
2. Kill an ad only if it spends >AED 150 (≈3× target CPL) with 0 leads.
3. **Never raise the budget on a working ad set.** Scale horizontally: duplicate the ad set/campaign at another 100/day.
4. Judge by CRM captures (funnel `ppf_meta_guided_calculator_v2`) × close rate — not platform lead count alone.
5. Watch frequency: past ~2.5 the account's CPLs inflate (Jetour at 3.5 = 2.5× CPL).

**Expectation-setting:** the 40–52 CPLs above are instant-form CPLs; a gated website funnel usually starts higher (more friction) but the leads carry numbers + configured quotes into the CRM. Break-even math: at ~AED 10k average job, even 1 close per ~15 leads beats the form-fill economics.
