# Meta Feedback Dispatch Setup

This is the phase 1 send-back loop for Meta.

What it does:

- sends only positive CRM signals back to Meta
- `qualified_lead` -> sent as Meta `Lead`
- `won_job` -> sent as Meta `Purchase`
- if a quoted amount exists on the lead, `won_job` includes the value in AED
- negative signals are intentionally not sent in phase 1

## What is already built

- CRM queues feedback rows in `ad_platform_feedback`
- `supabase/functions/meta-feedback-dispatch` sends pending rows to Meta
- a database trigger auto-calls the function when a positive Meta feedback row is created

## Secrets you need

Add these Supabase function secrets:

- `META_DATASET_ID`
- `META_CONVERSIONS_ACCESS_TOKEN`
- optional: `META_TEST_EVENT_CODE`

`META_APP_SECRET` is already reused for `appsecret_proof`.

## How to get the Dataset ID

1. Open Meta Events Manager.
2. Click the data source / dataset you want to use for CRM feedback.
3. Open `Settings`.
4. Copy the Dataset ID.

If you are unsure which one to use, start with the dataset already connected to your lead flow. In this project, the previously seen dataset was:

- `665277526426486`

## How to get the Conversions API access token

1. Open Meta Events Manager.
2. Select the same dataset.
3. Open `Settings`.
4. Find `Conversions API`.
5. Click `Generate access token` if there is not one already.
6. Copy that token.

This token is different from the Page lead retrieval token used for webhook intake.

## Recommended first test

1. Set `META_DATASET_ID`.
2. Set `META_CONVERSIONS_ACCESS_TOKEN`.
3. Optionally set `META_TEST_EVENT_CODE` if you want events to appear in Meta test mode first.
4. Mark a Meta-originated lead as `qualified` in the CRM.
5. Check the corresponding `ad_platform_feedback` row:
   - `pending` -> waiting / dispatching
   - `sent` -> accepted by Meta
   - `failed` -> inspect `response_payload`

## Phase 1 behavior

- `qualified_lead` is sent
- `won_job` is sent
- `lost_job` is not sent
- `disqualified_lead` is not sent

This keeps the initial feedback loop simple and lowers the risk of training Meta on noisy negative outcomes before the CRM workflow is consistent.
