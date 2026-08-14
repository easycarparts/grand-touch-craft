# EasyAuto Repository Handoff: WhatsApp Lead Publisher

Use this document as the implementation brief for the EasyAuto repository.

## Confirmed Telegram context

- Group display name: `GTx EA`
- Grand Touch bot display name: `GrandTouch Lead Agent`
- EasyAuto bot display name: `EasyAutoae`
- Current screenshot state: both bots show `has no access to messages`

The display names are not Telegram `@usernames`; use the bot profile or BotFather to obtain those where code needs an allowlisted sender identity.

The preferred signed-webhook architecture does not require either bot to read the other bot's Telegram messages. Telegram remains a human-facing notification surface.

If `GTx EA` is temporarily used as a bot-to-bot transport during migration, complete all of the following first:

1. Open `@BotFather` and launch its bot-management Mini App.
2. Enable **Bot-to-Bot Communication Mode** for both `GrandTouch Lead Agent` and `EasyAutoae`.
3. Disable **Group Privacy Mode** for `GrandTouch Lead Agent`.
4. Make `GrandTouch Lead Agent` an administrator of `GTx EA` with only the minimum message permissions required.
5. Remove and re-add the bot if Telegram requires that after changing privacy mode.
6. Allowlist the exact Telegram user ID of `EasyAutoae`; ignore all other bot senders.
7. Deduplicate every imported message and never reply automatically to another bot message, preventing loops.

Even with these settings, structured HTTPS events remain the production integration. Do not make formatted Telegram text the only copy of lead data.

## Copy/paste prompt for the EasyAuto coding agent

```text
Implement a one-way EasyAuto WhatsApp lead lifecycle publisher for Grand Touch Auto.

Read the EasyAuto repository first. Locate the WhatsApp webhook, gt_studio persona state, qualification logic, quote/package delivery, silence timers, handoff logic, Telegram notifications, and existing wa_conversations/message persistence. Preserve existing customer-facing behaviour unless this brief explicitly changes it.

Objective

Every Grand Touch WhatsApp conversation handled by EasyAuto must be represented in the Grand Touch CRM automatically. EasyAuto and Grand Touch must remain separate Supabase projects. Do not share service-role keys and do not query or write directly to the Grand Touch database.

EasyAuto must send signed HTTPS lifecycle events to a Grand Touch Edge Function. Grand Touch will own CRM state, Meta conversion feedback, and the final Telegram sales card. EasyAuto is the authoritative source for WhatsApp messages and bot progression only.

Required implementation

1. Add a durable outbound event publisher for persona `gt_studio` only.
2. Emit the lifecycle events defined below on meaningful state transitions, not on every model inference.
3. Emit customer and bot transcript messages with stable external message IDs.
4. Sign each raw JSON request with HMAC-SHA256 and include a timestamp header.
5. Retry transient failures with exponential backoff and retain failed deliveries for replay.
6. Make delivery idempotent using a deterministic `event_id`.
7. Never block the WhatsApp response path while waiting for Grand Touch; queue delivery asynchronously.
8. Never send credentials, internal prompts, model reasoning, access tokens, or complete raw provider webhook payloads.
9. Keep existing Telegram alerts behind a feature flag during migration. The target state is that Grand Touch sends Telegram cards, preventing duplicate bot notifications.
10. Add tests for duplicates, out-of-order delivery, retries, job seekers, ghosts, price quotes, human requests, customer acceptance, quiet quoted leads, and returning phone numbers.

Configuration

- `GT_LEAD_WEBHOOK_URL`
- `GT_LEAD_WEBHOOK_SECRET`
- `GT_LEAD_WEBHOOK_ENABLED`
- `GT_TELEGRAM_DIRECT_ALERTS_ENABLED` for temporary legacy alerts only

Do not store these values in source control.

Event envelope

{
  "schema_version": 1,
  "event_id": "easyauto:{external_conversation_id}:{event_type}:{stable_source_id}",
  "event_type": "price_quoted",
  "occurred_at": "2026-08-03T14:34:00+04:00",
  "source": "easyauto_whatsapp_gt_studio",
  "conversation": {
    "external_conversation_id": "stable EasyAuto conversation UUID",
    "whatsapp_id": "normalized wa_id",
    "phone": "+971..."
  },
  "lead": {
    "name": null,
    "vehicle_make": "Jetour",
    "vehicle_model": "G700",
    "vehicle_year": 2026,
    "service": "full_body_ppf",
    "delivery_status": "delivered",
    "expected_delivery_at": null,
    "package": "signature_10_year",
    "quoted_price": 10490,
    "currency": "AED",
    "buyer_focus": "quality",
    "campaign_name": "Protect Your G700 Before Delivery",
    "adset_name": null,
    "ad_name": null,
    "fbclid": null,
    "fbc": null,
    "fbp": null
  },
  "state": {
    "bot_stage": "quoted",
    "quality": "commercial",
    "off_topic_kind": null,
    "human_requested": false,
    "customer_accepted": false,
    "handoff_offered": false,
    "quiet_since": null,
    "qualification_reasons": ["service_intent", "vehicle_identified", "price_delivered"]
  },
  "message": null
}

Required lifecycle events

- `conversation_started`
- `customer_engaged`
- `vehicle_identified`
- `delivery_status_identified`
- `off_topic_detected`
- `price_quoted`
- `human_requested`
- `customer_accepted`
- `conversation_stalled`
- `quoted_followup_due`
- `handoff_offered`
- `handoff_claimed`
- `appointment_booked`
- `job_won`
- `job_lost`
- `customer_message`
- `bot_message`

Transcript events

For `customer_message` and `bot_message`, populate:

{
  "message": {
    "external_message_id": "wamid or stable generated ID",
    "direction": "customer_to_business",
    "sender_type": "customer",
    "message_type": "text",
    "text": "Customer-visible text only",
    "media": null,
    "reply_to_external_message_id": null,
    "sent_at": "2026-08-03T14:34:00+04:00",
    "bot_stage_before": "vehicle_known",
    "bot_stage_after": "quoted"
  }
}

Do not include internal system prompts, hidden tool output, chain-of-thought, provider credentials, or unrelated EasyAuto customer data.

State rules

- Emit `conversation_started` on the first inbound customer message, including an ad prefill. This creates visibility but is not a Meta lead.
- Emit `customer_engaged` only after the customer answers the bot beyond the initial prefill.
- Persist and emit `off_topic_detected` with a structured kind such as `job_seeker`, `supplier`, `wrong_business`, or `other`.
- Emit `price_quoted` every time a new package/price combination is put on the table, with a stable quote ID so retries deduplicate.
- Emit `human_requested` for any request for Hamza, Sean, a person, a call, or non-bot contact.
- Emit `customer_accepted` for yes/okay/book-it/proceed language after a quote. The detection must include deterministic backstops for `hamza`, `human`, `call me`, and explicit acceptance after a quote.
- A human request or acceptance must cancel automatic timeout closure and trigger handoff immediately.
- Emit `conversation_stalled` when the configured silence timer closes or pauses the conversation, including the stage where it stalled.
- Emit `quoted_followup_due` for a quoted genuine prospect requiring the next-day follow-up.
- Include expected delivery date/month for on-order vehicles.

Reliability and security

- Header `X-GT-Timestamp`: Unix seconds.
- Header `X-GT-Signature`: `sha256=<hex HMAC of timestamp + "." + raw body>`.
- Rejecting or failing delivery must not lose the event.
- Use an outbox table or the repository's established durable job pattern.
- Retry 5xx/network failures; do not endlessly retry permanent 4xx validation failures.
- Preserve event ordering where practical, but include `occurred_at` so Grand Touch can handle delayed events safely.
- Log event ID, type, attempt count, status, and error. Do not log full transcripts or secrets in normal application logs.

Qualification data

The payload must allow Grand Touch to distinguish:

- job seeker/noise;
- opener ghost;
- engaged real prospect;
- vehicle identified;
- car delivered versus on order;
- price delivered;
- price objection;
- customer accepted;
- human requested;
- handoff offered and claimed;
- booked and won.

Do not label a conversation `qualified` merely because it started. Commercial qualification requires a genuine service enquiry, credible vehicle information, UAE/Dubai serviceability, matchable phone/wa_id, and either a delivered quote or explicit human request.

Telegram migration rule

The preferred production path is:

EasyAuto event -> Grand Touch webhook -> Grand Touch CRM -> Grand Touch Telegram Lead Agent.

Do not add a second permanent Telegram notification for the same event. Keep EasyAuto direct Telegram messages enabled only while the Grand Touch bridge is being verified, then disable them through `GT_TELEGRAM_DIRECT_ALERTS_ENABLED=false`.

Interim EasyAuto Telegram format

If legacy EasyAuto Telegram alerts must remain temporarily, enforce one compact message per conversation and edit it as state changes. Never send a new standalone message for every update.

Initial, silent:

🟡 NEW WHATSAPP · QUALIFYING
+971 50 123 4567
Source: Meta · G700 delivery campaign
Started: 3:42 PM Dubai
Status: Waiting for vehicle
Ref: GT-WA-A7K2

Quoted, normal notification:

🟢 QUOTED PPF LEAD
Ahmed · +971 50 123 4567
2026 Jetour G700 · Full-body PPF
Signature 10-year · AED 10,490
Timing: Ready this month
Latest: “Is pickup included?”
Status: Unclaimed
Ref: GT-WA-A7K2

Human requested/accepted, urgent:

🔴 HUMAN NEEDED NOW
Ahmed · +971 50 123 4567
2026 Jetour G700 · Full-body PPF
Quoted AED 10,490
Customer: “Yes, ask Hamza to call me.”
Reason: Accepted quote and requested Hamza
Ref: GT-WA-A7K2

Do not print missing rows such as `Name: N/A`, `Email: No email`, `Estimate: Not provided`, or `Notes: No notes`. Omit the field completely.

Do not put complete transcripts in Telegram. Include only the latest actionable customer message and a concise factual summary. Grand Touch will provide the secure full-transcript link.

Output requirements

- List every file changed.
- Describe the event/outbox schema and retry behaviour.
- Provide the exact environment variables required.
- Provide sample payloads for conversation start, job seeker, quote, human request, quiet quoted lead, and transcript message.
- Run the repository's relevant unit/integration tests.
- Do not deploy, rotate secrets, alter the Grand Touch repository, or enable production delivery without Sean's explicit approval.
```

## Why this format is required

The current Grand Touch Telegram queue demonstrates several notification problems:

- a lead and its automatically created follow-up arrive as separate messages seconds apart;
- missing names appear as `N/A` or the raw phone number becomes the title;
- empty values such as `No notes` add visual noise;
- partial-lead alerts omit service, intent, quote, urgency, and latest customer message;
- no stable Telegram card identity exists for editing the original alert;
- messages report database activity rather than telling Hamza what to do next.

The publisher contract gives Grand Touch enough structured data to render one evolving commercial lead card instead of a stream of database notifications.

## Integration ownership

EasyAuto owns:

- WhatsApp provider webhooks;
- customer/bot message capture;
- bot-stage detection;
- lifecycle event publication;
- retry/outbox delivery.

Grand Touch owns:

- CRM lead and conversation records;
- transcript presentation;
- Telegram cards and sales actions;
- Hamza assignment and response SLA;
- Meta qualified/booked/won feedback;
- sales reporting.

Shared only:

- versioned event schema;
- scoped HMAC webhook secret;
- stable EasyAuto conversation, message, quote, and event IDs.
