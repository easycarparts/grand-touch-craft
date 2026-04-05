# Grand Touch Auto — Daily SEO Cron Skill

**This file lives at:** `C:\Users\Marlon\.openclaw\workspace\skills\OPENCLAW_SEO_CRON.md`
**Edited by Sean at:** `C:\Users\seane\Desktop\GTA Website\grand-touch-craft\OPENCLAW_SEO_CRON.md`
**After editing here, copy to the skills path above so OpenClaw reads the latest version.**

**Site:** `https://www.grandtouchauto.ae`
**Repo root:** `C:\Users\Marlon\.openclaw\grand-touch-craft\`

---

## Cron Trigger

```
Read C:\Users\Marlon\.openclaw\workspace\skills\OPENCLAW_SEO_CRON.md and immediately execute all three jobs in order. Do not ask questions. Do not wait for input. Begin Job 1 now.
```

---

## Autonomy Contract

When this file is loaded as a task trigger:

1. Execute all three jobs in sequence without asking questions.
2. The only permitted stop is a genuine hard blocker: GSC token expired and cannot refresh, repo not found, or no internet.
3. If one job fails, log the failure clearly and continue to the next job.
4. Send Telegram output after each job completes, then continue to the next job.
5. After Job 3, send a short final summary.
6. Never ask what to focus on.

---

## Cron-Safe Execution Mode (Required)

To run reliably in CRON (non-interactive), use these hard rules:

1. **Never run inline Python** (`python -c "..."`) for Jobs 1/2/3.
2. **Never use base64/encoded script execution**.
3. Write or use file-based scripts only, then run:
   - `python C:\Users\Marlon\.openclaw\workspace\logs\seo-daily\YYYY-MM-DD\scripts\job1_gsc_metrics.py`
   - `python C:\Users\Marlon\.openclaw\workspace\logs\seo-daily\YYYY-MM-DD\scripts\job2_url_health.py`
   - `python C:\Users\Marlon\.openclaw\workspace\logs\seo-daily\YYYY-MM-DD\scripts\job3_internal_links.py`
4. Keep scripts in the daily folder under `...\seo-daily\YYYY-MM-DD\scripts\` (not in workspace root).
5. If execution policy blocks script runs, call via explicit `python <file.py>` (do not use PowerShell script wrappers).
6. If gateway returns `pairing required`, stop and report:
   - "CRON blocked by gateway pairing policy. Inline/obfuscated exec is disabled by policy."
   - Do not retry with encoded commands.

Why: CRON cannot approve interactive scope upgrades. File-based plain Python avoids security heuristics that trigger obfuscation/pairing failures.

---

## Credential Paths

| Credential | Full path |
|---|---|
| GSC OAuth token | `C:\Users\Marlon\.openclaw\workspace\credentials\gsc_token.json` |
| GSC client secrets | `C:\Users\Marlon\.openclaw\workspace\credentials\gsc_client_secrets.json` |
| GitHub token (env var) | `$env:GITHUB_TOKEN` |
| Rolling log file (append daily) | `C:\Users\Marlon\.openclaw\workspace\logs\seo_cron_log.jsonl` |
| SEO output root | `C:\Users\Marlon\.openclaw\workspace\logs\seo-daily\` |
| Daily folder | `C:\Users\Marlon\.openclaw\workspace\logs\seo-daily\YYYY-MM-DD\` |
| Daily summary (markdown) | `C:\Users\Marlon\.openclaw\workspace\logs\seo-daily\YYYY-MM-DD\summary.md` |
| Daily summary (json) | `C:\Users\Marlon\.openclaw\workspace\logs\seo-daily\YYYY-MM-DD\summary.json` |
| Job 1 raw json | `C:\Users\Marlon\.openclaw\workspace\logs\seo-daily\YYYY-MM-DD\job1_gsc_metrics.json` |
| Job 2 raw json | `C:\Users\Marlon\.openclaw\workspace\logs\seo-daily\YYYY-MM-DD\job2_url_health.json` |
| Job 3 raw json | `C:\Users\Marlon\.openclaw\workspace\logs\seo-daily\YYYY-MM-DD\job3_internal_links.json` |

---

## Output Storage Policy (Mandatory)

All generated files must live under:

`C:\Users\Marlon\.openclaw\workspace\logs\seo-daily\YYYY-MM-DD\`

Hard rules:

1. Do not create `job1.py`, `job2.py`, `job3.py`, temp scripts, or ad-hoc files in `C:\Users\Marlon\.openclaw\workspace\` root.
2. Keep one folder per day (`YYYY-MM-DD`).
3. Write each job's raw output JSON file plus one final `summary.md` and `summary.json`.
4. Continue appending one-line telemetry to `C:\Users\Marlon\.openclaw\workspace\logs\seo_cron_log.jsonl`.
5. If folder does not exist, create it before Job 1.

Folder bootstrap:

```python
import os
from datetime import datetime
DAY = str(datetime.utcnow().date())
DAY_DIR = rf"C:\Users\Marlon\.openclaw\workspace\logs\seo-daily\{DAY}"
os.makedirs(DAY_DIR, exist_ok=True)
```

---

## One-Time GSC Setup (Do Once — Not Part of Cron)

**Note: Google Search Console API does NOT support service accounts. You must complete this OAuth flow once manually to generate a refresh token. After that, the cron runs unattended.**

### Step 1 — Google Cloud Console

1. Go to: `https://console.cloud.google.com/`
2. Create a project named `grand-touch-seo` (or select existing)
3. Go to APIs & Services → Library → search "Google Search Console API" → Enable
4. Go to APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID
5. Application type: **Desktop app**
6. Download the JSON → save to: `C:\Users\Marlon\.openclaw\workspace\credentials\gsc_client_secrets.json`

### Step 2 — Add Sean's Google Account as Owner

The Google account used must be a **verified owner** of `https://www.grandtouchauto.ae` in Search Console:

1. Go to: `https://search.google.com/search-console`
2. Confirm `https://www.grandtouchauto.ae` is present and verified
3. The Google account that owns this property is the one used for OAuth below

### Step 3 — Generate Token (Run Once in Terminal on Marlon's Machine)

Install dependency:
```bash
pip install google-auth-oauthlib google-api-python-client
```

Run this Python script once — it opens a browser for Sean to log in and approve access:

```python
import json
from google_auth_oauthlib.flow import InstalledAppFlow

SCOPES = ["https://www.googleapis.com/auth/webmasters.readonly"]
SECRETS = r"C:\Users\Marlon\.openclaw\workspace\credentials\gsc_client_secrets.json"
TOKEN   = r"C:\Users\Marlon\.openclaw\workspace\credentials\gsc_token.json"

flow  = InstalledAppFlow.from_client_secrets_file(SECRETS, SCOPES)
creds = flow.run_local_server(port=0)

with open(TOKEN, "w") as f:
    f.write(creds.to_json())

print("Token saved. Setup complete.")
```

After running, `gsc_token.json` contains a refresh token that auto-renews — no further manual steps needed.

---

## Job 1 — GSC Metrics + Striking Distance Queries

**Goal:** Pull last 7 days of performance data. Identify queries ranking positions 4–15 with >20 impressions — these are close to page 1 and should be prioritised for content updates or new articles.

**Also flag:** any query that dropped >30% clicks week-over-week.

```python
import json
from datetime import datetime, timedelta
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

TOKEN   = r"C:\Users\Marlon\.openclaw\workspace\credentials\gsc_token.json"
LOG     = r"C:\Users\Marlon\.openclaw\workspace\logs\seo_cron_log.jsonl"

creds   = Credentials.from_authorized_user_file(TOKEN)
service = build("searchconsole", "v1", credentials=creds)

# Auto-detect accessible GSC property (prevents www/non-www mismatch)
site_entries = service.sites().list().execute().get("siteEntry", [])
owner_sites = [s["siteUrl"] for s in site_entries if s.get("permissionLevel") == "siteOwner"]
all_sites = [s["siteUrl"] for s in site_entries]

# Prefer grandtouchauto property when available
preferred = [s for s in owner_sites if "grandtouchauto.ae" in s]
if preferred:
    SITE = preferred[0]
elif owner_sites:
    SITE = owner_sites[0]
elif all_sites:
    SITE = all_sites[0]
else:
    raise RuntimeError("No Search Console properties accessible with this token")

today      = datetime.utcnow().date()
end_date   = str(today - timedelta(days=1))
start_date = str(today - timedelta(days=7))
prev_start = str(today - timedelta(days=14))
prev_end   = str(today - timedelta(days=8))

def query_gsc(start, end):
    return service.searchanalytics().query(
        siteUrl=SITE,
        body={
            "startDate": start,
            "endDate": end,
            "dimensions": ["query"],
            "rowLimit": 100,
            "orderBy": [{"fieldName": "impressions", "sortOrder": "DESCENDING"}]
        }
    ).execute().get("rows", [])

current = query_gsc(start_date, end_date)
previous = query_gsc(prev_start, prev_end)

prev_map = {r["keys"][0]: r for r in previous}

striking   = []
dropped    = []
top_movers = []

for row in current:
    q          = row["keys"][0]
    clicks     = row.get("clicks", 0)
    impressions= row.get("impressions", 0)
    position   = row.get("position", 0)
    prev       = prev_map.get(q)

    if 4 <= position <= 15 and impressions >= 20:
        striking.append({"query": q, "position": round(position,1), "impressions": impressions, "clicks": clicks})

    if prev:
        prev_clicks = prev.get("clicks", 0)
        if prev_clicks > 5 and clicks < prev_clicks * 0.7:
            dropped.append({"query": q, "prev_clicks": prev_clicks, "clicks": clicks, "drop_pct": round((1 - clicks/prev_clicks)*100)})

# Log results
entry = {
    "date": str(today),
    "job": "gsc_metrics",
    "site_used": SITE,
    "owner_sites_found": owner_sites,
    "striking_distance_count": len(striking),
    "dropped_count": len(dropped),
    "striking": striking[:5],
    "dropped": dropped[:5]
}
with open(LOG, "a") as f:
    f.write(json.dumps(entry) + "\n")

# Save per-job artifact for daily folder
import os
DAY_DIR = rf"C:\Users\Marlon\.openclaw\workspace\logs\seo-daily\{today}"
os.makedirs(DAY_DIR, exist_ok=True)
with open(os.path.join(DAY_DIR, "job1_gsc_metrics.json"), "w", encoding="utf-8") as f:
    json.dump(entry, f, ensure_ascii=False, indent=2)

# Store for Telegram report
gsc_result = entry
```

**Output stored in `gsc_result` — used in final Telegram report.**

### Telegram output immediately after Job 1

```
SEO CRON • Job 1/3 complete (GSC Metrics) ✓
Date: <date>
Property used: <gsc_result.site_used>

📈 Striking distance (<pos 4-15, >20 impressions):
• "<query>" — pos <position> — <impressions> impressions

⚠️ Drops (>30% WoW):
• "<query>" — was <prev_clicks> → <clicks> (-<drop_pct>%)

Continuing to Job 2...
```

---

## Job 2 — Sitemap + URL Health Check

**Goal:** Parse `sitemap.xml`, request every `/blog/*` URL and `/ppf-dubai`. Flag any non-200 response. Alert if sitemap URLs don't match live routes.

```python
import xml.etree.ElementTree as ET
import urllib.request
import json
from datetime import datetime

SITEMAP = r"C:\Users\Marlon\.openclaw\grand-touch-craft\public\sitemap.xml"
LOG     = r"C:\Users\Marlon\.openclaw\workspace\logs\seo_cron_log.jsonl"
BASE    = "https://www.grandtouchauto.ae"

tree = ET.parse(SITEMAP)
ns   = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
urls = [loc.text for loc in tree.findall(".//sm:loc", ns)]

errors  = []
ok      = []

for url in urls:
    try:
        req  = urllib.request.Request(url, headers={"User-Agent": "OpenClaw-SEO-Bot"})
        resp = urllib.request.urlopen(req, timeout=10)
        code = resp.getcode()
        if code == 200:
            ok.append(url)
        else:
            errors.append({"url": url, "status": code})
    except Exception as e:
        errors.append({"url": url, "status": str(e)})

entry = {
    "date": str(datetime.utcnow().date()),
    "job": "url_health",
    "total_urls": len(urls),
    "ok": len(ok),
    "errors": errors
}
with open(LOG, "a") as f:
    f.write(json.dumps(entry) + "\n")

import os
day = str(datetime.utcnow().date())
DAY_DIR = rf"C:\Users\Marlon\.openclaw\workspace\logs\seo-daily\{day}"
os.makedirs(DAY_DIR, exist_ok=True)
with open(os.path.join(DAY_DIR, "job2_url_health.json"), "w", encoding="utf-8") as f:
    json.dump(entry, f, ensure_ascii=False, indent=2)

health_result = entry
```

**Output stored in `health_result` — used in final Telegram report.**

### Telegram output immediately after Job 2

```
SEO CRON • Job 2/3 complete (URL Health) ✓
Date: <date>

🔗 URL Health:
• <ok> URLs OK | <errors> errors
• <if errors, list top 5 broken URLs>

Continuing to Job 3...
```

---

## Job 3 — Internal Link Opportunity Scan

**Goal:** Check every published article's `content` string. For each article, detect if any other article's primary topic keywords are mentioned in the body but NOT already linked. Flag top 3 missing link opportunities.

```python
import re, json
from datetime import datetime

LOG = r"C:\Users\Marlon\.openclaw\workspace\logs\seo_cron_log.jsonl"

# Known articles: slug → keywords to detect in other articles' content
# Update this map after each new article is published
ARTICLE_MAP = {
    "ppf-dubai":                    ["PPF", "paint protection film", "ppf"],
    "is-ppf-worth-it-dubai":        ["worth it", "investment", "ppf worth"],
    "ppf-vs-ceramic-dubai":         ["ceramic", "ppf vs ceramic", "coating vs film"],
    "ppf-dubai-full-front-vs-full-body": ["full front", "full body", "coverage"],
    "ppf-longevity-dubai-heat":     ["longevity", "how long", "last in dubai", "heat"],
    "ceramic-coating-guide":        ["ceramic coating", "ceramic guide"],
    "paint-correction-techniques":  ["paint correction", "swirl marks", "paint defects"],
    "custom-vinyl-wraps":           ["vinyl wrap", "colour change wrap"],
}

import os, glob
articles_dir = r"C:\Users\Marlon\.openclaw\grand-touch-craft\src\pages\articles"
tsx_files    = glob.glob(os.path.join(articles_dir, "*.tsx"))

opportunities = []

for filepath in tsx_files:
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    filename = os.path.basename(filepath)

    for slug, keywords in ARTICLE_MAP.items():
        # Skip if this file IS the article we're checking links for
        slug_pascal = slug.replace("-", "").lower()
        if slug_pascal in filename.lower():
            continue

        for kw in keywords:
            # Keyword mentioned in content but not already linked
            if re.search(kw, content, re.IGNORECASE):
                link_pattern = rf'\[.*?\]\(.*?{re.escape(slug)}.*?\)'
                if not re.search(link_pattern, content, re.IGNORECASE):
                    opportunities.append({
                        "file": filename,
                        "missing_link_to": slug,
                        "trigger_keyword": kw
                    })
                    break  # one opportunity per article-slug pair

# Deduplicate and limit
seen = set()
deduped = []
for o in opportunities:
    key = (o["file"], o["missing_link_to"])
    if key not in seen:
        seen.add(key)
        deduped.append(o)

entry = {
    "date": str(datetime.utcnow().date()),
    "job": "internal_links",
    "opportunities_found": len(deduped),
    "top_opportunities": deduped[:5]
}
with open(LOG, "a") as f:
    f.write(json.dumps(entry) + "\n")

import os
day = str(datetime.utcnow().date())
DAY_DIR = rf"C:\Users\Marlon\.openclaw\workspace\logs\seo-daily\{day}"
os.makedirs(DAY_DIR, exist_ok=True)
with open(os.path.join(DAY_DIR, "job3_internal_links.json"), "w", encoding="utf-8") as f:
    json.dump(entry, f, ensure_ascii=False, indent=2)

links_result = entry
```

**Update `ARTICLE_MAP` every time a new article is published.**

Output stored in `links_result` — used in final Telegram report.

### Telegram output immediately after Job 3

```
SEO CRON • Job 3/3 complete (Internal Links) ✓
Date: <date>

🔁 Internal link gaps:
• <file> → missing link to /<slug> (keyword: "<trigger_keyword>")

Preparing final summary...
```

---

## Final Telegram Summary

Send one short summary after all three per-job messages:

```
SEO CRON ✓ COMPLETE  <date>
Jobs done: 3/3

Job 1 (GSC): <striking_distance_count> striking-distance, <dropped_count> significant drops
Job 2 (Health): <ok>/<total_urls> URLs OK, <errors> errors
Job 3 (Links): <opportunities_found> internal link opportunities

Next action:
• <one-line recommendation>
```

If all jobs pass cleanly: no action needed from Sean. If any errors or drops: Sean reviews and decides whether to act.

After sending Telegram final summary, write daily summary files:

1. `C:\Users\Marlon\.openclaw\workspace\logs\seo-daily\YYYY-MM-DD\summary.json`
2. `C:\Users\Marlon\.openclaw\workspace\logs\seo-daily\YYYY-MM-DD\summary.md`

`summary.json` template:

```json
{
  "date": "YYYY-MM-DD",
  "site_used": "<property>",
  "job1_gsc": {
    "striking_distance_count": 0,
    "dropped_count": 0,
    "top_striking": []
  },
  "job2_health": {
    "total_urls": 0,
    "ok": 0,
    "errors": []
  },
  "job3_links": {
    "opportunities_found": 0,
    "top_opportunities": []
  },
  "next_action": "<one-line recommendation>"
}
```

`summary.md` template:

```md
# SEO Daily Summary — YYYY-MM-DD

- Property used: <site_used>
- Job 1: <striking_distance_count> striking-distance, <dropped_count> significant drops
- Job 2: <ok>/<total_urls> URLs OK, <errors_count> errors
- Job 3: <opportunities_found> internal link opportunities
- Next action: <one-line recommendation>
```

---

## Log Format Reference

Each run writes:

1. Rolling line logs in `C:\Users\Marlon\.openclaw\workspace\logs\seo_cron_log.jsonl`
2. Job artifacts and daily summary in `C:\Users\Marlon\.openclaw\workspace\logs\seo-daily\YYYY-MM-DD\`

Rolling log example:

```json
{"date": "2026-04-05", "job": "gsc_metrics", "striking_distance_count": 3, ...}
{"date": "2026-04-05", "job": "url_health", "total_urls": 12, "ok": 12, "errors": []}
{"date": "2026-04-05", "job": "internal_links", "opportunities_found": 2, ...}
```

Daily folder example:

```
seo-daily/2026-04-05/
  job1_gsc_metrics.json
  job2_url_health.json
  job3_internal_links.json
  summary.json
  summary.md
```

This keeps `workspace` root clean and creates a historical record so future runs and content jobs can reference the latest summary directly.

---

## Maintenance: Update After Each New Article

After publishing a new article, update `ARTICLE_MAP` in Job 3 with:

```python
"<new-slug>": ["<primary keyword>", "<semantic variant>"],
```

Also update the published topics list in `OPENCLAW_GRAND_TOUCH.md` Section 3.
