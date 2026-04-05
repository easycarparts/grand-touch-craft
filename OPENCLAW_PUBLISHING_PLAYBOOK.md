# Grand Touch Auto — Publishing Playbook (OpenClaw)

**This file lives at:** `C:\Users\Marlon\.openclaw\workspace\skills\OPENCLAW_PUBLISHING_PLAYBOOK.md`
**Edited by Sean at:** `C:\Users\seane\Desktop\GTA Website\grand-touch-craft\OPENCLAW_PUBLISHING_PLAYBOOK.md`
**After editing, copy to the skills path above so OpenClaw reads the latest version.**

**Stack:** Vite + React + React Router SPA (NOT Next.js)
**Live site:** `https://www.grandtouchauto.ae`
**Repo root (OpenClaw):** `C:\Users\Marlon\.openclaw\grand-touch-craft\`

---

## How This Playbook Fits With `blog-guidelines.md`

| Document | Purpose | When it applies |
|---|---|---|
| `blog-guidelines.md` | Keyword research, SEO standards, content rules, image generation, draft branch setup, Telegram output | The full DRAFT MODE pipeline |
| This playbook | Technical file paths, code patterns, field reference, build steps, PR/merge commands | Reference during file writing and BUILD verification |

Both documents are used together. `blog-guidelines.md` drives decisions; this playbook drives implementation detail.

---

## Architecture: Single-Step Draft → Approve → Merge

Articles are written ONCE, in their final production format, in their correct file locations, on a `draft/<slug>` branch. There is no intermediate markdown conversion, no staging folder to copy from, and no format translation step.

```
DRAFT MODE (automated):
  keyword research
  → write .tsx to src/pages/articles/<PascalCase>.tsx
  → save image to public/<filename>.png
  → update Blog.tsx, App.tsx, ArticleLayout.tsx, sitemap.xml
  → npm run build (must pass)
  → push draft/<slug> branch
  → Vercel preview URL
  → Telegram notification

APPROVE command:
  → open PR: draft/<slug> → main

MERGE command:
  → merge PR to main
  → confirm live URL
```

---

## Part A — Repository Layout (Full Absolute Paths)

| Purpose | Full path |
|---|---|
| Repo root | `C:\Users\Marlon\.openclaw\grand-touch-craft\` |
| Blog index page | `C:\Users\Marlon\.openclaw\grand-touch-craft\src\pages\Blog.tsx` |
| Route definitions | `C:\Users\Marlon\.openclaw\grand-touch-craft\src\App.tsx` |
| Article layout component | `C:\Users\Marlon\.openclaw\grand-touch-craft\src\components\ArticleLayout.tsx` |
| Article page components | `C:\Users\Marlon\.openclaw\grand-touch-craft\src\pages\articles\<PascalCase>.tsx` |
| Static image files | `C:\Users\Marlon\.openclaw\grand-touch-craft\public\<filename>.<ext>` |
| Sitemap | `C:\Users\Marlon\.openclaw\grand-touch-craft\public\sitemap.xml` |
| Robots | `C:\Users\Marlon\.openclaw\grand-touch-craft\public\robots.txt` |
| Build output (do not edit) | `C:\Users\Marlon\.openclaw\grand-touch-craft\dist\` |

### URL vs File Path

| Browser URL | Route string in App.tsx | Component file |
|---|---|---|
| `/blog/<slug>` | `path="/blog/<slug>"` | `src/pages/articles/<PascalCase>.tsx` |

---

## Part B — The Four Files That Must Be Updated Per Article

Every new article requires changes to exactly four files plus a new file creation. In order:

### 1. New article component

**Path:** `C:\Users\Marlon\.openclaw\grand-touch-craft\src\pages\articles\<PascalCase>.tsx`

Copy `IsPpfWorthItDubai.tsx` or `PpfVsCeramicDubai.tsx` as your template. Fields: see Part D.

### 2. Route in App.tsx

**Path:** `C:\Users\Marlon\.openclaw\grand-touch-craft\src\App.tsx`

Add **above** the catch-all `path="*"` route:

```typescript
import <PascalCase> from "./pages/articles/<PascalCase>";

// Inside router:
<Route path="/blog/<slug>" element={<<PascalCase> />} />
```

### 3. Blog.tsx — slug map + blogPosts entry

**Path:** `C:\Users\Marlon\.openclaw\grand-touch-craft\src\pages\Blog.tsx`

**Slug map (`getArticleSlug`):**

```typescript
<id>: "<slug>",
```

Fallback must use template literal: `` `article-${id}` `` (backticks) — NOT `'article-${id}'`.

**`blogPosts` append (never remove existing entries):**

```typescript
{
  id: <id>,
  title: "<Title>",
  excerpt: "<unique 1-2 sentence excerpt>",
  content: "<one-sentence summary for card display>",
  author: "Sean, Grand Touch Auto",
  publishedAt: "YYYY-MM-DD",
  readTime: "<N> min read",
  category: "<Category>",
  image: "/ppf-featured-<slug>-option-1.png",
  featured: false,
},
```

### 4. ArticleLayout.tsx — slug map

**Path:** `C:\Users\Marlon\.openclaw\grand-touch-craft\src\components\ArticleLayout.tsx`

Add the same slug map entry as in Blog.tsx:

```typescript
<id>: "<slug>",
```

### 5. Sitemap

**Path:** `C:\Users\Marlon\.openclaw\grand-touch-craft\public\sitemap.xml`

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

## Part C — Image: Path Rules (No Exceptions)

### Where to save the image

```
C:\Users\Marlon\.openclaw\grand-touch-craft\public\ppf-featured-<slug>-option-1.png
```

Save it here once. Do not use a staging folder. Do not copy it later.

### How to reference it in React

In `blogPosts[n].image` in `Blog.tsx` and in `article.image` in the article `.tsx` file:

```typescript
image: "/ppf-featured-<slug>-option-1.png",
```

Rules:
- Leading `/` — this is a site-root-relative URL
- No `public/` prefix in the string
- No hash in the filename (e.g. never `/assets/file-DIdSoKcx.jpg`)
- Filename must be stable across builds

### Three-way consistency check

The same path string must appear in all three places:

1. `C:\Users\Marlon\.openclaw\grand-touch-craft\public\ppf-featured-<slug>-option-1.png` — the file exists
2. `Blog.tsx` `blogPosts[n].image` — `"/ppf-featured-<slug>-option-1.png"`
3. Article `.tsx` file `article.image` — `"/ppf-featured-<slug>-option-1.png"`

If any one of these differs: broken image in blog card or article hero.

### Image integrity check before commit

```
- File size > 200 KB (real binary, not a text stub)
- File opens correctly as a PNG or JPEG
- Filename matches slug exactly
```

---

## Part D — Article Object Field Reference

| Field | Type | Notes |
|---|---|---|
| `id` | `number` | Next integer after highest existing id in `blogPosts` |
| `title` | `string` | Final H1. Must contain primary keyword in first 60 characters. |
| `slug` | `string` | URL-safe. Must match route in `App.tsx`, both slug maps, image filename, and branch name. |
| `excerpt` | `string` | Unique 1–2 sentences. Feeds meta description on article page. |
| `content` | `string` | Full article body (see Part E for syntax). |
| `author` | `string` | Always exactly `"Sean, Grand Touch Auto"` |
| `publishedAt` | `string` | `"YYYY-MM-DD"` format. Blog index sorts non-featured posts newest-first automatically. |
| `readTime` | `string` | e.g. `"7 min read"` |
| `category` | `string` | One of: `"Protection"` / `"Detailing"` / `"Customization"` / `"Performance"` / `"Restoration"` |
| `image` | `string` | `"/ppf-featured-<slug>-option-1.png"` — leading slash, no `public/` prefix |
| `featured` | `boolean` | `false` unless Sean specifically requests a featured article |
| `tags` | `string[]` | SEO keyword array (primary keyword + variants) |

---

## Part E — `article.content` Syntax

The `content` string is parsed by the custom renderer in `ArticleLayout.tsx`. It is not full GitHub Markdown.

**Formatting rules:**

| Element | Syntax |
|---|---|
| Paragraph break | Blank line (`\n\n`) between blocks |
| H2 heading (appears in table of contents) | Line starts with `## ` |
| H3 heading | Line starts with `### ` |
| H4 heading | Line starts with `#### ` |
| Bold | `**text**` |
| Italic | `*text*` |
| Link | `[anchor text](url)` |
| Bullet list | Lines starting with `- ` or `* ` |
| Numbered list | Lines starting with `1. `, `2. `, etc. |
| No raw HTML | Avoid — will not render correctly |

**Editorial rules (from `blog-guidelines.md`):**

- Internal link to `/ppf-dubai` somewhere in body text
- Strong opening hook in first paragraph
- Balanced guidance (when to buy, when not to)
- No duplicate WhatsApp CTA widget — `ArticleLayout.tsx` adds this automatically

---

## Part F — Blog.tsx Integrity Rules (Never Violate)

`Blog.tsx` at `C:\Users\Marlon\.openclaw\grand-touch-craft\src\pages\Blog.tsx` must always keep:

1. **Hero section** — `<section>` with heading and description at top
2. **Featured Article section** — renders posts where `featured: true`
3. **Category strip** — `<section>` with category filter buttons
4. **Latest Articles grid** — renders non-featured posts sorted newest-first
5. **`<Footer />`** component at bottom
6. **`<WhatsAppButton />`** component
7. **`useEffect`** that calls `updatePageSEO('blog')` and injects `generateBlogStructuredData` JSON-LD into `document.head`

Never simplify this page to a plain card list. If any of the above is missing: restore it.

---

## Part G — Branch and PR Workflow (Full Command Reference)

### DRAFT MODE: Create branch, write files, build, push

```bash
cd C:\Users\Marlon\.openclaw\grand-touch-craft

# Create and switch to draft branch
git checkout main
git pull origin main
git checkout -b draft/<slug>

# Write all files (article .tsx, image to public/, Blog.tsx, App.tsx, ArticleLayout.tsx, sitemap.xml)

# Verify build passes
npm run build

# Stage and commit
git add .
git commit -m "Draft: <article title>"

# Push to GitHub (triggers Vercel preview)
git push -u origin draft/<slug>
```

After push: retrieve Vercel preview URL and send Telegram notification (see `blog-guidelines.md` Section 11).

### APPROVE: Open Pull Request

```bash
gh pr create \
  --base main \
  --head draft/<slug> \
  --title "Article: <article title>" \
  --body "$(cat <<'EOF'
## Summary
- Keyword: <primary keyword>
- KD: <score> (LOW/MEDIUM/HIGH)
- Intent: <type>
- Preview: <Vercel preview URL>

## Checklist
- [ ] Article .tsx created
- [ ] Image in public/ (real binary)
- [ ] Blog.tsx updated (slug map + blogPosts)
- [ ] App.tsx route added
- [ ] ArticleLayout.tsx slug map updated
- [ ] sitemap.xml updated
- [ ] npm run build passes
EOF
)"
```

Post PR URL to Telegram. Wait for `MERGE`.

### MERGE: Merge PR to main

```bash
gh pr merge draft/<slug> --merge --delete-branch
```

Wait for Vercel production deploy confirmation. Post to Telegram:

```
MERGED ✓
Live: https://www.grandtouchauto.ae/blog/<slug>
```

---

## Part H — Common Errors to Avoid

| Error | What goes wrong | Fix |
|---|---|---|
| Hashed asset URL (`/assets/file-HASH.jpg`) in `image` field | Works for one build, breaks after rebuild | Use `/ppf-featured-<slug>-option-1.png` from `public/` directly |
| Stub "PNG" (text file renamed .png) | Broken image everywhere the path appears | Save a real binary; verify file size > 200 KB |
| `Blog.tsx` simplified to a plain list | Lost hero, SEO JSON-LD, featured section, category strip | Restore full structure from backup or git history |
| Missing `App.tsx` route | "Read More" link returns 404 | Add `<Route path="/blog/<slug>" />` above catch-all |
| Slug mismatch between files | Wrong links, 404s, broken related posts | Ensure `App.tsx` route, `Blog.tsx` slugMap, and `ArticleLayout.tsx` slugMap all use identical slug string |
| Push to `main` directly | Bypasses Sean's review | Always use `draft/<slug>` branch → PR |

---

## Part I — Quick Path Reference

| Need | Full path |
|---|---|
| Blog index, `blogPosts`, `getArticleSlug` | `C:\Users\Marlon\.openclaw\grand-touch-craft\src\pages\Blog.tsx` |
| Routes | `C:\Users\Marlon\.openclaw\grand-touch-craft\src\App.tsx` |
| Article chrome, TOC, WhatsApp CTA, slug map | `C:\Users\Marlon\.openclaw\grand-touch-craft\src\components\ArticleLayout.tsx` |
| Article typography CSS | `C:\Users\Marlon\.openclaw\grand-touch-craft\src\components\ArticleContent.css` |
| Individual article page | `C:\Users\Marlon\.openclaw\grand-touch-craft\src\pages\articles\<PascalCase>.tsx` |
| Published images | `C:\Users\Marlon\.openclaw\grand-touch-craft\public\<filename>.png` |
| Sitemap | `C:\Users\Marlon\.openclaw\grand-touch-craft\public\sitemap.xml` |
| SEO utility functions | `C:\Users\Marlon\.openclaw\grand-touch-craft\src\lib\seo.ts` |
| These guidelines | `C:\Users\Marlon\.openclaw\workspace\skills\blog-guidelines.md` |
| This playbook | `C:\Users\Marlon\.openclaw\workspace\skills\OPENCLAW_PUBLISHING_PLAYBOOK.md` |
