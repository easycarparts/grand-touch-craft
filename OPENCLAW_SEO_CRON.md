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
4. Send one Telegram report at the end covering all three jobs.
5. Never send partial reports mid-run. Never ask what to focus on.

---

## Credential Paths

| Credential | Full path |
|---|---|
| GSC OAuth token | `C:\Users\Marlon\.openclaw\workspace\credentials\gsc_token.json` |
| GSC client secrets | `C:\Users\Marlon\.openclaw\workspace\credentials\gsc_client_secrets.json` |
| GitHub token (env var) | `$env:GITHUB_TOKEN` |
| Log file (append daily) | `C:\Users\Marlon\.openclaw\workspace\logs\seo_cron_log.jsonl` |

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
SITE    = "https://www.grandtouchauto.ae"
LOG     = r"C:\Users\Marlon\.openclaw\workspace\logs\seo_cron_log.jsonl"

creds   = Credentials.from_authorized_user_file(TOKEN)
service = build("searchconsole", "v1", credentials=creds)

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
    "striking_distance_count": len(striking),
    "dropped_count": len(dropped),
    "striking": striking[:5],
    "dropped": dropped[:5]
}
with open(LOG, "a") as f:
    f.write(json.dumps(entry) + "\n")

# Store for Telegram report
gsc_result = entry
```

**Output stored in `gsc_result` — used in final Telegram report.**

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

health_result = entry
```

**Output stored in `health_result` — used in final Telegram report.**

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

links_result = entry
```

**Update `ARTICLE_MAP` every time a new article is published.**

Output stored in `links_result` — used in final Telegram report.

---

## Final Telegram Report

Send one message after all three jobs complete:

```
SEO CRON ✓  <date>
━━━━━━━━━━━━━━━━━━━━━━

📈 STRIKING DISTANCE (<pos 4-15, >20 impressions)
<for each in gsc_result.striking — show query, position, impressions>
• "<query>" — pos <position> — <impressions> impressions
(If none: "No new striking distance queries today")

⚠️ TRAFFIC DROPS (>30% week-over-week)
<for each in gsc_result.dropped>
• "<query>" — was <prev_clicks> clicks → now <clicks> clicks (-<drop_pct>%)
(If none: "No significant drops ✓")

🔗 URL HEALTH
• <ok> URLs OK  |  <errors> errors
<if errors: list each broken URL>

🔁 INTERNAL LINK GAPS
<for each top opportunity>
• <file> → missing link to /<missing_link_to> (keyword: "<trigger_keyword>")
(If none: "All internal links look healthy ✓")
```

If all jobs pass cleanly: no action needed from Sean. If any errors or drops: Sean reviews and decides whether to act.

---

## Log Format Reference

Each job appends one JSON line to `C:\Users\Marlon\.openclaw\workspace\logs\seo_cron_log.jsonl`:

```json
{"date": "2026-04-05", "job": "gsc_metrics", "striking_distance_count": 3, ...}
{"date": "2026-04-05", "job": "url_health", "total_urls": 12, "ok": 12, "errors": []}
{"date": "2026-04-05", "job": "internal_links", "opportunities_found": 2, ...}
```

This builds a historical record so future runs can compare trends.

---

## Maintenance: Update After Each New Article

After publishing a new article, update `ARTICLE_MAP` in Job 3 with:

```python
"<new-slug>": ["<primary keyword>", "<semantic variant>"],
```

Also update the published topics list in `OPENCLAW_GRAND_TOUCH.md` Section 3.
