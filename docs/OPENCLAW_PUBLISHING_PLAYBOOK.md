# Grand Touch Auto — blog article publishing (step-by-step)

One guide for publishing a new `/blog/...` article without breaking the site. **No AI image generation** — only real files you place in the repo.

**Project root** (everything below is relative to this folder):

`grand-touch-craft/`

**Stack:** Vite + React + React Router (not Next.js). **Live site (canonical):** `https://www.grandtouchauto.ae`

---

## Part A — How file paths and URLs map together

Read this once; every later step uses these rules.

### A.1 Repository layout (what lives where)

| Location on disk | Role |
|------------------|------|
| `src/` | TypeScript/React source. Edited by you; **not** served as raw files in production. |
| `src/pages/` | Top-level page components (e.g. `Blog.tsx`). |
| `src/pages/articles/` | One file per blog **article** (e.g. `PpfVsCeramicDubai.tsx`). |
| `src/components/` | Shared UI (e.g. `ArticleLayout.tsx` wraps every article). |
| `public/` | **Static files copied as-is** to the build output. Images, `robots.txt`, `sitemap.xml`. |
| `dist/` | Build output (created by `npm run build`). **Do not edit by hand.** |

### A.2 URL the user sees vs file on disk

- **Route** (browser): `https://www.grandtouchauto.ae/blog/ppf-vs-ceramic-dubai`  
  - Path only: `/blog/ppf-vs-ceramic-dubai`
- **React route** is declared in code as a **string** that matches that path, e.g. `path="/blog/ppf-vs-ceramic-dubai"`.
- The **component** that renders for that URL lives under **`src/pages/articles/`** with a **PascalCase** name, e.g. `PpfVsCeramicDubai.tsx`. The filename does **not** have to equal the slug, but the **`path=`** and **slug maps** must match the slug you choose.

### A.3 Images: `public/` vs `/something.jpg`

- Put the image file here: **`public/my-photo.jpg`**
- Reference it in React data as: **`image: "/my-photo.jpg"`**
  - Leading **`/`** means “site root”.
  - **Never** write `public/my-photo.jpg` inside `image:` — the browser would request the wrong URL.
- After `npm run build`, the same file appears as **`dist/my-photo.jpg`**. Deployed, the URL is still **`/my-photo.jpg`**.

### A.4 Wrong: `/assets/...` with a hash (Vite bundles)

During build, Vite may emit files like **`dist/assets/service-ppf-DIdSoKcx.jpg`** for **imported** images from `src/assets/`. The hash **`DIdSoKcx` changes when the build changes**.  

**Do not** copy those URLs into `blogPosts` or `article.image`. Use only stable paths to files in **`public/`** (e.g. `/service-ppf.jpg`).

### A.5 Imports inside `.tsx` files

- From article pages you often use:  
  `import ArticleLayout from "@/components/ArticleLayout";`  
  The **`@/`** alias means **`src/`** (configured in Vite).
- Route imports in `App.tsx` look like:  
  `import PpfVsCeramicDubai from "./pages/articles/PpfVsCeramicDubai";`  
  Path is relative to **`src/App.tsx`** → file is **`src/pages/articles/PpfVsCeramicDubai.tsx`**.

### A.6 Slug (string) must match in three logical places

The **slug** is the last segment of the URL, e.g. `ppf-vs-ceramic-dubai`.

1. **`src/App.tsx`** — `<Route path="/blog/ppf-vs-ceramic-dubai" ... />`
2. **`src/pages/Blog.tsx`** — inside `getArticleSlug`, map numeric **`id`** → **`"ppf-vs-ceramic-dubai"`**
3. **`src/components/ArticleLayout.tsx`** — same **`id` → `'ppf-vs-ceramic-dubai'`** (same characters as in the URL)

If any one of these disagrees, “Read more” links or related-article links can 404 or point to the wrong post.

### A.7 Sitemap uses **full absolute URLs**

File: **`public/sitemap.xml`**

Use the real domain, e.g.:

`<loc>https://www.grandtouchauto.ae/blog/ppf-vs-ceramic-dubai</loc>`

Image entries use the same host, e.g.:

`<image:loc>https://www.grandtouchauto.ae/service-ppf.jpg</image:loc>`

---

## Part B — Rules you must not break

1. **Do not** replace **`src/pages/Blog.tsx`** with a minimal list of cards. It must keep the full layout, **`useEffect`** for **`updatePageSEO('blog')`**, and **`generateBlogStructuredData`** JSON-LD.
2. **`blogPosts`** must list **every** post that has a live **`/blog/...`** route (one object per article). Add new posts; don’t delete old ids unless you also remove routes and article files.
3. In **`getArticleSlug`**, the fallback must be a **template literal**: `` `article-${id}` `` — not the string `'article-${id}'`.
4. New article = **new** `src/pages/articles/*.tsx` + **Route** in **`App.tsx`** + **both slug maps** + **`blogPosts`** row + optional **sitemap** entry.
5. **`author`** on every article object: **`"Sean, Grand Touch Auto"`**.
6. **`ArticleLayout`** already adds the **Message Sean** WhatsApp block at the bottom — do not paste a second contact CTA inside **`article.content`**.

---

## Part C — Publish one new article (numbered steps)

Pick a **numeric `id`** not already used (see existing `blogPosts` in `Blog.tsx`) and a **slug** (lowercase, hyphens, no spaces), e.g. **`id: 9`**, **`slug: ceramic-vs-wax-dubai`**.

### Step 1 — Create the article component file

1. Create: **`src/pages/articles/CeramicVsWaxDubai.tsx`**  
   - Name = **PascalCase**, typically derived from the title.  
   - **Not** the same as the slug; slug is only in routes and maps.

2. Copy the structure from **`src/pages/articles/IsPpfWorthItDubai.tsx`** or **`CeramicCoatingGuide.tsx`**.

3. Export a default component that returns:

   `return <ArticleLayout article={article} relatedArticles={relatedArticles} />;`

4. Fill **`article`** with at least:

   | Field | Notes |
   |--------|--------|
   | `id` | Same number you will use in **`Blog.tsx`** and slug maps (e.g. `9`). |
   | `title` | Page `<h1>` and SEO title base. |
   | `excerpt` | Meta description / card text; unique. |
   | `content` | Long string; format rules in **Part D** below. |
   | `author` | **`"Sean, Grand Touch Auto"`** |
   | `publishedAt` | **`"YYYY-MM-DD"`** — controls **newest-first** order on the blog index for non-featured posts. |
   | `readTime` | e.g. **`"7 min read"`** |
   | `category` | e.g. **`"Detailing"`** — must match your category set used on the blog. |
   | `image` | **`"/filename.jpg"`** — file must exist under **`public/`** (see Part A.3). |
   | `featured` | `true` or `false` — featured posts appear in the featured block; others in the grid. |
   | `tags` | String array for SEO chips / keywords. |

5. Fill **`relatedArticles`** with **3** objects (minimal fields: `id`, `title`, `excerpt`, `category`, `image`, `publishedAt`, `readTime`). Use **`image`** paths that exist under **`public/`**.

---

### Step 2 — Register the browser route

**File:** **`src/App.tsx`**

1. Near the top with other article imports, add:

   `import CeramicVsWaxDubai from "./pages/articles/CeramicVsWaxDubai";`

   - Path is relative to **`src/App.tsx`**: **`./pages/articles/`** + filename **without** `.tsx`.

2. Inside **`<Routes>`**, with the other **`/blog/...`** routes, add **above** the catch-all **`path="*"`**:

   `<Route path="/blog/ceramic-vs-wax-dubai" element={<CeramicVsWaxDubai />} />`

   - **`path`** must be **`/blog/`** + your **slug** exactly.

---

### Step 3 — Add the slug for this post id in `Blog.tsx`

**File:** **`src/pages/Blog.tsx`**

1. Find the function **`getArticleSlug`** and its **`slugMap`** object.

2. Add one line (example for `id` 9):

   `9: "ceramic-vs-wax-dubai",`

3. Ensure the fallback line uses **backticks**:

   `return slugMap[id] ?? `article-${id}`;`

4. In the **`blogPosts`** array (module-level, top of file), **append** a new object with the **same `id`**, same **`title` / `excerpt` / `image` / `publishedAt` / etc.** as in the article file (keep **`content`** as a short summary string for JSON-LD — can match the start of the real article).

---

### Step 4 — Add the same slug in `ArticleLayout.tsx`

**File:** **`src/components/ArticleLayout.tsx`**

1. Find the inner **`getArticleSlug`** and **`slugMap`**.

2. Add the **same** mapping:

   `9: 'ceramic-vs-wax-dubai',`

   - Slug string must **match** `Blog.tsx` and **`App.tsx`** (quotes style can differ; characters must not).

---

### Step 5 — Optional: `public/sitemap.xml`

**File:** **`public/sitemap.xml`**

1. Copy an existing **`<url>...</url>`** block for another blog post.

2. Set **`<loc>`** to:

   `https://www.grandtouchauto.ae/blog/ceramic-vs-wax-dubai`

3. Adjust **`<lastmod>`**, **`<image:loc>`** (full URL to the same image as **`article.image`**, e.g. `https://www.grandtouchauto.ae/service-ceramic.jpg`), title/caption text.

---

### Step 6 — Images (real files only)

1. Add or choose a file under **`public/`**, e.g. **`public/ceramic-vs-wax-hero.jpg`**.

2. In **`Blog.tsx`** and in the article **`.tsx`**, set:

   `image: "/ceramic-vs-wax-hero.jpg"`

3. Confirm the file is a **real image** (reasonable file size in KB+, opens in a viewer). **Do not** commit text files renamed as `.jpg` / `.png`.

4. **Do not** use **`/assets/...`** hashed paths from a build log.

---

### Step 7 — Verify

1. From project root run: **`npm run build`**

2. Locally run **`npm run dev`** (or preview) and check:

   - **`/blog`** — new card appears, image loads, order by date makes sense.
   - **`/blog/ceramic-vs-wax-dubai`** — article renders, TOC works, **Message Sean** shows at bottom.

3. Commit **`public/`** image binaries if you added new files.

---

## Part D — `article.content` string (headings, bold, lists)

Parsed by **`ArticleLayout`** → **`ArticleContent`**. Not full GitHub Markdown.

1. **Separate blocks with a blank line** (double newline). If a **`##` heading** sits in the same block as a paragraph, it may render as plain text.

2. **Headings** — line must start exactly with:

   - **`## `** → main section (appears in table of contents)
   - **`### `** → subsection  
   - **`#### `** → smaller heading  

   Single **`# `** is **not** supported.

3. **Bold / italic / links** in paragraphs and list lines:

   - **`**bold**`**
   - **`*italic*`**
   - **`[label](https://example.com)`**

4. **Bullets:** block starts with **`- `** or **`* `**; every line in that block continues with the same marker.

5. **Numbered lists:** lines start with **`1. `**, **`2. `**, etc.

6. **Do not** put raw HTML in **`content`**. **Do not** add another full contact CTA; **`ArticleLayout`** already includes Sean’s WhatsApp button.

---

## Part E — SEO (every article)

- **Unique** title, excerpt, and tags; avoid duplicating another post.
- Include **Dubai** or local context when the piece is geo-specific.
- **`publishedAt`** is a real **`YYYY-MM-DD`** date.
- Prefer **internal links** in **`content`** using markdown: `[text](/blog/other-slug)` where relevant.
- **`ArticleLayout`** sets page meta from **`title`**, **`excerpt`**, **`tags`**, **`category`**, **`image`** — keep **`excerpt`** accurate (it feeds meta description).

---

## Part F — Built-in Sean CTA

**File (implementation):** **`src/components/ArticleLayout.tsx`**

Every article using **`ArticleLayout`** gets a **Message Sean** button (WhatsApp **`971567191045`**) with prefilled text including the article title. **Do not remove** when adding posts. **Do not** duplicate in **`content`**.

---

## Part G — Do not do this

- Replace **`Blog.tsx`** with only **`blogPosts.map(...)`** inside **`<main>`**.
- Remove **`useEffect`** / **`generateBlogStructuredData`** / **`updatePageSEO('blog')`** from **`Blog.tsx`**.
- Add **`blogPosts`** without **`App.tsx`** route or without **both** slug maps.
- Reference **`/assets/...`** hashed URLs in blog data.
- Commit **fake** image files (text paths, LFS pointers, empty stubs).

---

## Part H — Quick path reference table

| What you need | Path |
|----------------|------|
| Blog listing + `blogPosts` + `getArticleSlug` | `src/pages/Blog.tsx` |
| Article page template + TOC + Sean CTA + body parser | `src/components/ArticleLayout.tsx` |
| Article body CSS | `src/components/ArticleContent.css` |
| All routes | `src/App.tsx` |
| Static images + `sitemap.xml` + `robots.txt` | `public/` |
| One component per article | `src/pages/articles/*.tsx` |

---

*Single source publishing guide for Grand Touch Auto — paths, steps, and content rules without AI-generated imagery.*
