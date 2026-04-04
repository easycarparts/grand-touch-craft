# OpenClaw / agent rules: blog posts and images

**Step-by-step publishing + paths:** [`OPENCLAW_PUBLISHING_PLAYBOOK.md`](./OPENCLAW_PUBLISHING_PLAYBOOK.md). Optional short prompts: [`AI_PROMPT_GUIDELINES.md`](./AI_PROMPT_GUIDELINES.md).

---

## What went wrong (PPF vs Ceramic Dubai)

The file `public/ppf-featured-ppf-vs-ceramic-dubai-option-1.png` was committed as **plain text** (~95 bytes) containing a **local path** like `MEDIA:C:\Users\...\OpenClaw\media\inbound\....jpg`. That is not PNG binary data. Browsers request `/ppf-featured-...png`, get text, and the image fails (broken icon + visible `alt` text).

**Never commit path stubs, LFS pointer mistakes, or “reference” text files with a `.png` / `.jpg` extension.**

---

## Mandatory rules for new blog images

1. **Assets live only under `public/`** (for static URLs like `/service-ppf.jpg`) **or** `src/assets/` with a Vite `import` (preferred for bundled images). Do not reference OpenClaw, Cursor, or any machine-local path in the repo.

2. **Before `git add`, verify the file is real media:**
   - **Size:** a usable hero/thumbnail JPEG/PNG/WebP is usually **at least several KB** (often 20KB+). Files under ~500 bytes are suspicious.
   - **Type:** open the file in an image viewer or run `file` / check magic bytes — it must decode as an image.
   - **Content:** opening the file in a text editor must **not** show readable paths, `version https://git-lfs.github.com/spec/v1`, or JSON — unless you intentionally use Git LFS and every collaborator has it configured.

3. **If you do not have a binary image file ready:** use an **existing** `public/` image already in the repo (e.g. `/service-ppf.jpg`, `/service-ceramic.jpg`) in `blogPosts` and `article.image`. Do not invent a new filename until the bytes exist on disk.

4. **Do not use Vite build output paths in blog JSON** (e.g. `/assets/service-ppf-DIdSoKcx.jpg`). Those hashes change every build and are not guaranteed to exist at that URL. Use **`/service-ppf.jpg`**-style paths that match files in **`public/`**.

5. **Adding a new file to `public/`:**
   - Copy the actual image into `public/your-name.jpg` (or `.png`, `.webp`).
   - Reference it as **`/your-name.jpg`** (leading slash, no `public/` in the path).
   - Commit the **binary**; confirm `git diff` / PR shows a real size increase, not a one-line text file.

6. **Keep blog structure intact** (see project conventions): full `Blog.tsx` layout, SEO `useEffect`, `slugMap` in `Blog.tsx` and `ArticleLayout.tsx`, route in `App.tsx`, optional `public/sitemap.xml` entry.

---

## Quick verification checklist (run before push)

- [ ] `src` path in `<img>` or `article.image` matches a file under `public/` **or** a valid `import` from `src/assets/`.
- [ ] File size and format are plausible for an image.
- [ ] Local dev: open `/blog` and the article — image loads with no broken icon.
- [ ] `npm run build` succeeds.

---

## Reference

- Static files: Vite serves everything in `public/` at the site root.
- Existing service photos: `public/service-*.jpg`.
