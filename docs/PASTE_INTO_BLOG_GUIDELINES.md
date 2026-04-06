# Paste this block into `blog-guidelines.md`

Add the section below (e.g. after **OPERATING MODE** or at the top of **BUILD MODE**) so WRITE and BUILD always agree on **where the real site code lives**.

---

## Copy from here ↓

```markdown
## Grand Touch Auto — website repository (mandatory reference)

**BUILD MODE and any repo edit MUST use this clone only:**

- **OpenClaw / automation (Marlon):** `C:\Users\Marlon\.openclaw\grand-touch-craft`
- **Publishing playbook on disk (source of truth):** `C:\Users\Marlon\.openclaw\grand-touch-craft\docs\OPENCLAW_PUBLISHING_PLAYBOOK.md`

**Rules:**

1. After approval (`APPROVED: [slug]`), perform all git/npm/file changes **only** under `C:\Users\Marlon\.openclaw\grand-touch-craft` (the folder that contains `package.json`, `src/`, `public/`).
2. **Do not** implement articles in `review_queue`, in `skills/` alone, or in a second copy of the repo unless that copy is explicitly the same path above.
3. If you maintain a copy of `OPENCLAW_PUBLISHING_PLAYBOOK.md` under `skills/` or elsewhere, **refresh it from** `...\grand-touch-craft\docs\OPENCLAW_PUBLISHING_PLAYBOOK.md` after each pull from GitHub so instructions stay in sync.
4. Relative paths in the playbook (`src/pages/...`, `public/...`) are always relative to **`grand-touch-craft`** root above.
```

---

## Copy ends here ↑

After pasting, save `blog-guidelines.md` in your OpenClaw workspace so agents always see the absolute path before BUILD MODE.
