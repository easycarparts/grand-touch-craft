# Grand Touch Auto — blog article publishing (step-by-step)

**Canonical copy (version-controlled):** `docs/OPENCLAW_PUBLISHING_PLAYBOOK.md` inside the **`grand-touch-craft`** repo. If you mirror this file under an OpenClaw workspace (e.g. `skills/`), **re-copy from this repo after pulls** — an outdated mirror causes wrong paths and broken builds.

**Stack:** Vite + React + React Router (not Next.js). **Live site (canonical):** `https://www.grandtouchauto.ae`

### Site repository root (BUILD MODE — use this folder)

All relative paths in this playbook (`src/...`, `public/...`, `docs/...`) are from the **clone root** of **grand-touch-craft**.

| Environment | Absolute path to repo root |
|-------------|---------------------------|
| **OpenClaw (Marlon / automation)** | `C:\Users\Marlon\.openclaw\grand-touch-craft` |
| **Other machines** | Your local clone (e.g. `...\Desktop\GTA Web\grand-touch-craft`) — **must** be the folder that contains `package.json`, `src/`, and `public/`. |

**BUILD MODE rules:**

1. **`cd` to the site repo root** above **before** any `git`, `npm run build`, or file edits for publish.  
2. **Do not** apply playbook steps inside `review_queue`, `skills/`, or a random workspace folder that is **not** this clone.  
3. **Playbook file to read from disk:**  
   `C:\Users\Marlon\.openclaw\grand-touch-craft\docs\OPENCLAW_PUBLISHING_PLAYBOOK.md`  
   (or `<your-clone>\docs\OPENCLAW_PUBLISHING_PLAYBOOK.md` on other PCs).

**Also add the same paths into `blog-guidelines.md`** (WRITE MODE doc) so agents never guess the clone. Ready-to-paste Markdown: **`docs/PASTE_INTO_BLOG_GUIDELINES.md`** in this repo.

---

## How this playbook fits `blog-guidelines.md` (no conflict)

| Document | Role | When it applies |
|----------|------|-----------------|
| **`blog-guidelines.md`** (OpenClaw workspace) | Editorial + SEO + **WRITE MODE** (research, draft Markdown, images into **review queue**, Telegram handoff). | **Before** any edit to this repo. |
| **`OPENCLAW_PUBLISHING_PLAYBOOK.md`** (this file) | **BUILD MODE** — concrete file paths in **`grand-touch-craft`**, routes, slug maps, `public/`, build, push. | **Only after** explicit approval (e.g. `APPROVED: [slug]`). |

- **WRITE MODE** must **not** modify this repo, `Blog.tsx`, or branches — per your `blog-guidelines.md`.
- **BUILD MODE** follows **this playbook** to implement the approved draft in **`grand-touch-craft`** and open a PR / push per your process.

---

## Draft vs publishable assets (CRON → approval → `main`)

Keep these separate:

| Stage | Where things live | Allowed actions |
|-------|-------------------|-----------------|
| **Draft** | OpenClaw `review_queue/pending/`, `review_queue/pending-images/<YYYY-MM-DD>/`, Telegram review | Write Markdown, generate or attach images, metadata. **Do not** commit here. |
| **Publishable** | This repo: **`public/`** (real image binaries) + **`src/`** (React pages, `Blog.tsx`, `App.tsx`, etc.) | Only after **Sean’s approval**. |
| **Release** | `npm run build` passes → then **push to `main`** (or merge PR) → deploy | Only after local verification. |

**Rule:** Nothing in the draft folders is served by the website until the same file (or a copy) exists under **`public/`** in this repo and is referenced correctly in code.

---

## Images: generated, shot, or stock — must end as real files in `public/`

- **Allowed:** Images produced any way (e.g. model-generated, designer export, photo) **as long as** the published artifact is a **real binary** (PNG/JPEG/WebP) committed under **`public/`**.
- **Not allowed:** Text stubs (e.g. `MEDIA:C:\...`), Git LFS pointer text, or empty files renamed `.png`.
- **Naming (recommended, matches WRITE workflow):** `ppf-featured-<slug>-option-1.png` (or another stable name). The **slug** in the filename should match the URL slug.
- **WRITE MODE** may save under `review_queue/pending-images/<YYYY-MM-DD>/`. **BUILD MODE** must **copy** (or re-export) that file into **`public/`** with the final name you will reference in React.

### The only accepted URL pattern in React data

1. **File on disk:** `public/<filename>.<ext>`  
2. **In `Blog.tsx` and article `article.image`:** `image: "/<filename>.<ext>"`  
   - Leading **`/`** = site root.  
   - **Never** use `public/...` inside the string.  
   - **Never** use **`/assets/<name>-<hash>.<ext>`** from a Vite build output (hash changes every build).

### Three-way image consistency (mandatory)

The **same** path string (e.g. `/ppf-featured-my-slug-option-1.png`) must align across:

1. **`public/`** — the file actually exists there.  
2. **`src/pages/Blog.tsx`** — the matching **`blogPosts`** entry **`image`**.  
3. **`src/pages/articles/<Article>.tsx`** — **`article.image`**.

Optionally **4th:** **`public/sitemap.xml`** — **`image:loc`** uses full URL with the same filename, e.g. `https://www.grandtouchauto.ae/ppf-featured-my-slug-option-1.png`.

If any one differs, the blog card and article hero can disagree or 404.

---

## Part A — Repository layout and paths

### A.1 What lives where

| Location on disk | Role |
|------------------|------|
| `src/` | TypeScript/React source; not served as static files as-is. |
| `src/pages/` | Top-level pages (e.g. `Blog.tsx`). |
| `src/pages/articles/` | One component file per article. |
| `src/components/` | Shared UI (`ArticleLayout.tsx`, etc.). |
| `public/` | **Static assets** copied to **`dist/`** root — images, `sitemap.xml`, `robots.txt`. |
| `dist/` | Build output — **do not edit by hand.** |

### A.2 Browser URL vs source file

- URL: `/blog/my-slug`  
- Route string in **`src/App.tsx`:** `path="/blog/my-slug"`  
- Component file: e.g. **`src/pages/articles/MySlugArticle.tsx`** (PascalCase; name ≠ slug).

### A.3 Slug must match in three places

1. **`src/App.tsx`** — `<Route path="/blog/<slug>" ... />`  
2. **`src/pages/Blog.tsx`** — `getArticleSlug` → `slugMap` → `id: "<slug>"`  
3. **`src/components/ArticleLayout.tsx`** — inner `slugMap` → same `id` → same slug characters  

Mismatch → wrong links, 404s, broken related posts.

### A.4 Imports

- **`@/components/...`** → under **`src/`**.  
- From **`App.tsx`:** `import X from "./pages/articles/X"` → **`src/pages/articles/X.tsx`**.

### A.5 Sitemap

**File:** `public/sitemap.xml` — use **absolute** URLs on **`https://www.grandtouchauto.ae`**.

---

## Part B — Rules you must not break

1. **Do not** replace **`src/pages/Blog.tsx`** with a minimal card-only page. Keep hero, featured block, categories, grid, Footer, WhatsAppButton, and the **`useEffect`** with **`updatePageSEO('blog')`** + **`generateBlogStructuredData`**.  
2. **`blogPosts`** must include **every** post that has a **`/blog/...`** route. **Append** new posts; don’t remove old ids unless you remove routes + article files too.  
3. **`getArticleSlug` fallback:** `` `article-${id}` `` (backticks) — not `'article-${id}'`.  
4. New article = new **`src/pages/articles/*.tsx`** + **`App.tsx`** route + **both slug maps** + **`blogPosts`** row + optional **`sitemap.xml`**.  
5. **`author`** (repo standard): **`"Sean, Grand Touch Auto"`** on the article object and the matching **`blogPosts`** row.  
6. **`ArticleLayout`** already adds **Message Sean** (WhatsApp). **Do not** duplicate a full contact CTA in **`article.content`** (editorial CTAs in prose are fine per **`blog-guidelines.md`**).

---

## Part C — Source of truth (two layers)

| Layer | Source of truth | What it controls |
|-------|-----------------|------------------|
| **Blog index** | **`blogPosts`** in **`src/pages/Blog.tsx`** | Card title, excerpt, image, date, category, link to article. |
| **Article page** | **`src/pages/articles/<Name>.tsx`** → **`article`** object | Full **`content`**, same **id**, **slug** (via maps), **image**, SEO fields for that URL. |

**Requirement:** Same **`id`**, **slug** (via maps), **`image`** path, **`title`**, **`excerpt`**, **`publishedAt`** (and **`author`**) should match between the **`blogPosts`** entry and the article file unless you intentionally differ (not recommended).

---

## Part D — Publish readiness checklist (before PR / push)

Use this in **BUILD MODE** after approval:

- [ ] **`src/pages/articles/<PascalCase>.tsx`** created with **`ArticleLayout`**.  
- [ ] **`src/App.tsx`** — `import` + **`<Route path="/blog/<slug>" />`** placed **above** the catch-all route `path="*"`.  
- [ ] **`src/pages/Blog.tsx`** — **`slugMap`** entry + **`blogPosts`** append.  
- [ ] **`src/components/ArticleLayout.tsx`** — same **`slugMap`** entry.  
- [ ] **Image file** exists in **`public/`** and **`blogPosts.image`** + **`article.image`** use the **same** **`/<file>.<ext>`**.  
- [ ] **`public/sitemap.xml`** updated (optional but recommended).  
- [ ] **`npm run build`** succeeds.  
- [ ] **`/blog`** and **`/blog/<slug>`** checked locally — image loads, **Message Sean** visible.  
- [ ] Push to **`main`** (or merge) **only after** Sean’s approval of the implementation.

---

## Part E — Publish one new article (numbered steps)

Pick unused **`id`** (from existing **`blogPosts`**) and final **`slug`**.

### Step 1 — Article component

- Create **`src/pages/articles/<PascalCase>.tsx`**.  
- Set **`article`** fields (see Part F table). **`content`** formatting: **Part G**.  
- **`relatedArticles`:** 3 items; **`image`** paths must exist under **`public/`**.

### Step 2 — Route (`src/App.tsx`)

- `import` from **`./pages/articles/<Name>`**.  
- `<Route path="/blog/<slug>" element={<... />} />` before the catch-all `path="*"`.

### Step 3 — `Blog.tsx`

- Add **`slugMap[id]`**.  
- Fallback: `` `article-${id}` ``.  
- **Append** **`blogPosts`** object (**same** **`id`**, **`image`**, **`title`**, **`excerpt`**, **`publishedAt`**, **`author`**, etc.).

### Step 4 — `ArticleLayout.tsx`

- Same **`slugMap`** line for **`id`**.

### Step 5 — `public/sitemap.xml` (recommended)

- **`<loc>`** + **`<image:loc>`** on **`https://www.grandtouchauto.ae`**, matching **`article.image`**.

### Step 6 — Image file

- Ensure **`public/<filename>.<ext>`** is a **real** image.  
- If copying from OpenClaw **`pending-images`**, verify size (KB+) and open in a viewer before commit.

### Step 7 — Verify

- **`npm run build`**, manual **`/blog`** + article URL checks, then commit and push per approval.

---

## Part F — `article` / `blogPosts` field reference

| Field | Notes |
|--------|--------|
| `id` | Same everywhere (maps, **`blogPosts`**, article file). |
| `title` | H1 + SEO. |
| `excerpt` | Unique; feeds meta / cards. |
| `content` | Full body string; **Part G**. |
| `author` | **`"Sean, Grand Touch Auto"`** (repo standard). |
| `publishedAt` | **`YYYY-MM-DD`**; non-featured sort is **newest first**. |
| `readTime` | e.g. **`"7 min read"`**. |
| `category` | Must match blog category set. |
| `image` | **`"/file.ext"`** with file in **`public/`**. |
| `featured` | `true` / `false`. |
| `tags` | SEO keywords array. |

---

## Part G — `article.content` syntax (ArticleLayout parser)

Not full GitHub Markdown.

1. **Blocks separated by a blank line** (`\n\n`).  
2. **Headings:** line starts with **`## `**, **`### `**, or **`#### `** (not single **`# `**). **`##`** entries feed the table of contents.  
3. **Bold / italic / links:** `**bold**`, `*italic*`, `[text](url)` — work in paragraphs and list lines.  
4. **Lists:** bullets with **`- `** or **`* `**; numbered with **`1. `**, **`2. `**, etc.  
5. **No raw HTML** in **`content`**.  

**Editorial extras** (from **`blog-guidelines.md`**): internal link to **`/ppf-dubai`** where relevant, strong hook, balanced guidance, end CTA — implement **inside** the **`content`** string when converting from approved Markdown.

---

## Part H — SEO (technical)

- Unique title, excerpt, tags.  
- Dubai/geo where relevant.  
- Honest **`excerpt`** (feeds meta).  
- Internal links: **`[text](/blog/other-slug)`** or **`/ppf-dubai`** as per editorial guidelines.  
- **`ArticleLayout`** emits structured data from the **`article`** object.

---

## Part I — Built-in Sean CTA (code)

**`src/components/ArticleLayout.tsx`** adds **Message Sean** (WhatsApp **`971567191045`**) with prefilled text. Do not remove. Editorial closing CTA in **`content`** can complement this; avoid duplicating a second full-width contact **widget**.

---

## Part J — Do not do this

- Gut **`Blog.tsx`** or drop blog JSON-LD / SEO **`useEffect`**.  
- Add **`blogPosts`** without route + both slug maps.  
- Use **`/assets/...`** hashed URLs in **`image`**.  
- Commit fake images (text paths, stubs).  
- Run **BUILD MODE** on the repo without **approval** if your process requires it.

---

## Part K — Quick path table

| Need | Path |
|------|------|
| Blog index + **`blogPosts`** + sort + **`getArticleSlug`** | `src/pages/Blog.tsx` |
| Article chrome, TOC, parser, Sean CTA | `src/components/ArticleLayout.tsx` |
| Article typography | `src/components/ArticleContent.css` |
| Routes | `src/App.tsx` |
| Published static files | `public/` |
| One file per article | `src/pages/articles/*.tsx` |

---

*Aligned with `blog-guidelines.md` (WRITE) vs this playbook (BUILD). Images may be AI-generated or manual; they must exist as real files under `public/` with consistent `/path` references in `Blog.tsx` and the article page.*
