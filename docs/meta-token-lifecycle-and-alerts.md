# Meta Token Lifecycle And Alerts

Last updated: `2026-04-13` (Asia/Dubai)

This note explains why Meta lead intake stopped working, what kind of token is being used right now, what can make it expire, and what alerts/logs now exist to catch it faster next time.

## What Actually Broke

Meta lead intake failed because the `META_ACCESS_TOKEN` stored in Supabase expired.

When that happened:

- Meta could still create leads in Leads Center
- the webhook function could still receive a webhook request
- but the function could no longer fetch the real lead payload from Graph
- so the lead never got inserted into `public.leads`
- and no Telegram new-lead alert fired because no CRM lead row was created

The live function returned a Meta Graph error like:

```json
{
  "error": {
    "message": "Error validating access token: Session has expired ...",
    "type": "OAuthException",
    "code": 190,
    "error_subcode": 463
  }
}
```

## Important Distinction

This issue was **not** caused by the Meta pixel swap in `index.html`.

- Meta lead webhook retrieval uses:
  - `GTS-2` app
  - Page webhook subscription
  - `META_ACCESS_TOKEN`
- Website pixel / Conversions API feedback uses:
  - website pixel / dataset `2842874119378140`

These are related Meta systems, but they are not the same credential flow.

## What Token Is Being Used Right Now

Current live intake is using a Page-related Meta token stored as:

- `META_ACCESS_TOKEN`

In practice, the flow used during setup has been:

1. Generate a user token in Graph API Explorer
2. Use `/me/accounts` to retrieve the Page token for `Grand Touch Studio`
3. Store the resulting token in Supabase

That works, but it is not the most durable production setup.

## Why It Expired

Most likely reasons:

- the original token came from a user/session-based Graph Explorer flow
- user/session-based tokens are not as durable as a proper server credential flow
- Meta can invalidate them when:
  - the session expires
  - permissions change
  - the user reauth flow changes
  - the app/page authorization state changes

## Does A Page Token Last Longer?

Usually, yes, a real Page token derived from the correct flow is better than pasting a raw user token into production.

But the important nuance is:

- a Page token derived from a temporary or user-bound token can still eventually stop working
- so the issue is not just "Page token vs User token"
- it is also about how that token was generated and what it depends on

## Best Practical Setup Direction

### Short-term workable setup

Use:

1. a valid user token with the required permissions
2. derive the `Grand Touch Studio` Page token from `/me/accounts`
3. store the Page token in Supabase as `META_ACCESS_TOKEN`

### Better long-term production setup

Move away from ad-hoc Graph Explorer token generation and use a more durable server-side/business-managed token flow if Meta permissions and business setup allow it.

That is the direction to explore if token churn continues.

## Required Permissions For Recovery / Subscription Work

When reauthorizing tokens for this project, we used:

- `pages_show_list`
- `pages_read_engagement`
- `leads_retrieval`
- `business_management`

For Page subscription management work, this was also needed:

- `pages_manage_metadata`

## What Alerts Exist Now

The Meta lead intake function now sends a Telegram warning when it detects token expiry.

Current behavior:

- if Meta returns a token-expiry style error during automatic webhook processing
- the function logs the failure in `source_sync_runs`
- it also sends a Telegram warning saying the Meta lead intake token expired
- alert delivery is deduped so it does not spam repeatedly within a short window

Current dedupe rule:

- one token-expiry Telegram alert max per 6 hours

## What Logs Exist Now

### Sync log table

The main audit trail is:

- `public.source_sync_runs`

Meta lead intake writes rows here with:

- `provider = meta`
- `source_kind = webhook` or `manual_retry`
- `status = received | processed | failed`
- `external_id = leadgen_id`
- `error_message`
- request and response payloads

### Where to look when it breaks

If Meta intake stops again:

1. Check Telegram for the token-expiry warning
2. Check `source_sync_runs` for recent `meta` failures
3. Check whether the lead can still be manually retried
4. Check whether the Page is still subscribed to `leadgen`

## Recovery Steps If It Happens Again

### 1. Generate a fresh token

In Graph API Explorer:

1. Select app `GTS-2`
2. Generate a user token with the permissions listed above
3. Run:

```text
/me/accounts?fields=id,name,access_token
```

4. Find `Grand Touch Studio`
5. Copy the `access_token`

That returned token is the one used to repair the live intake secret.

### 2. Update Supabase secret

Replace:

- `META_ACCESS_TOKEN`

### 3. Re-check page subscription if automatic delivery still fails

If automatic intake still does not resume, restore the page subscription:

```text
POST /815039368367475/subscribed_apps?subscribed_fields=leadgen
```

This requires a true Page token, not a plain user token.

### 4. Test both paths

Test:

- Meta Lead Ads Testing Tool automatic delivery
- manual retry against the deployed function

If manual retry works but automatic delivery does not, the problem is the Page subscription layer, not the CRM insert path.

## What Was Proven During Debugging

These facts were confirmed live:

- manual retry worked once the token was refreshed
- signed webhook simulation against the deployed function worked
- automatic intake failure was traced to either:
  - expired token
  - missing Page `leadgen` subscription

Both had to be corrected.

## Relevant Files

- [C:\Users\seane\Desktop\GTA Website\grand-touch-craft\supabase\functions\meta-lead-intake\index.ts](C:\Users\seane\Desktop\GTA Website\grand-touch-craft\supabase\functions\meta-lead-intake\index.ts)
- [C:\Users\seane\Desktop\GTA Website\grand-touch-craft\docs\meta-lead-intake.md](C:\Users\seane\Desktop\GTA Website\grand-touch-craft\docs\meta-lead-intake.md)
- [C:\Users\seane\Desktop\GTA Website\grand-touch-craft\docs\session-handoff-2026-04-12.md](C:\Users\seane\Desktop\GTA Website\grand-touch-craft\docs\session-handoff-2026-04-12.md)
