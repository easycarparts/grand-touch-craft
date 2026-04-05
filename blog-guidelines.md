# Blog Article Guidelines for Grand Touch Auto (OpenClaw)

**This file lives at:** `C:\Users\Marlon\.openclaw\workspace\skills\blog-guidelines.md`
**Edited by Sean at:** `C:\Users\seane\Desktop\GTA Website\grand-touch-craft\blog-guidelines.md`
**After editing, copy to the skills path above so OpenClaw reads the latest version.**

This is the operational contract for SEO content generation. It eliminates question loops, duplicate topics, incomplete outputs, and wasted markdown-to-TSX conversion steps.

---

## Architecture: Why We Write Directly to Final Format

The old approach wrote articles as `.md` drafts first, then converted them to `.tsx` on approval. This was wasteful:

- Two format conversions (research → markdown → TSX)
- Two image moves (pending-images → public/)
- Four file updates happening twice (Blog.tsx, App.tsx, ArticleLayout.tsx, sitemap)
- Higher chance of errors between draft and final

**The correct approach (used now):**

OpenClaw writes every article in its final production format on a `draft/<slug>` branch from the start. The image goes directly into `public/`. All supporting files are updated on that branch. A build is run to verify everything works. Sean reviews via the real Vercel preview URL. `APPROVE` opens the formal PR. `MERGE` merges it to main.

There is no intermediate markdown draft. There is no copy step. There is no conversion step.

---

## 0) Autonomy Contract (No-Stall Rules)

These rules are mandatory:

1. Do not ask planning questions. Decide and execute.
2. Ask a question only for a genuine hard blocker: no internet access, repo not found, or all topic candidates fail the duplicate check with no viable alternative.
3. Never stop mid-task. Complete the full pipeline — keyword research, topic selection, writing, image generation, all file updates, build verification, branch push, and Telegram notification — in one uninterrupted run.
4. If one approach fails, use the fallback defined in this document and continue.
5. Produce exactly one publication-ready draft per run unless explicitly asked for multiple.

**Success definition:** One complete, non-duplicate, Vercel-previewable draft on a `draft/<slug>` branch, with a passing build, correct image in `public/`, all four files updated, and Telegram notification sent.

---

## 1) Canonical Paths (Full Absolute)

These are the only paths used. Never use relative paths.

### OpenClaw Skills (where this file lives)

| File | Full path |
|---|---|
| These guidelines | `C:\Users\Marlon\.openclaw\workspace\skills\blog-guidelines.md` |
| Publishing playbook | `C:\Users\Marlon\.openclaw\workspace\skills\OPENCLAW_PUBLISHING_PLAYBOOK.md` |

### Repository Root

`C:\Users\Marlon\.openclaw\grand-touch-craft\`

### Key Repo Files

| Purpose | Full path |
|---|---|
| Blog index page | `C:\Users\Marlon\.openclaw\grand-touch-craft\src\pages\Blog.tsx` |
| Route definitions | `C:\Users\Marlon\.openclaw\grand-touch-craft\src\App.tsx` |
| Article layout + slug maps | `C:\Users\Marlon\.openclaw\grand-touch-craft\src\components\ArticleLayout.tsx` |
| Article page files | `C:\Users\Marlon\.openclaw\grand-touch-craft\src\pages\articles\<PascalCase>.tsx` |
| Static image files | `C:\Users\Marlon\.openclaw\grand-touch-craft\public\<filename>.png` |
| Sitemap | `C:\Users\Marlon\.openclaw\grand-touch-craft\public\sitemap.xml` |
| Package.json (build root) | `C:\Users\Marlon\.openclaw\grand-touch-craft\package.json` |

### Build Command

```
cd C:\Users\Marlon\.openclaw\grand-touch-craft && npm run build
```

Must pass with zero errors before pushing any branch.

---

## 2) Operating Modes

### DRAFT MODE (Default — replaces old WRITE MODE)

**What it is:** OpenClaw writes the complete, production-ready article on a `draft/<slug>` branch. All files are written in their final format, in their final locations. A Vercel preview is the review mechanism — not a markdown file.

**In DRAFT MODE you MUST:**

1. Run keyword research and select a low-competition target keyword
2. Check for duplicate topics against the existing codebase
3. Create branch: `draft/<slug>` from current `main`
4. Write the article as a `.tsx` file at its final path
5. Generate the featured image and save it directly to `public/`
6. Update `Blog.tsx`, `App.tsx`, `ArticleLayout.tsx`, and `sitemap.xml`
7. Run `npm run build` — must pass with zero errors
8. Push `draft/<slug>` branch to GitHub
9. Send Telegram notification in the format defined in Section 9

**In DRAFT MODE you MUST NOT:**

- Write intermediate markdown article drafts
- Merge to `main`
- Open a PR yet (that happens on `APPROVE`)
- Ask questions

After notification: stop and wait for `APPROVE` or `MERGE` command.

### PUBLISH MODE (Triggered by `APPROVE`)

**Triggered by:** `APPROVE` or `APPROVED: <slug>`

On `APPROVE`:

- If a slug is given: use that draft branch.
- If no slug: use the most recently pushed `draft/*` branch. Do not ask which one.

**In PUBLISH MODE you MUST:**

1. Open a Pull Request from `draft/<slug>` to `main`, titled: `Article: <article title>`
2. Post the PR URL and Vercel preview URL to Telegram

**In PUBLISH MODE you MUST NOT:**

- Merge to `main`
- Make further edits unless instructed

### MERGE (Triggered by `MERGE`)

**Triggered by:** `MERGE`

1. Merge the open PR to `main`
2. Wait for Vercel production deployment to complete
3. Post live article URL to Telegram: `Live: https://www.grandtouchauto.ae/blog/<slug>`

---

## 3) Anti-Duplicate Topic Check (Mandatory — Run Before Choosing Topic)

Before selecting a topic:

1. Read `C:\Users\Marlon\.openclaw\grand-touch-craft\src\pages\Blog.tsx` — extract all titles and slugs from `blogPosts` and `getArticleSlug`.
2. List all files in `C:\Users\Marlon\.openclaw\grand-touch-craft\src\pages\articles\` — extract article subjects.
3. List all existing `draft/*` and `article/*` branches on the remote.
4. Build a used-topic inventory: title intent, primary keyword, slug.
5. Reject any candidate that is substantially similar in intent to any existing entry.
6. Select a topic with a distinct angle, buyer stage, or decision lens.

If duplicate candidates are found: auto-select a different angle and continue. Do not ask.

**Current published topics as of April 2026 (update this list after each new article):**

- `ceramic-coating-guide` — ceramic coating general guide
- `ppf-vs-ceramic-coating` — PPF vs ceramic general comparison
- `paint-correction-techniques` — paint correction for luxury vehicles
- `custom-vinyl-wraps` — vinyl wrap appearance
- `performance-tuning` — ECU/performance
- `classic-car-restoration` — restoration
- `is-ppf-worth-it-dubai` — PPF ROI for Dubai owners
- `ppf-vs-ceramic-dubai` — PPF vs ceramic Dubai specific
- `ppf-dubai-full-front-vs-full-body` — full front vs full body coverage

Good differentiation angles not yet covered:

- PPF by ownership timeline (lease vs keep 5+ years)
- PPF edge lift and installer quality signals in Dubai heat
- When PPF is NOT the right choice (honest money-saving angle)
- Paint correction before PPF — when is it mandatory?
- PPF for SUVs in Dubai vs sedans
- How Dubai's summer heat affects PPF longevity
- STEK vs GYEON PPF for Dubai conditions (honest comparison)
- PPF warranty claims in Dubai — what actually gets covered

---

## 4) Keyword Research Protocol (Mandatory — Run Before Writing)

The keyword chosen determines the title, URL slug, H1, and article structure. Do not skip this.

### 4a) Research Goal

Target keywords that are:

- Dubai-relevant with buyer intent
- Low to moderate difficulty: KD score **0–25 preferred**, max 35 if content gap is strong
- Monthly search volume: **100–1,500** (sweet spot for fast ranking with low domain authority)
- Long-tail format: **4–7 words**
- Commercial investigation or transactional search intent

Avoid:

- High-competition head terms (e.g. "PPF Dubai" alone — dominated by established brands)
- Keywords with zero clear buyer intent
- Keywords already covered by existing articles

### 4b) Research Process

1. Generate 5–10 candidate keywords using:
   - Google autocomplete on relevant topic roots
   - "People also ask" and "Related searches" on the SERP
   - AnswerThePublic or AlsoAsked for question-format intent
   - Google Keyword Planner for volume estimates
   - Ubersuggest (free tier) for KD scores
   - H2 headings of the top 3–5 ranking pages for each candidate

2. Score each candidate:

   | Metric | Target |
   |---|---|
   | Keyword Difficulty (KD) | 0–25 preferred, max 35 |
   | Estimated Monthly Searches | 100–1,500 |
   | Search Intent | Commercial investigation or Transactional |
   | Dubai Specificity | Location modifier present or clearly implied |
   | Content Gap | Top 3 pages are generic, international, or thin |

3. Select the highest-opportunity keyword: lowest difficulty relative to buyer intent quality, not just lowest volume.

4. Note the runner-up keyword in the article metadata for the next article.

### 4c) Dubai Location Advantage

Dubai-specific long-tail keywords have significantly less competition than UK/US equivalents with the same buyer intent. Use location modifiers:

- "PPF cost Dubai"
- "best PPF installer Dubai"
- "PPF for summer heat Dubai"
- "paint protection film price Dubai"
- "how long does PPF last in Dubai heat"
- "STEK PPF Dubai"

### 4d) Intent Classification

| Intent type | Example | Priority |
|---|---|---|
| Transactional | "PPF installer Dubai price" | High |
| Commercial investigation | "PPF vs ceramic Dubai which is better" | High |
| Informational | "how does PPF protect against sand" | Medium (use for low-KD opportunities) |

### 4e) Content Gap Check

Before confirming, check the top 3 ranking pages:

- Generic international content with no Dubai context → **strong opportunity**
- Local Dubai competitor pages → check quality (usually thin)
- Strong comprehensive pages from major brands → pick a different keyword

If top 3 are strong and comprehensive: choose a different keyword. Do not stall — move to the next candidate.

---

## 5) On-Page SEO Requirements (Every Article)

### Title (H1)

- Primary keyword must appear in the first 60 characters
- Must be compelling and click-worthy
- Format: Question / vs comparison / "why" angle / practical guide

### Meta Description

- 145–160 characters
- Include primary keyword naturally
- Include a unique hook or decision prompt
- Do not repeat the title word for word

### Heading Structure

- H2 headings must include keyword variants and semantic phrases
- At least one H2 should pose a buyer decision question (supports featured snippet targeting)
- H3 for supporting points only — no keyword stuffing
- No more than two levels of nesting unless content genuinely requires it

### Keyword Usage

- Primary keyword: 3–5 natural appearances per 1,000–1,500 words
- Use semantic variants throughout: "paint protection film" + "PPF" + "clear film" + "self-healing coating"
- Include Dubai-context LSI terms: heat, humidity, sand, resale value, showroom, detailing centre

### Content Length

- Minimum 900 words for informational articles
- Minimum 1,100 words for comparison and commercial investigation pieces
- No padding — every paragraph must add real value

### Internal Linking

- At least one natural link to `/ppf-dubai` embedded in body text
- If a related article exists, link to it naturally once
- Do not drop links in a list at the bottom — embed in context only

### External Linking

- One or two credible outbound links acceptable (industry body, manufacturer page)
- Never link to direct competitors
- Never fabricate sources

---

## 6) Content Quality Standards

Every article must be:

- Original and non-derivative
- More useful than the top 3 ranking pages
- Dubai-specific and practical
- Honest about trade-offs (when to buy AND when not to buy)

Mandatory structure:

1. Opening hook — challenges an assumption or exposes a buyer mistake
2. Buyer-focused body sections that match keyword intent
3. Subtle authority signals from real installation context (no fabricated claims)
4. At least one natural internal link
5. Strong closing CTA for WhatsApp/booking (prose only — `ArticleLayout.tsx` already adds the WhatsApp button, do not add a second full widget)

Tone:

- Expert advisor, not content writer
- Premium, process-driven, honest
- Human and direct, no filler

Allowed brand references:

- STEK
- GYEON
- XPEL (comparison context only)

Quality self-check before committing (mandatory):

- [ ] Is this better than what currently ranks for the chosen keyword?
- [ ] Would a Dubai car buyer trust this over the top 3 results?
- [ ] Is every section necessary? (Remove anything that isn't.)
- [ ] Does the opening hook create genuine curiosity or tension?
- [ ] Is there balanced guidance — when to buy AND when not to?

If any answer is NO: rewrite the failing section before committing.

---

## 7) Article Format (.tsx) — What to Write

Every article is a TypeScript React component using `ArticleLayout`. Use the existing files as templates:

**Reference files:**
- `C:\Users\Marlon\.openclaw\grand-touch-craft\src\pages\articles\IsPpfWorthItDubai.tsx`
- `C:\Users\Marlon\.openclaw\grand-touch-craft\src\pages\articles\PpfVsCeramicDubai.tsx`

**New article path:**
`C:\Users\Marlon\.openclaw\grand-touch-craft\src\pages\articles\<PascalCase>.tsx`

Where `<PascalCase>` is the slug converted to PascalCase (e.g. `ppf-summer-heat-dubai` → `PpfSummerHeatDubai`).

### Article Object Fields

| Field | Value |
|---|---|
| `id` | Next available integer after existing highest id |
| `title` | Final H1 title |
| `slug` | URL-safe slug (matches branch name and filename slug) |
| `excerpt` | 1–2 sentences, unique, feeds meta description on article page |
| `content` | Full article body (see content syntax below) |
| `author` | `"Sean, Grand Touch Auto"` — always this string exactly |
| `publishedAt` | `"YYYY-MM-DD"` — today's date |
| `readTime` | Estimated e.g. `"7 min read"` |
| `category` | One of: `"Protection"` / `"Detailing"` / `"Customization"` / `"Performance"` / `"Restoration"` |
| `image` | `"/ppf-featured-<slug>-option-1.png"` — leading slash, no `public/` prefix |
| `featured` | `false` (unless Sean instructs otherwise) |
| `tags` | Array of SEO keyword strings |

### Content String Syntax

The `content` field is a custom markdown-like string parsed by `ArticleLayout`:

- Blocks separated by `\n\n`
- `## Heading` / `### Heading` / `#### Heading` (H2 feeds table of contents)
- `**bold**`, `*italic*`, `[text](url)` work in paragraphs
- `- ` for bullets, `1. ` for numbered lists
- No raw HTML
- No duplicate contact widget (ArticleLayout adds the WhatsApp button automatically)

### Related Articles

Include 3 `relatedArticles` entries. Use existing published slugs only. Image paths must exist under `C:\Users\Marlon\.openclaw\grand-touch-craft\public\`.

---

## 8) Image Generation

Generate exactly one featured image per article. Save it directly to its final location.

### Model

Use **OpenAI GPT Image 1.5** as primary:

- Model identifier: `openai/gpt-image-1.5`
- 4x faster and 20% lower cost than gpt-image-1, with superior photorealism

Fallback: `openai/gpt-image-1` only if 1.5 is unavailable.

**Why not Grok Aurora:** Grok Aurora requires an X (Twitter) Premium+ or SuperGrok subscription. It has no public API and cannot be called programmatically. It is not compatible with automated workflows.

### Size Policy

- Primary: `1536x1024`
- Fallback: `1024x1024` if primary fails
- No other sizes

### Final Save Path (Direct — No Staging)

```
C:\Users\Marlon\.openclaw\grand-touch-craft\public\ppf-featured-<slug>-option-1.png
```

This is the image's permanent location. No copy step is needed at approve time.

### React Reference String (Used in Article and Blog.tsx)

```
/ppf-featured-<slug>-option-1.png
```

Leading slash, no `public/` prefix, no hash in filename.

### Dubai Ultra-Realistic Automotive Prompt Template

Construct every image prompt using this structure:

```
[SCENE] + [SUBJECT] + [DETAILS] + [LIGHTING] + [LENS/CAMERA STYLE] + [HARD CONSTRAINTS]
```

Default template:

```
Ultra-photorealistic commercial automotive photography. 
Scene: modern luxury car detailing studio in Dubai, polished dark concrete floor, 
clean minimalist environment, large studio windows showing blurred Dubai skyline at dusk. 
Subject: front three-quarter view of a high-end luxury SUV (generic form, no brand markings), 
paint surface showing deep mirror gloss consistent with paint protection film application, 
subtle surface light reflections. 
Details: fine paint texture visible at near-surface level, no imperfections, 
studio environment is spotless and premium. 
Lighting: high-key soft diffused overhead studio lights with one warm fill light from left, 
gentle rim light from rear right, no hard shadows, professional product photography grade. 
Camera style: 50mm prime lens equivalent, f/2.8 shallow depth of field, 
slight warm colour temperature, eye-level angle, commercial automotive photography. 
Hard constraints: absolutely no readable text, no brand logos, no license plates, 
no identifiable people, no fictional or invented branding. 
Blank lower-third area suitable for potential headline overlay (no text embedded in image).
```

Topic-specific adjustments:

| Article Topic | Scene Adjustment |
|---|---|
| PPF vs Ceramic | Two-panel split: one side gloss PPF sheen, one side matte ceramic look, same car form |
| Full Body PPF | Hands (no face visible) applying clear film to a door panel in a bright installation bay |
| PPF Durability/Heat | Outdoor Dubai setting, golden hour, heat haze in background, car gleaming in direct sunlight |
| PPF Cost/Value | Wide shot of premium detailing studio interior, single car as hero, aspirational atmosphere |
| Installer Quality | Close-up macro of a film edge on a curved body panel, perfect fit, no lifting |
| STEK vs GYEON | Clean comparison setup, two sections of bodywork showing different film textures |

### Verification Before Commit

After saving the image:

- [ ] File size is greater than 200 KB (confirms it is a real binary, not a text stub)
- [ ] File opens correctly as an image
- [ ] Filename matches the slug exactly
- [ ] Image path in `.tsx` article file matches the actual filename in `public/`

---

## 9) File Updates Required Per Article

After writing the article `.tsx` and saving the image, update these four files:

### 9a) `C:\Users\Marlon\.openclaw\grand-touch-craft\src\pages\Blog.tsx`

Two changes:

**1. Add slug to `getArticleSlug`:**
```typescript
<id>: "<slug>",
```

**2. Append to `blogPosts` array:**
```typescript
{
  id: <id>,
  title: "<Title>",
  excerpt: "<excerpt>",
  content: "<one-line summary for card>",
  author: "Sean, Grand Touch Auto",
  publishedAt: "YYYY-MM-DD",
  readTime: "<N> min read",
  category: "<Category>",
  image: "/ppf-featured-<slug>-option-1.png",
  featured: false,
},
```

Never remove existing entries. Append only.

### 9b) `C:\Users\Marlon\.openclaw\grand-touch-craft\src\App.tsx`

Add one route **above** the `path="*"` catch-all:

```typescript
<Route path="/blog/<slug>" element={<PascalCaseComponent />} />
```

Also add the import at the top of the file:

```typescript
import PascalCaseComponent from "./pages/articles/<PascalCase>";
```

### 9c) `C:\Users\Marlon\.openclaw\grand-touch-craft\src\components\ArticleLayout.tsx`

Add the same slug mapping entry in the inner `getArticleSlug` slug map:

```typescript
<id>: "<slug>",
```

### 9d) `C:\Users\Marlon\.openclaw\grand-touch-craft\public\sitemap.xml`

Add a URL block:

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

## 10) Build Verification (Before Push)

Run from the repo root:

```
cd C:\Users\Marlon\.openclaw\grand-touch-craft
npm run build
```

Must pass with zero errors. If build fails: fix the error, do not push.

Common failure causes:
- Missing import in `App.tsx`
- TypeScript error in article component
- Image filename mismatch (image referenced in code does not exist in `public/`)

---

## 11) Telegram Notification Format

Send after successful build and branch push. Use this exact structure:

```
DRAFT READY ✓
Branch: draft/<slug>
Preview: <Vercel preview URL>

━━━━ KEYWORD INTELLIGENCE ━━━━
Niche: <e.g. PPF longevity in Dubai heat>
Keyword: "<primary keyword>"
Est. monthly searches: ~<volume>
Keyword difficulty: <score>/100 — LOW / MEDIUM / HIGH
Search intent: Informational / Commercial / Transactional

Why I chose this:
• <e.g. KD of 14 — no strong local Dubai competitors ranking>
• <e.g. Top 3 results are generic UK/US content with no Dubai context>
• <e.g. Commercial intent — searchers are comparing options before buying>
• <e.g. Runner-up saved for next article: "<runner-up keyword>">

━━━━ TRAFFIC & REVENUE CASE ━━━━
• <Why this should rank — content gap, local advantage, intent match>
• <Why this should convert — buyer stage, CTA alignment, trust angle>
• <What makes it better than current competition>

━━━━ ARTICLE ━━━━
• Angle: <one-line>
• Key buyer question answered: <one-line>
• Trust signal used: <one-line>

Reply APPROVE to open PR → main.
```

Then send the generated image as a separate message for visual review.

Do not:
- Paste the full article in Telegram
- Open a PR automatically before receiving `APPROVE`
- Ask questions

---

## 12) Approval and Merge Commands

### `APPROVE` (or `APPROVED: <slug>`)

Open Pull Request from `draft/<slug>` to `main`.

- Title: `Article: <article title>`
- If no slug given: use the most recently pushed `draft/*` branch. Do not ask.
- Post PR URL to Telegram: `PR open: <GitHub PR URL>`

### `MERGE`

Merge the open PR to `main`. Wait for Vercel production deployment. Post:

```
MERGED ✓
Live: https://www.grandtouchauto.ae/blog/<slug>
```

---

## 13) Build Safety Rules (Never Violate)

1. Never push directly to `main`. Always use `draft/<slug>` branch → PR.
2. Never remove existing `blogPosts` entries.
3. Never simplify `Blog.tsx` — it must keep: hero, featured section, category strip, latest grid, Footer, WhatsAppButton, and the SEO `useEffect` with `updatePageSEO('blog')` and `generateBlogStructuredData`.
4. Never use hashed asset paths (e.g. `/assets/file-DIdSoKcx.jpg`) — these change on every build.
5. Never commit a file named `.png` or `.jpg` that contains a text path instead of real image bytes. Verify file size (must be many KB+).
6. Never duplicate the WhatsApp contact widget in `article.content` — `ArticleLayout.tsx` adds it automatically.
7. Slug must be consistent in three places: `App.tsx` route, `Blog.tsx` slugMap, `ArticleLayout.tsx` slugMap.
