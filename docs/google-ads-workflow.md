# Google Ads Workflow

This repo now includes a small read-only Google Ads toolkit so we can inspect campaign health, pull search terms, and generate optimization notes directly from Codex.

## What this setup lets us do

- Validate that your Google Ads API credentials are wired correctly.
- Pull campaign performance for a date range.
- Pull search terms for a date range.
- Surface wasted spend and likely negative keyword candidates.
- Review campaign health together in Codex with real account data.

## What this setup does not do yet

- Auto-edit campaigns, bids, ads, or keywords.
- Auto-fix Google tags in the Google Ads UI.
- Import offline conversions.
- Create or delete conversion actions.

Those are all possible next steps, but this first version is intentionally read-only.

## Step 1: Get a Google Ads developer token

1. Sign in to a Google Ads manager account.
2. Open `Admin` > `API Center`.
3. Apply for a developer token if you do not already have one.
4. Copy the token once it is available.

Official doc: [Google Ads API quick start](https://developers.google.com/google-ads/api/docs/get-started/make-first-call)

## Step 2: Create a Google Cloud project and enable the API

1. Open the Google Cloud Console.
2. Create a new project for this workflow.
3. Enable the `Google Ads API` for that project.
4. Create a service account.
5. Create a JSON key for that service account and download it.

Store the JSON somewhere private such as:

```text
secrets/google-ads-service-account.json
```

Do not commit that file to git.

## Step 3: Grant the service account access in Google Ads

1. Copy the service account email from the JSON file.
2. In Google Ads, open the manager account or client account you want this workflow to query.
3. Add that service account email as a user.
4. Give it read-only or standard access to start.

If you are querying a client account through an MCC, you will normally use:

- `GOOGLE_ADS_LOGIN_CUSTOMER_ID` = the manager account ID
- `GOOGLE_ADS_CUSTOMER_ID` = the client account ID you want to query

## Step 4: Create your local env file

Copy the template:

```powershell
Copy-Item .env.google-ads.example .env.google-ads
```

Then fill in:

- `GOOGLE_ADS_DEVELOPER_TOKEN`
- `GOOGLE_ADS_CUSTOMER_ID`
- `GOOGLE_ADS_LOGIN_CUSTOMER_ID`
- `GOOGLE_ADS_SERVICE_ACCOUNT_KEY_PATH`
- `GOOGLE_ADS_API_VERSION`

Notes:

- Use customer IDs without dashes if possible.
- `GOOGLE_ADS_LOGIN_CUSTOMER_ID` can be blank if you are querying the same account directly.
- `GOOGLE_ADS_API_VERSION` defaults to `v23`.

## Step 5: Validate the setup

Run:

```powershell
npm run ads:doctor -- --env=.env.google-ads
```

What success looks like:

- the script prints the connected customer ID
- it prints the account name, currency, and timezone
- no auth or permission errors appear

## Step 6: Pull performance data

Campaign summary:

```powershell
npm run ads:campaigns -- --env=.env.google-ads --days=7
```

Full optimization review:

```powershell
npm run ads:review -- --env=.env.google-ads --days=7
```

Optional filters:

```powershell
npm run ads:review -- --env=.env.google-ads --days=7 --campaign="Leads-Search-1"
npm run ads:review -- --env=.env.google-ads --days=14 --json
```

## How to use this with Codex

Once the env file and service account are working, you can ask things like:

- `Check my Google Ads health for the last 7 days`
- `Review wasted spend and suggest negatives`
- `Show me the highest-cost search terms with zero conversions`
- `Compare this week to the previous 7 days`
- `Should we widen keywords or tighten negatives?`

I can then run the local scripts in this repo and analyze the results with you.

## Recommended first workflow

1. Keep the campaign live with tight exact and phrase keywords.
2. Run `ads:doctor` once after credentials are set.
3. Run `ads:review` after the campaign has real impressions and clicks.
4. Add negatives before adding more positive keywords.
5. Leave write access and automation for later.

## Limitations to know

- Google Ads conversions only appear in Ads when tied to an ad click.
- Manual form submissions that do not come from a Google ad usually will not show as attributed conversions.
- This toolkit reads live account data, but it does not replace proper conversion attribution or offline lead-quality imports.

## Next stage after this is working

Once we trust the read-only reporting, we can add:

- a write-safe negative keyword helper
- offline lead quality import support
- conversion action inspection
- campaign experiment comparisons
