# SEO Content Automation Plan

Last updated: `2026-05-14` (Asia/Dubai)

This document defines the daily SEO article automation for Grand Touch Auto.
The goal is to create one review-ready SEO article per day that supports:

- Google Search / PPC keyword coverage
- Meta and TikTok paid traffic credibility
- internal linking around PPF, paint protection, detailing, and Dubai car care
- image search visibility
- local service authority for Grand Touch Auto

The automation must stage work for human approval.
It must not commit, push, deploy, or publish without Sean approving the article.

## Why this exists

Paid ads are sending traffic to high-intent PPF pages.
SEO articles should support the same commercial topics so that:

- PPC landing pages gain topical support
- blog visitors can move into the PPF calculator or WhatsApp
- Google can better understand Grand Touch Auto as a Dubai PPF / car protection specialist
- Meta/TikTok visitors can be retargeted after reading helpful content

Google's official guidance emphasizes helpful, reliable, people-first content, descriptive URLs, useful links, relevant images, and structured data.
The current site already has article metadata and `BlogPosting` structured data through `ArticleLayout`.

## Current article system

Articles currently live mainly as React pages:

- `src/pages/articles/*.tsx`

Article list and route wiring lives in:

- `src/pages/Blog.tsx`
- `src/App.tsx`
- `src/components/ArticleLayout.tsx`

Images live in:

- `public/*.png`
- `src/assets/*`

Important implementation detail:

- Adding a new article is not just writing text.
- The article page, blog listing, app route, slug map, related articles, and image asset must all be updated.
- Article IDs currently run through `13`; new articles should continue with the next unused integer.

## Daily article targets

Prioritize topics that support current paid keyword targets first:

1. `ppf dubai`
2. `car ppf dubai`
3. `paint protection film dubai`
4. `car paint protection dubai`
5. `ppf price dubai`
6. `ppf cost dubai`
7. `ppf quote dubai`

Then expand into supporting clusters:

- new car PPF Dubai
- luxury car PPF Dubai
- SUV PPF Dubai
- Nissan Patrol PPF Dubai
- Jetour G700 PPF Dubai
- Lexus LX600 PPF Dubai
- Defender PPF Dubai
- Porsche PPF Dubai
- matte PPF Dubai
- gloss PPF Dubai
- STEK PPF Dubai
- PPF warranty Dubai
- PPF maintenance Dubai
- PPF vs ceramic Dubai
- paint protection for Dubai heat
- sand damage car paint Dubai
- Dubai car resale paint protection
- pickup and drop-off PPF Dubai

Do not over-focus on terms the business does not naturally use.
For example, use `full body PPF` only when the article genuinely needs coverage language.

## Article quality rules

Each article should be:

- written for Dubai car owners, not generic global SEO
- specific enough to be useful to a real owner deciding whether to message Sean
- commercially relevant, but not thin sales copy
- roughly `900-1,500` words unless the topic needs less
- structured with a single H1 through article title, then clear H2/H3 sections
- written in Grand Touch's voice: direct, practical, premium, no generic fluff
- honest about price, limitations, suitability, and tradeoffs
- clear about when WhatsApp or the calculator is the next step

Do not invent certifications, prices, warranty terms, addresses, or claims.
Use only facts already present in the repo, verified business context, or clearly phrased general guidance.

## Required article structure

Each new article should include:

- article object with:
  - unique `id`
  - `title`
  - `excerpt`
  - `content`
  - `author: "Sean, Grand Touch Auto"`
  - `publishedAt`
  - `readTime`
  - `category`
  - `image`
  - `featured: false`
  - `tags`
- at least three relevant `relatedArticles`
- route in `src/App.tsx`
- listing entry in `src/pages/Blog.tsx`
- slug mapping updates wherever needed
- internal links inside article content
- links to the PPF calculator and/or quote page where relevant

Preferred CTAs:

- `/ppf-cost-calculator`
- `/ppf-dubai-quote`
- WhatsApp CTA already handled by `ArticleLayout`

## Internal link rules

Every article must include at least:

- one link to `/ppf-cost-calculator`
- one link to `/ppf-dubai-quote` if the topic has quote intent
- two to four links to related blog articles
- one link from an existing related article back to the new article, where natural

Avoid creating the same exact anchor text everywhere.
Use natural anchors such as:

- `PPF cost calculator in Dubai`
- `get a PPF quote for your car`
- `PPF vs ceramic in Dubai`
- `gloss vs matte PPF`
- `how long PPF lasts in Dubai heat`

## Image rules

Each article needs one relevant featured image.

Preferred workflow:

1. Use an existing relevant Grand Touch / PPF image if it clearly fits.
2. If image generation is available, generate a clean branded automotive image:
   - Dubai premium car protection context
   - no fake logos on car badges
   - no misleading before/after claims
   - no unreadable text baked into the image
   - export into `public/` with a descriptive filename
3. If no image tool is available, reuse a relevant existing image and note that a custom image is still recommended.

Image filename should be descriptive, for example:

- `ppf-featured-new-car-paint-protection-dubai.png`
- `ppf-featured-nissan-patrol-ppf-dubai.png`

Image SEO requirements:

- descriptive filename
- article image path in `article.image`
- meaningful `alt` text is generated by `ArticleLayout`
- image should be contextually surrounded by relevant text
- image must be included in the article's `BlogPosting` structured data through `ArticleLayout`

## External links

Use external links sparingly.
Only add them when they support factual trust.

Good external source types:

- official Google Search Central docs for SEO/structured data topics
- official manufacturer pages when discussing a specific product or film
- neutral technical references if needed

Do not link to direct competitors for commercial PPF terms unless there is a strong reason.

## Validation checklist

Before staging the article, the automation should run:

```powershell
npm.cmd run build
```

If the build fails:

- fix the issue if it is caused by the article work
- do not stage broken files
- report the error clearly

If the build passes:

- stage only the article-related files
- do not commit
- report the staged files

## Review output required

At the end of each automation run, report:

- proposed article title
- target keyword cluster
- new URL path
- local preview URL, usually:
  - `http://localhost:8080/blog/<slug>`
- production URL after deploy:
  - `https://www.grandtouchauto.ae/blog/<slug>`
- files changed
- image used or generated
- internal links added
- whether build passed
- that files are staged and waiting for Sean's approval

The automation should explicitly say:

- "I did not commit or push this."

## Daily cadence

Run once daily.

Recommended time:

- `09:15` Asia/Dubai

This gives Sean time to review during the working day.

## Approval workflow

1. Automation creates and stages one article.
2. Sean reviews local preview.
3. Sean asks Codex to adjust, commit, push, or discard.
4. Only after explicit approval should the article be committed and pushed.
