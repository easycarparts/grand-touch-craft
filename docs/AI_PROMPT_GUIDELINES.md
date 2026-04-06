# AI prompt guidelines — Grand Touch Auto (Vite + React blog)

**Single step-by-step guide (WRITE vs BUILD, images in `public/`, SEO):** [`OPENCLAW_PUBLISHING_PLAYBOOK.md`](./OPENCLAW_PUBLISHING_PLAYBOOK.md) — includes **site repo root** for OpenClaw: `C:\Users\Marlon\.openclaw\grand-touch-craft`. **Paste into `blog-guidelines.md`:** [`PASTE_INTO_BLOG_GUIDELINES.md`](./PASTE_INTO_BLOG_GUIDELINES.md).

This file keeps shorter copy-paste blocks only.

---

## 1. Copy-paste: core rules (short system-style prompt)

```
You are editing grand-touch-craft: a Vite + React + React Router SPA (NOT Next.js).

Blog / content rules:
- NEVER replace src/pages/Blog.tsx with a minimal list-only layout. It MUST keep: hero, Featured Article section, category row, Latest Articles grid, Footer, WhatsAppButton, and the useEffect that calls updatePageSEO('blog') and injects generateBlogStructuredData JSON-LD.
- blogPosts is a module-level array. To add a post, APPEND an entry with the same shape as existing posts (id, title, excerpt, content, author, publishedAt, readTime, category, image, featured). Set publishedAt as ISO date YYYY-MM-DD — the UI sorts newest-first automatically for non-featured posts.
- getArticleSlug in Blog.tsx MUST use a template literal for fallbacks: `article-${id}` inside backticks, never the string 'article-${id}'.

Every new article route requires ALL of:
1) New page under src/pages/articles/*.tsx using ArticleLayout (copy CeramicCoatingGuide.tsx or IsPpfWorthItDubai.tsx pattern).
2) Route in src/App.tsx: path /blog/<slug> above the * catch-all.
3) slugMap entry in Blog.tsx getArticleSlug (id → slug string).
4) Matching slugMap entry in src/components/ArticleLayout.tsx getArticleSlug.
5) Optional: public/sitemap.xml <url> + image:image for https://www.grandtouchauto.ae

Images:
- Blog card and article.image MUST use URLs that exist at runtime: /filename.ext matching a file in public/ (e.g. /service-ppf.jpg).
- NEVER use Vite build output paths like /assets/service-ppf-HASH.jpg — hashes change every build.
- NEVER commit a .png/.jpg that is actually text (local paths like MEDIA:C:\..., Git LFS pointers, etc.). Verify file size is many KB+ and opens as a real image.
- If no custom image exists yet, reuse an existing public/ photo (service-*.jpg) until a real binary is added.

Article body string: separate blocks with blank lines; use ## / ### / #### for headings (see playbook §4). **bold** and lists work; do not duplicate contact CTAs — ArticleLayout adds “Message Sean” on WhatsApp.
- author must be "Sean, Grand Touch Auto" on new posts.

Do not remove unrelated SEO, prerender, or vercel routing without explicit instruction.
```

---

## 2. Copy-paste: “add a new blog article” checklist

```
Task: Add blog article "<TITLE>" slug "<slug>" id <N>.

Checklist (complete every item):
[ ] Create src/pages/articles/<PascalCase>.tsx with ArticleLayout, article object (id N, tags, content as markdown-style ## sections), relatedArticles.
[ ] App.tsx: import component + <Route path="/blog/<slug>" element={...} />
[ ] Blog.tsx: add N: "<slug>" to getArticleSlug slugMap; append full post to blogPosts with correct publishedAt, image path under public/
[ ] ArticleLayout.tsx: add N: '<slug>' to inner slugMap
[ ] public/sitemap.xml: add url block for https://www.grandtouchauto.ae/blog/<slug> if other articles are listed
[ ] Run npm run build; confirm /blog loads and the new card image is not broken
[ ] Git: new image files must be binary (check file size), not 1-line text stubs
```

---

## 3. Images — detailed rules

| Do | Don’t |
|----|--------|
| Put files in `public/` and reference `/name.jpg` | Put only a path string or OpenClaw `MEDIA:C:\...` inside a file named `.png` |
| Reuse `public/service-ppf.jpg`, `service-ceramic.jpg`, etc. as placeholders | Copy `/assets/...-HASH.jpg` from dist or devtools |
| After adding an image, open `/blog` and the article URL | Assume a filename works without verifying bytes on disk |

**Custom / AI-generated heroes:** save real PNG/JPEG/WebP into `public/` (e.g. `blog-hero-my-topic.png`), reference `/blog-hero-my-topic.png`, commit the full binary. Large files (~1MB+) work but consider compression/WebP for performance later.

---

## 4. Lessons learned (real bugs from this project)

1. **Stub “PNG”:** A file committed as `public/ppf-featured-....png` contained one line pointing at a local OpenClaw path → broken images everywhere that path was used.
2. **Hashed asset URL:** `Blog.tsx` used `/assets/service-ppf-DIdSoKcx.jpg` → works only for one build; wrong in dev and after rebuild.
3. **Blog page gutted:** `Blog.tsx` was reduced to a bare `map()` → lost SEO, layout, and most posts.
4. **Missing route:** New article in `blogPosts` but no `Route` → 404 on “Read more”.

---

## 5. Repo map (where to edit)

| What | Where |
|------|--------|
| Blog index UI + `blogPosts` + listing sort (newest first) | `src/pages/Blog.tsx` |
| Single article layout + SEO for article pages | `src/components/ArticleLayout.tsx` |
| Routes | `src/App.tsx` |
| Article page content | `src/pages/articles/*.tsx` |
| Static images | `public/*` |
| Sitemap | `public/sitemap.xml` |
| Robots | `public/robots.txt` |
| Per-route prerender / canonical base | `scripts/prerender.js`, `index.html` |
| Domain / default SEO strings | `src/lib/seo.ts` |

---

## 6. Optional: one-liner reminder for agents

> Extend only: new `articles/*.tsx`, `App.tsx` route, `slugMap` in `Blog.tsx` + `ArticleLayout.tsx`, `blogPosts` entry, real files in `public/`, optional `sitemap.xml`. Never simplify `Blog.tsx` or commit non-binary images.

---

*For image-specific pitfalls only, see also `OPENCLAW_BLOG_AND_ASSETS.md` (overlap is intentional for short reference).*
