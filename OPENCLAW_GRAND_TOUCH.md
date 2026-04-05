# Grand Touch Auto — OpenClaw Master Guide

**This file lives at:** `C:\Users\Marlon\.openclaw\workspace\skills\OPENCLAW_GRAND_TOUCH.md`
**Edited by Sean at:** `C:\Users\seane\Desktop\GTA Website\grand-touch-craft\OPENCLAW_GRAND_TOUCH.md`
**After editing here, copy to the skills path above so OpenClaw reads the latest version.**

**Stack:** Vite + React + React Router SPA (NOT Next.js)
**Live site:** `https://www.grandtouchauto.ae`
**Repo root:** `C:\Users\Marlon\.openclaw\grand-touch-craft\`

---

## Cron Trigger

```
Read C:\Users\Marlon\.openclaw\workspace\skills\OPENCLAW_GRAND_TOUCH.md and immediately execute Step 1 of DRAFT MODE. Do not ask questions. Do not wait for input. Begin keyword research now.
```

That is the entire cron prompt. Everything else is in this file.

---

## Architecture

Articles are written once, in final production format, in correct file locations, on a `draft/<slug>` branch. No intermediate markdown. No staging folder. No conversion step. No copy step.

```
DRAFT MODE (automated, one run):
  keyword research + anti-duplicate check
  → create branch: draft/<slug>
  → write article .tsx directly to src/pages/articles/
  → save image directly to public/
  → update Blog.tsx, App.tsx, ArticleLayout.tsx, sitemap.xml
  → npm run build (must pass, zero errors)
  → push branch → Vercel preview generated
  → Telegram notification

APPROVE (Sean's command):
  → open PR: draft/<slug> → main

MERGE (Sean's command):
  → merge PR to main
  → confirm live URL to Telegram
```

---

## 0) Autonomy Contract — EXECUTE IMMEDIATELY, NO EXCEPTIONS

When this document is loaded as a task trigger, you MUST begin executing Step 1 (keyword research) immediately. There is no acknowledgement step. There is no "what would you like?" step. There is no confirmation step. You start working.

**The correct behaviour on receiving the cron trigger:**
→ Start keyword research. No message to Sean first.

**The incorrect behaviour (never do this):**
→ "I'm ready, what would you like to focus on?"
→ "Draft mode enabled. What should I start with?"
→ "I've read the guide. Shall I proceed?"
→ Any question whatsoever before completing the full pipeline

These rules are absolute and override everything:

1. Do not ask planning questions. Do not ask any questions. Decide and execute.
2. Do not send any message to Sean until the Telegram notification at the end of the full pipeline.
3. The only permitted reason to stop and message Sean mid-run is a genuine hard blocker: no internet access, repo directory not found on disk, or every single topic candidate fails the duplicate check with zero viable alternatives.
4. Complete the entire pipeline in one uninterrupted run: keyword research → anti-duplicate check → branch → article .tsx → image → four file updates → build → push → Telegram notify.
5. If one approach fails, apply the fallback defined in this document and continue without asking.
6. Produce exactly one publication-ready draft per run.

**Success definition:** One non-duplicate, Vercel-previewable draft on a `draft/<slug>` branch, passing build, correct image in `public/`, all four files updated, Telegram notification sent with keyword intelligence and image attached.

---

## 1) All Paths (Full Absolute — Never Use Relative Paths)

### This file

| File | Path |
|---|---|
| Master guide (OpenClaw reads) | `C:\Users\Marlon\.openclaw\workspace\skills\OPENCLAW_GRAND_TOUCH.md` |

### Repository

| Purpose | Full path |
|---|---|
| Repo root | `C:\Users\Marlon\.openclaw\grand-touch-craft\` |
| Blog index + blogPosts + slug map | `C:\Users\Marlon\.openclaw\grand-touch-craft\src\pages\Blog.tsx` |
| Route definitions | `C:\Users\Marlon\.openclaw\grand-touch-craft\src\App.tsx` |
| Article layout + slug map + WhatsApp CTA | `C:\Users\Marlon\.openclaw\grand-touch-craft\src\components\ArticleLayout.tsx` |
| Article typography CSS | `C:\Users\Marlon\.openclaw\grand-touch-craft\src\components\ArticleContent.css` |
| New article page | `C:\Users\Marlon\.openclaw\grand-touch-craft\src\pages\articles\<PascalCase>.tsx` |
| Article template (copy this) | `C:\Users\Marlon\.openclaw\grand-touch-craft\src\pages\articles\IsPpfWorthItDubai.tsx` |
| Article template (copy this) | `C:\Users\Marlon\.openclaw\grand-touch-craft\src\pages\articles\PpfVsCeramicDubai.tsx` |
| Published images | `C:\Users\Marlon\.openclaw\grand-touch-craft\public\<filename>.png` |
| Sitemap | `C:\Users\Marlon\.openclaw\grand-touch-craft\public\sitemap.xml` |
| SEO utilities | `C:\Users\Marlon\.openclaw\grand-touch-craft\src\lib\seo.ts` |
| Build output (never edit) | `C:\Users\Marlon\.openclaw\grand-touch-craft\dist\` |

### Build command

```
cd C:\Users\Marlon\.openclaw\grand-touch-craft && npm run build
```

Must pass with zero errors before any push.

---

## 2) Operating Modes

### DRAFT MODE (Default)

**In DRAFT MODE you MUST:**

1. Run keyword research (Section 4) and select a low-competition target
2. Run anti-duplicate check (Section 3)
3. Create branch: `draft/<slug>` from current `main`
4. Generate featured image → save to `public/` (Section 8)
5. Write article `.tsx` at its final path (Section 7)
6. Update all four supporting files (Section 9)
7. Run `npm run build` — must pass zero errors (Section 10)
8. Push `draft/<slug>` to GitHub
9. Send Telegram notification (Section 11)

**In DRAFT MODE you MUST NOT:**

- Write intermediate markdown drafts
- Merge to `main`
- Open a PR (that happens on `APPROVE`)
- Ask questions

After notification: stop and wait for `APPROVE` or `MERGE`.

---

### PUBLISH MODE — triggered by `APPROVE` or `APPROVED: <slug>`

- If slug given: use that `draft/<slug>` branch
- If no slug: use the most recently pushed `draft/*` branch — do not ask which one

**You MUST create the PR using the PowerShell GitHub API method below. Do NOT open a browser URL. Do NOT send Sean a link to fill in manually. Do NOT require gh CLI.**

Run this PowerShell script from `C:\Users\Marlon\.openclaw\grand-touch-craft`:

```powershell
$token = $env:GITHUB_TOKEN  # Must be set in OpenClaw environment
$repo  = "easycarparts/grand-touch-craft"
$slug  = "<slug>"
$title = "Article: <article title>"
$body  = @"
## Summary
- Keyword: <primary keyword>
- KD: <score>/100 — LOW / MEDIUM / HIGH
- Intent: <Informational / Commercial / Transactional>
- Vercel preview: <preview URL>

## Files changed
- src/pages/articles/<PascalCase>.tsx
- public/ppf-featured-$slug-option-1.png
- src/pages/Blog.tsx
- src/App.tsx
- src/components/ArticleLayout.tsx
- public/sitemap.xml

## Checklist
- [x] Article .tsx at correct path
- [x] Image in public/ — real binary >200KB
- [x] Blog.tsx updated
- [x] App.tsx updated
- [x] ArticleLayout.tsx updated
- [x] sitemap.xml updated
- [x] npm run build passes
"@

$payload = @{ title=$title; body=$body; head="draft/$slug"; base="main" } | ConvertTo-Json
$response = Invoke-RestMethod `
  -Uri "https://api.github.com/repos/$repo/pulls" `
  -Method POST `
  -Headers @{ Authorization="Bearer $token"; "Content-Type"="application/json"; "User-Agent"="OpenClaw" } `
  -Body $payload

Write-Host "PR created: $($response.html_url)"
Write-Host "PR number: $($response.number)"
```

Save the PR number from the output — needed for MERGE.

Send to Telegram:

```
PR OPEN ✓
Article: <article title>
PR: <response.html_url>
Preview: <Vercel preview URL>

Reply MERGE when ready to go live.
```

Do not merge. Do not ask questions. Wait for `MERGE`.

**If `$env:GITHUB_TOKEN` is not set:** retrieve the token from OpenClaw credentials/environment config and set it before running. The token needs `repo` scope on the `easycarparts` GitHub account.

---

### MERGE — triggered by `MERGE`

- If no slug given: use the most recently created PR. Do not ask which one.

```powershell
$token  = $env:GITHUB_TOKEN
$repo   = "easycarparts/grand-touch-craft"
$prNum  = <PR number from APPROVE step>

$response = Invoke-RestMethod `
  -Uri "https://api.github.com/repos/$repo/pulls/$prNum/merge" `
  -Method PUT `
  -Headers @{ Authorization="Bearer $token"; "Content-Type"="application/json"; "User-Agent"="OpenClaw" } `
  -Body (@{ merge_method="merge" } | ConvertTo-Json)

Write-Host "Merged: $($response.merged) — $($response.message)"

# Delete the branch after merge
Invoke-RestMethod `
  -Uri "https://api.github.com/repos/$repo/git/refs/heads/draft/$slug" `
  -Method DELETE `
  -Headers @{ Authorization="Bearer $token"; "User-Agent"="OpenClaw" }
```

Wait 30–60 seconds for Vercel production deploy. Then post to Telegram:

```
MERGED ✓
Live: https://www.grandtouchauto.ae/blog/<slug>
```

---

## 3) Anti-Duplicate Topic Check (Mandatory)

Run before choosing any topic:

1. Read `C:\Users\Marlon\.openclaw\grand-touch-craft\src\pages\Blog.tsx` — extract all titles and slugs from `blogPosts` and `getArticleSlug`
2. List all files in `C:\Users\Marlon\.openclaw\grand-touch-craft\src\pages\articles\` — note subjects
3. List all existing `draft/*` branches on the remote
4. Build used-topic inventory: title intent, primary keyword, slug
5. Reject any candidate substantially similar in intent to an existing entry
6. If duplicates found: auto-select a different angle and continue — do not ask

**Published topics as of April 2026 — update this list after each new article:**

| Slug | Topic |
|---|---|
| `ceramic-coating-guide` | Ceramic coating general guide |
| `ppf-vs-ceramic-coating` | PPF vs ceramic general comparison |
| `paint-correction-techniques` | Paint correction for luxury vehicles |
| `custom-vinyl-wraps` | Vinyl wrap appearance |
| `performance-tuning` | ECU / performance |
| `classic-car-restoration` | Restoration |
| `is-ppf-worth-it-dubai` | PPF ROI for Dubai owners |
| `ppf-vs-ceramic-dubai` | PPF vs ceramic Dubai specific |
| `ppf-dubai-full-front-vs-full-body` | Full front vs full body PPF coverage |

**Unused angles (good candidates for next articles):**

- PPF by ownership timeline (lease vs keep 5+ years)
- PPF edge lift and installer quality in Dubai heat
- When PPF is NOT the right choice (honest money-saving angle)
- Paint correction before PPF — when is it mandatory?
- PPF for SUVs vs sedans in Dubai
- How Dubai summer heat affects PPF longevity
- STEK vs GYEON for Dubai conditions
- PPF warranty claims in Dubai — what actually gets covered

---

## 4) Keyword Research (Mandatory — Run Before Writing)

The keyword drives the title, slug, H1, and article structure. Do not skip.

### Target profile

| Metric | Target |
|---|---|
| Keyword Difficulty (KD) | 0–25 preferred, max 35 if content gap is strong |
| Monthly search volume | 100–1,500 |
| Search intent | Commercial investigation or Transactional preferred |
| Format | Long-tail, 4–7 words |
| Location | Dubai modifier present or clearly implied |

Avoid: high-competition head terms ("PPF Dubai" alone), zero-intent keywords, anything already covered.

### Research process

1. Generate 5–10 candidates using:
   - Google autocomplete
   - People Also Ask + Related Searches on SERP
   - AnswerThePublic / AlsoAsked for question-format variants
   - Google Keyword Planner for volume
   - Ubersuggest (free tier) for KD scores
   - H2 headings from top 3–5 ranking pages

2. Score each candidate against the target profile above

3. Select the highest-opportunity keyword: lowest KD relative to buyer intent quality

4. Record the runner-up keyword in the Telegram notification for the next article

### Dubai location advantage

Dubai-specific long-tail keywords have far less competition than UK/US equivalents. Location modifiers to use:

- "PPF cost Dubai"
- "best PPF installer Dubai"
- "PPF for summer heat Dubai"
- "paint protection film price Dubai"
- "how long does PPF last in Dubai heat"
- "STEK PPF Dubai"

### Intent classification

| Intent | Example | Priority |
|---|---|---|
| Transactional | "PPF installer Dubai price" | High |
| Commercial investigation | "PPF vs ceramic Dubai which is better" | High |
| Informational | "how does PPF protect against sand" | Medium — only if KD is very low |

### Content gap check

Check top 3 ranking pages before confirming:

- Generic international content with no Dubai context → **strong opportunity**
- Local Dubai competitors → usually thin — check and confirm
- Strong comprehensive pages from major brands → pick a different keyword

If top 3 are strong and comprehensive: move to next candidate. Do not stall.

---

## 5) On-Page SEO Requirements

### Title (H1)
- Primary keyword in first 60 characters
- Compelling and click-worthy — not just keyword-stuffed
- Format: question / vs comparison / "why" angle / practical guide

### Meta description
- 145–160 characters
- Primary keyword used naturally
- Unique hook or decision prompt
- Does not repeat the title word for word

### Heading structure
- H2s must include keyword variants and semantic phrases
- At least one H2 as a buyer decision question (supports featured snippet)
- H3 for supporting points only — no stuffing
- Maximum two levels of nesting unless content genuinely needs it

### Keyword usage
- Primary keyword: 3–5 natural appearances per 1,000–1,500 words
- Semantic variants: "paint protection film" + "PPF" + "clear film" + "self-healing coating"
- Dubai LSI terms: heat, humidity, sand, resale value, showroom, detailing centre

### Content length
- Minimum 900 words for informational
- Minimum 1,100 words for comparison and commercial investigation
- No padding — every paragraph must earn its place

### Internal linking
- At least one natural link to `/ppf-dubai` embedded in body text
- Link to one related existing article if relevant
- Never drop links in a list at the bottom — embed in context only

### External linking
- One or two credible outbound links acceptable (manufacturer, industry body)
- Never link to direct competitors
- Never fabricate sources

---

## 6) Content Quality Standards

Every article must be:

- Original and non-derivative
- More useful than the top 3 ranking pages
- Dubai-specific and practical
- Honest about trade-offs — when to buy AND when not to buy

Mandatory structure:

1. Opening hook — challenges an assumption or exposes a buyer mistake
2. Buyer-focused sections that match keyword intent
3. Subtle authority signals from real installation experience (no fabricated claims)
4. At least one natural internal link
5. Strong closing CTA for WhatsApp or booking (prose only — `ArticleLayout.tsx` adds the WhatsApp button automatically, do not add a second widget)

Tone: expert advisor, premium, honest, direct, no filler

Allowed brand references: STEK, GYEON, XPEL (comparison only)

**Mandatory self-check before committing:**

- [ ] Better than what currently ranks for this keyword?
- [ ] Would a Dubai car buyer trust this over the top 3?
- [ ] Is every section necessary? (Cut anything that isn't.)
- [ ] Does the opening hook create genuine tension or curiosity?
- [ ] Balanced guidance — when to buy AND when not to?

If any answer is NO: rewrite that section before committing.

---

## 7) Article File Format (.tsx)

Every article is a TypeScript React component using `ArticleLayout`.

**Template to copy:**
`C:\Users\Marlon\.openclaw\grand-touch-craft\src\pages\articles\IsPpfWorthItDubai.tsx`

**New file path:**
`C:\Users\Marlon\.openclaw\grand-touch-craft\src\pages\articles\<PascalCase>.tsx`

Slug → PascalCase: `ppf-summer-heat-dubai` → `PpfSummerHeatDubai`

### Article object fields

| Field | Value |
|---|---|
| `id` | Next integer after highest existing id in `blogPosts` |
| `title` | Final H1 — primary keyword in first 60 characters |
| `slug` | URL-safe — must match branch name, route, both slug maps, image filename |
| `excerpt` | 1–2 unique sentences — feeds meta description |
| `content` | Full article body — see content syntax below |
| `author` | `"Sean, Grand Touch Auto"` — always exactly this string |
| `publishedAt` | `"YYYY-MM-DD"` — today's date |
| `readTime` | e.g. `"7 min read"` |
| `category` | `"Protection"` / `"Detailing"` / `"Customization"` / `"Performance"` / `"Restoration"` |
| `image` | `"/ppf-featured-<slug>-option-1.png"` — leading slash, no `public/` prefix |
| `featured` | `false` unless Sean instructs otherwise |
| `tags` | Array of SEO keyword strings — primary keyword + semantic variants |

### Content string syntax

The `content` field is a custom-parsed string inside `ArticleLayout`. It is NOT standard Markdown.

| Element | Syntax |
|---|---|
| Paragraph break | Blank line `\n\n` between blocks |
| H2 (feeds table of contents) | Line starts with `## ` |
| H3 | Line starts with `### ` |
| H4 | Line starts with `#### ` |
| Bold | `**text**` |
| Italic | `*text*` |
| Link | `[anchor text](url)` |
| Bullet list | Lines starting with `- ` or `* ` |
| Numbered list | Lines starting with `1. `, `2. `, etc. |
| Raw HTML | Never — will not render correctly |

### Related articles

Include 3 `relatedArticles` entries using existing published slugs only. Image paths must exist under `C:\Users\Marlon\.openclaw\grand-touch-craft\public\`.

---

## 8) Image Generation

Generate exactly one featured image per article. Save it directly to its permanent location.

### Model

- Primary: `openai/gpt-image-1.5` (4x faster, 20% cheaper, superior photorealism vs gpt-image-1)
- Fallback: `openai/gpt-image-1` only if 1.5 is unavailable

**Why not Grok Aurora:** No public API. Requires X Premium+/SuperGrok subscription. Cannot be called programmatically. Not suitable for automated workflows.

### Size

- Primary: `1536x1024`
- Fallback: `1024x1024` if primary fails
- No other sizes

### Save path (permanent — no staging, no copy step later)

```
C:\Users\Marlon\.openclaw\grand-touch-craft\public\ppf-featured-<slug>-option-1.png
```

### React reference string

```
/ppf-featured-<slug>-option-1.png
```

Leading slash. No `public/` prefix. No hash. Must be identical in `Blog.tsx`, `App.tsx`, and the article `.tsx`.

### MANDATORY: Verify the file exists on disk before writing any code

After saving the image, run this check immediately:

```powershell
$img = "C:\Users\Marlon\.openclaw\grand-touch-craft\public\ppf-featured-<slug>-option-1.png"
if (-not (Test-Path $img)) { throw "IMAGE FILE MISSING — do not proceed" }
$size = (Get-Item $img).Length
if ($size -lt 204800) { throw "IMAGE TOO SMALL ($size bytes) — likely a stub, not a real binary. Do not proceed." }
Write-Host "Image verified: $size bytes OK"
```

**If this check fails: regenerate and re-save the image. Do not proceed to write article code until this passes.**

Sending the image to Telegram does NOT count as saving it to disk. Both must happen:
1. Save binary to `public\ppf-featured-<slug>-option-1.png` ← must happen first
2. Verify file exists and is > 200 KB ← must pass before any code is written
3. Send to Telegram for Sean's review ← happens at the end with the full notification

### Dubai ultra-realistic automotive prompt template

Structure: `[SCENE] + [SUBJECT] + [DETAILS] + [LIGHTING] + [LENS/CAMERA] + [HARD CONSTRAINTS]`

#### Car model selection (critical — always pick from this list)

Use a real, recognisable luxury car model. Dubai buyers own and recognise these. A real silhouette builds instant trust. A fictional car kills it.

Pick the most relevant model for the article topic:

| Car | When to use |
|---|---|
| Range Rover (full-size) | SUV/value articles, most versatile default |
| Mercedes G-Class | Premium positioning, heat/durability articles |
| Porsche Cayenne | Comparison articles, mid-tier buyer angle |
| Lamborghini Urus | High-end investment/full-body coverage articles |
| Mercedes S-Class (sedan) | Ceramic/paint correction articles |
| Toyota Land Cruiser 300 | Dubai-specific articles, broad market appeal |
| Ferrari SF90 or 488 | STEK/top-tier PPF articles |

Render the car's real body shape and proportions accurately. Do NOT invent a fictional vehicle. Do NOT blend features from multiple cars. The badge and logo area should be present but unreadable/blurred — do not remove the grille shape or other identifying design elements.

#### Default prompt

```
Ultra-photorealistic commercial automotive photography, photo quality indistinguishable from a real camera.
Scene: modern luxury car detailing studio in Dubai, polished dark concrete floor,
clean minimalist environment, large floor-to-ceiling windows showing blurred Dubai skyline at dusk,
subtle warm ambient glow from the city lights outside.
Subject: front three-quarter view of a [PICK FROM LIST ABOVE — e.g. Range Rover full-size SUV],
accurate real-world proportions and body design, deep mirror-gloss paint finish consistent
with a freshly applied paint protection film, subtle reflections of studio lights on paint surface.
Details: fine paint texture and PPF surface depth visible at near-surface level, zero imperfections,
studio environment spotless, floor reflection of car visible.
Lighting: high-key soft diffused overhead studio lights, one warm fill light from left,
gentle rim light from rear right, no hard shadows, professional commercial automotive photography grade.
Camera: 50mm prime lens equivalent, f/2.8 shallow depth of field, eye-level angle,
slight warm colour grading, hero automotive campaign quality.
Hard constraints: no readable text anywhere, logo badge area present but unreadable/out of focus,
no license plates, no identifiable people, no fictional car shapes.
Empty lower-third space suitable for potential headline overlay — no text embedded in the image.
```

#### Topic-specific scene adjustments

| Article topic | Scene + car adjustment |
|---|---|
| PPF vs Ceramic | Split composition: Range Rover — one half deep PPF gloss, other half matte ceramic finish. Same car, sharp dividing line down the centre |
| Full Body PPF | Lamborghini Urus or G-Class, installer hands (no face) pressing film onto door panel, bright clean installation bay |
| PPF Durability / Heat | Land Cruiser or G-Class outdoors, golden hour, Burj Khalifa visible in background haze, car gleaming under direct Dubai sun |
| PPF Cost / Value | Range Rover in wide premium studio shot, aspirational atmosphere, single car as hero |
| Installer Quality | Porsche Cayenne, close-up macro of PPF edge on a curved door panel, perfect fit, no lifting, studio light raking across surface |
| STEK vs GYEON | Two sections of Mercedes S-Class bonnet side by side, different film surface textures clearly visible |
| Heat / Summer | Land Cruiser or G-Class, outdoor rooftop setting, Dubai skyline and heat haze, golden hour |

### Image integrity check before commit (mandatory — run this command)

```powershell
$img = "C:\Users\Marlon\.openclaw\grand-touch-craft\public\ppf-featured-<slug>-option-1.png"
if (-not (Test-Path $img)) { throw "BLOCKED: image file not found in public/ — do not proceed" }
$size = (Get-Item $img).Length
if ($size -lt 204800) { throw "BLOCKED: file is $size bytes — not a real image binary — do not proceed" }
Write-Host "PASS: image verified at $size bytes"
```

- [ ] Above command runs and prints PASS — not throws
- [ ] Filename is exactly `ppf-featured-<slug>-option-1.png`
- [ ] Same path string used in article `.tsx` and `Blog.tsx`

**Do not run `git add` until this passes. Sending the image to Telegram is NOT the same as saving it to disk. Both must happen independently.**

---

## 9) Four Files to Update Per Article

After writing the article `.tsx` and saving the image, update these files in order:

### 9a) Blog.tsx
`C:\Users\Marlon\.openclaw\grand-touch-craft\src\pages\Blog.tsx`

**Add to `getArticleSlug` slug map:**
```typescript
<id>: "<slug>",
```

Fallback must use template literal: `` `article-${id}` `` (backticks, NOT single quotes)

**Append to `blogPosts` array (never remove existing entries):**
```typescript
{
  id: <id>,
  title: "<Title>",
  excerpt: "<unique 1-2 sentence excerpt>",
  content: "<one-sentence summary for card>",
  author: "Sean, Grand Touch Auto",
  publishedAt: "YYYY-MM-DD",
  readTime: "<N> min read",
  category: "<Category>",
  image: "/ppf-featured-<slug>-option-1.png",
  featured: false,
},
```

### 9b) App.tsx
`C:\Users\Marlon\.openclaw\grand-touch-craft\src\App.tsx`

Add import at top:
```typescript
import <PascalCase> from "./pages/articles/<PascalCase>";
```

Add route **above** the `path="*"` catch-all:
```typescript
<Route path="/blog/<slug>" element={<<PascalCase> />} />
```

### 9c) ArticleLayout.tsx
`C:\Users\Marlon\.openclaw\grand-touch-craft\src\components\ArticleLayout.tsx`

Add to inner slug map:
```typescript
<id>: "<slug>",
```

### 9d) sitemap.xml
`C:\Users\Marlon\.openclaw\grand-touch-craft\public\sitemap.xml`

```xml
<url>
  <loc>https://www.grandtouchauto.ae/blog/<slug></loc>
  <lastmod>YYYY-MM-DD</lastmod>
  <image:image>
    <image:loc>https://www.grandtouchauto.ae/ppf-featured-<slug>-option-1.png</image:loc>
  </image:image>
</url>
```

---

## 10) Build Verification

Run these two steps in order. Both must pass before pushing.

### Step 1 — Image file gate (run before npm build)

```powershell
$slug = "<slug>"
$img = "C:\Users\Marlon\.openclaw\grand-touch-craft\public\ppf-featured-$slug-option-1.png"
if (-not (Test-Path $img)) { throw "BLOCKED: $img not found — image was not saved to public/" }
$size = (Get-Item $img).Length
if ($size -lt 204800) { throw "BLOCKED: image is $size bytes — not a valid binary" }
Write-Host "Image gate PASSED: $size bytes"
```

If this throws: the image was generated but not saved to disk. Save it now, re-run this check, then continue.

### Step 1b — Stage the image with force flag (mandatory)

A global gitignore on this machine may block `git add` for PNG files in `public/`. Always use `-f` when staging images:

```bash
git add -f public/ppf-featured-<slug>-option-1.png
```

Then confirm it is staged:

```bash
git status
```

Output must show the file under "Changes to be committed" — not under "Untracked files" and not missing. If it still shows as untracked after `-f`: check the file path is exactly correct and re-run.

### Step 2 — Build

```bash
cd C:\Users\Marlon\.openclaw\grand-touch-craft
npm run build
```

Must pass with zero errors. If it fails: fix the error, do not push.

Common failure causes:

| Cause | Fix |
|---|---|
| Image gate throws | Image was never saved to `public/` — save it and re-run gate |
| Missing import in `App.tsx` | Add import for the new article component |
| TypeScript error in article `.tsx` | Check field types match the template |
| Image path mismatch | Filename in code must match actual file in `public/` |
| Slug typo between files | `App.tsx` route, `Blog.tsx` slugMap, `ArticleLayout.tsx` slugMap must all match exactly |

---

## 11) Telegram Notification Format

Send after successful build and push. Use this exact structure:

```
DRAFT READY ✓
Branch: draft/<slug>
Preview: <Vercel preview URL>

━━━━ KEYWORD INTELLIGENCE ━━━━
Niche: <topic area e.g. PPF longevity in Dubai heat>
Keyword: "<primary keyword>"
Est. monthly searches: ~<volume>
Keyword difficulty: <score>/100 — LOW / MEDIUM / HIGH
Search intent: Informational / Commercial / Transactional

Why I chose this:
• <reason 1 — e.g. KD 14, no strong local Dubai competitors>
• <reason 2 — e.g. top 3 are generic UK/US with no Dubai context>
• <reason 3 — e.g. commercial intent, searchers comparing before buying>
• Runner-up saved for next article: "<runner-up keyword>"

━━━━ TRAFFIC & REVENUE CASE ━━━━
• <why it should rank — content gap, local advantage, intent match>
• <why it should convert to PPF leads — buyer stage, CTA alignment>
• <what makes it better than current competition>

━━━━ ARTICLE ━━━━
• Angle: <one line>
• Key buyer question answered: <one line>
• Trust signal used: <one line>

Reply APPROVE to open PR → main.
```

Then send the generated image as a separate message for visual review.

Never paste the full article. Never open a PR before `APPROVE`. Never ask questions.

---

## 12) Blog.tsx Integrity Rules (Never Violate)

`C:\Users\Marlon\.openclaw\grand-touch-craft\src\pages\Blog.tsx` must always contain:

1. Hero section with heading and description
2. Featured Article section — renders posts where `featured: true`
3. Category strip — filter buttons
4. Latest Articles grid — non-featured posts sorted newest-first
5. `<Footer />` component
6. `<WhatsAppButton />` component
7. `useEffect` calling `updatePageSEO('blog')` and injecting `generateBlogStructuredData` JSON-LD

Never simplify to a plain card list. If any of the above is missing: restore it before pushing.

---

## 13) Common Errors (Know These Before You Write)

| Error | What breaks | Fix |
|---|---|---|
| Hashed asset URL `/assets/file-HASH.jpg` | Breaks after every rebuild | Use `/ppf-featured-<slug>-option-1.png` from `public/` |
| Stub PNG (text file renamed `.png`) | Broken image everywhere | Save real binary; verify > 200 KB |
| `Blog.tsx` gutted to plain list | Lost hero, JSON-LD, SEO, categories | Restore full structure |
| Missing `App.tsx` route | "Read More" → 404 | Add `<Route>` above catch-all |
| Slug mismatch between files | Wrong links, 404s, broken related posts | All three slug maps must use identical string |
| Push to `main` directly | Bypasses Sean's review | Always `draft/<slug>` → PR |
| Duplicate WhatsApp widget in content | Double CTA, looks broken | `ArticleLayout.tsx` adds it — do not add in content string |
