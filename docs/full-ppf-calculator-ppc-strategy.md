# Full PPF Calculator PPC Strategy

Last updated: 2026-05-22

## Purpose

The `/ppf-full-ppf-calculator` page was created as a Google PPC landing page for buyers who are already searching for PPF price, PPF cost, or full car PPF in Dubai.

The goal is not to educate every visitor from zero. The goal is to turn high-intent Google search traffic into qualified WhatsApp conversations for profitable full PPF jobs.

This page is deliberately different from the broader `/ppf-dubai-quote` landing page and the SEO-focused `/ppf-cost-calculator` page.

## Core Problem

Grand Touch is being pulled into a market-wide price war, especially on Meta, where buyers see cheap PPF offers after interacting with ads.

The risk with a normal PPF lead page is that it attracts:

- price-only shoppers
- people comparing film brand names as if every install is identical
- users who want a vague quote before they understand Grand Touch's standard
- low-budget leads who waste sales time

The calculator is designed to filter those people earlier while still keeping friction low enough for Google PPC.

## Why The Page Leads With Price

Google search traffic is intent-driven. A user searching `ppf price dubai`, `ppf cost dubai`, or `full ppf dubai` is usually looking for a number.

If the page starts with a long trust story before showing price, the user may bounce or WhatsApp another shop.

So the page leads with:

- "Full Car PPF Price in Dubai"
- a 30-second estimate promise
- starting price shown upfront
- a calculator visible above the fold on desktop

Expected impact:

- higher landing page relevance for PPC traffic
- better conversion rate from search click to calculator engagement
- fewer visitors feeling trapped behind a lead form
- stronger alignment with price-intent keywords

## Why It Is Full PPF Only

The business goal is to sell profitable full PPF, not front PPF or low-ticket alternatives.

Front PPF was removed from this PPC journey because it creates an internal cheaper comparison. If a user sees front PPF on the same page, they may downgrade themselves before sales has a chance to qualify them.

This page should not say:

> Here are all protection options.

It should say:

> If you are considering full-car PPF, here is the starting price range and how to confirm it.

Expected impact:

- cleaner buyer intent
- fewer low-value conversations
- stronger ad-to-page message match for full PPF keywords
- less leakage into lower-ticket services

## Why The Price Anchor Is Visible

The page shows:

> Full PPF from AED 7,990 + VAT

It also clarifies:

> Most SUV and premium packages calculate between AED 8,990 and AED 14,500 + VAT.

This is intentional.

The AED 7,990 entry point keeps the ad/page commercially attractive, while the SUV/premium range reduces shock when a serious buyer sees AED 12,500 or AED 14,500 in the calculator.

Expected impact:

- filters AED 3k shoppers earlier
- reduces wasted WhatsApp conversations
- improves expectation-setting before sales follow-up
- should increase qualified-lead rate even if raw CPL rises slightly

## Why WhatsApp Is Primary

Dubai buyers are heavily WhatsApp-oriented. For PPC, forcing a full form before price would likely reduce conversion volume.

The page uses WhatsApp as the primary CTA:

- sticky mobile WhatsApp button
- price-result WhatsApp button
- final CTA WhatsApp button
- prefilled WhatsApp message with the selected setup and price

The WhatsApp message includes:

- selected vehicle size
- finish
- warranty package
- starting price
- request to confirm exact price and availability

Expected impact:

- lower friction than a traditional form
- better mobile conversion rate
- more useful WhatsApp conversations because the setup is prefilled
- faster sales response because the customer is not asking a vague "price?"

## Why There Is Still A Lead Form

The small form appears after price reveal, not before.

Fields:

- name
- WhatsApp number
- car model

This lets users save the quote and request availability without blocking the main calculator experience.

The form writes to the CRM through `captureLeadSnapshot()` with:

- funnel name
- Google attribution / UTM / gclid
- selected package
- finish
- vehicle size
- full PPF coverage
- estimate value

Expected impact:

- captures some users who are not ready to WhatsApp
- preserves attribution and CRM visibility
- adds a deeper conversion signal for Google Ads
- avoids killing calculator completion with an early gate

## Why Brand Is Not A Calculator Choice

The page does not let the user choose STEK, GYEON, Protect+, Diamond Pro, KKVinyl, 3M, Carbins, or Avery as calculator options.

That is deliberate.

If brand is shown as a decision step, the buyer can fall back into commodity thinking:

> Which film is cheapest?

Instead, the calculator sells:

> Grand Touch full PPF package.

The brand logos are shown later as proof that Grand Touch works with premium film options.

Expected impact:

- reduces analysis paralysis
- prevents film-brand shopping behavior
- keeps the first comparison on Grand Touch's install standard
- still supports trust by showing credible film options

## Why The Logo Strip Exists

The logo strip supports credibility without making the page feel defensive.

Positioning:

> Premium films available.

Supporting line:

> Final film recommendation is confirmed after we know the car, finish, and warranty target.

This shows capability and flexibility, while still making the install standard the main product.

Expected impact:

- increases trust for buyers who recognize film brands
- reduces concern that Grand Touch only has one option
- supports premium positioning without adding a decision step
- makes the page feel more established and less like a single-offer funnel

## Why Proof Sections Sit Below The Calculator

The calculator gives the buyer the number first. The proof sections answer the next mental objection:

> Why should I book this with Grand Touch?

The proof sections cover:

- Sean-led quote
- prep before film
- warranty proof
- real buyers and handovers
- film credibility

This order matters. For PPC price-intent traffic, proof should support the price after the buyer gets the number, not delay the number.

Expected impact:

- keeps first-screen friction low
- gives serious buyers reasons to continue
- supports retargeting and sales follow-up
- helps close quality-conscious buyers after initial price interest

## Expected PPC Behavior

Compared with `/ppf-dubai-quote`, this calculator should likely produce:

- higher WhatsApp click rate
- lower tracked WhatsApp CPL
- more price-qualified conversations
- less education before the CTA

The broader quote landing page may still produce stronger trust for colder or more premium-intent traffic.

Recommended traffic split:

- send price/cost/full PPF keywords to `/ppf-full-ppf-calculator`
- send broader trust/brand keywords to `/ppf-dubai-quote`

Example calculator keywords:

- `ppf price dubai`
- `ppf cost dubai`
- `full ppf price dubai`
- `full car ppf dubai`
- `paint protection film dubai price`

Example quote page keywords:

- `ppf dubai`
- `paint protection film dubai`
- `best ppf dubai`
- `stek ppf dubai`
- `luxury car ppf dubai`

## Metrics To Judge

Do not judge the page by raw CPL alone.

Judge by:

- cost per WhatsApp click
- cost per real full PPF conversation
- cost per quote sent
- cost per booking
- average quoted value
- close rate by page

Early target ranges:

| Metric | Healthy Range |
|---|---:|
| WhatsApp conversion rate | 12-25% |
| Tracked WhatsApp CPL | AED 80-250 |
| Qualified full PPF CPL | AED 250-700 |
| Booking CPA | AED 1,500-4,000 |

If WhatsApp clicks are cheap but chats are weak, the page is too easy.

If raw CPL is higher but the conversations are serious, the page may still be working.

## Summary

The calculator is built around one principle:

> Give Google searchers the price quickly, filter obvious low-budget shoppers, then move serious full PPF buyers into WhatsApp with a specific setup.

It avoids the main traps:

- no early lead form
- no front PPF distraction
- no brand selector
- no long education before price
- no generic WhatsApp message

It should improve PPC efficiency by increasing relevance, reducing friction, and improving the quality of the WhatsApp conversation that sales receives.
