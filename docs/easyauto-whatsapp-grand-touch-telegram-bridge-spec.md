# EasyAuto WhatsApp to Grand Touch CRM and Telegram Bridge

Status: proposed

Owner: Grand Touch Auto

Date: 3 August 2026 (Dubai)

## 1. Objective

Move every EasyAuto WhatsApp conversation into the Grand Touch sales system without sharing database credentials or requiring Hamza to create leads manually.

The integration must:

- create a Grand Touch CRM record as soon as the first inbound WhatsApp message arrives;
- update that same record as the bot learns more;
- alert Hamza only when human action is useful;
- preserve the full customer/bot transcript in the CRM;
- keep Telegram concise and actionable;
- prevent job seekers, ghosts, duplicates, and retries from becoming Meta leads;
- send Meta quality feedback only after commercial qualification.

## 2. Non-goals

- No direct EasyAuto-to-Grand-Touch database connection.
- No EasyAuto access to the Grand Touch Supabase service-role key.
- No complete transcript mirrored message-by-message into Telegram.
- No unofficial WhatsApp group automation.
- No Meta `Lead` event on conversation start.

## 3. Recommended Architecture

```text
EasyAuto WhatsApp bot
  -> signed HTTPS event
Grand Touch easyauto-lead-intake Edge Function
  -> event ledger + lead/conversation upsert
  -> transcript message storage
  -> CRM alert queue
Grand Touch Telegram Lead Agent
  -> one editable Telegram card per lead
  -> urgent replies for actionable transitions
Hamza actions
  -> Telegram callback
  -> Grand Touch CRM update
```

EasyAuto sends events to a narrowly scoped Grand Touch intake endpoint. It does not query Grand Touch data and does not receive any database credentials.

## 4. Event Contract

Every request uses a versioned envelope:

```json
{
  "schema_version": 1,
  "event_id": "easyauto:wamid.ABC123:price_quoted",
  "event_type": "price_quoted",
  "occurred_at": "2026-08-03T14:34:00+04:00",
  "source": "easyauto_whatsapp_gt_studio",
  "conversation": {
    "external_conversation_id": "wa-conversation-123",
    "whatsapp_id": "971501234567",
    "phone": "+971501234567"
  },
  "lead": {
    "name": "Ahmed",
    "vehicle_make": "Jetour",
    "vehicle_model": "G700",
    "vehicle_year": 2026,
    "service": "full_body_ppf",
    "delivery_status": "delivered",
    "expected_delivery_at": null,
    "package": "signature_10_year",
    "quoted_price": 10490,
    "currency": "AED",
    "campaign_name": "Protect Your G700 Before Delivery",
    "ad_name": "G700 delivery protection"
  },
  "state": {
    "bot_stage": "quoted",
    "quality": "commercial",
    "human_requested": false,
    "customer_accepted": false,
    "quiet_since": null
  },
  "message": null
}
```

`event_id` is unique and idempotent. A retried event must update nothing twice.

## 5. Supported Events

| Event | CRM effect | Telegram effect | Meta effect |
|---|---|---|---|
| `conversation_started` | Create `new`, `unreviewed` lead and conversation | Create silent lead card | None |
| `customer_message` | Store transcript message; update last activity | No message by default | None |
| `bot_message` | Store transcript message; update last activity | No message by default | None |
| `customer_engaged` | Set bot stage to engaged | Edit lead card silently | None |
| `vehicle_identified` | Update vehicle fields | Edit lead card silently | None |
| `delivery_status_identified` | Store delivered/on-order state and ETA | Edit lead card silently | None |
| `off_topic_detected` | Set status `junk`; persist reason | Edit card to Filtered; no ping | None |
| `price_quoted` | Set status `quoted`; store package and price | Notify Hamza and edit card | Queue Meta `Lead` if qualification rules pass |
| `human_requested` | Set high quality and urgent action | Immediate urgent ping | Qualified feedback if eligible |
| `customer_accepted` | Persist acceptance; prevent timeout closure | Immediate urgent ping | Qualified feedback if eligible |
| `conversation_stalled` | Store stall stage and quiet timestamp | Silent edit before quote | None |
| `quoted_followup_due` | Create follow-up task | Amber actionable ping | None |
| `handoff_offered` | Persist handoff offered timestamp | Edit card | None |
| `handoff_claimed` | Assign owner and persist response timestamp | Edit card and acknowledge owner | None |
| `appointment_booked` | Persist appointment/follow-up | Notify group | Queue Meta `Schedule` |
| `job_won` | Set status `won`; store value | Notify group | Queue Meta `Purchase` |
| `job_lost` | Set status `lost`; store reason | Edit card | No positive event |

## 6. Qualification Rule

A Meta `Lead` is created only when all required conditions are true:

- not a job seeker, supplier, or obvious off-topic contact;
- genuine automotive service intent;
- vehicle identified with credible details;
- Dubai/UAE serviceability confirmed or reasonably inferred;
- price/package delivered or explicit human request received;
- matchable phone/WhatsApp ID available.

`conversation_started`, prefilled ad messages, bot opener replies, and WhatsApp clicks are never Meta leads.

## 7. CRM Identity and Deduplication

- Person identity: normalized WhatsApp phone/`wa_id`.
- Conversation identity: EasyAuto `external_conversation_id`.
- Event identity: immutable `event_id`.
- A returning phone updates the existing open lead and creates a new conversation record.
- A different vehicle/service can be represented as a new opportunity linked to the same person if required later.
- Never attach one conversation to another phone using time-only matching.

The existing Grand Touch `leads` row remains the current commercial state. Bot-specific progression belongs in an additive conversation-state record or import metadata so it does not overload the existing CRM status enum.

## 8. Transcript Design

Full transcripts are valuable for sales context, bot QA, missed-accept detection, objections, and attribution. They should be stored in Grand Touch Supabase, not streamed into Telegram.

Store one row per message with:

- external message ID;
- conversation and lead IDs;
- direction: customer or bot;
- sender type;
- text body;
- message type;
- media metadata, if present;
- sent/received timestamp;
- bot stage before and after;
- source payload with sensitive tokens removed.

Telegram shows only:

- an AI-generated factual summary;
- the latest customer message when action is required;
- the quoted package and price;
- a secure `View transcript` link to the Grand Touch admin lead page.

Do not place full transcripts, identity documents, customer images, access tokens, or raw advertising click identifiers into Telegram.

Media syncing is phase two. Initially store message metadata and a safe reference; do not copy large media across projects until retention and access rules are agreed.

## 9. Telegram Experience

Use the existing private Telegram group, preferably with a dedicated topic/thread named `WhatsApp Leads`.

Create exactly one primary Telegram card per lead. Store its `chat_id`, `message_thread_id`, and `message_id` so later state changes edit the existing card instead of producing another standalone notification.

Example card:

```text
QUALIFIED PPF LEAD

Ahmed - +971 50 123 4567
Jetour G700 - Full-body PPF
Signature 10-year - AED 10,490
Timing: Ready this month
Source: Meta - G700 delivery campaign

Latest: "Yes, please ask Hamza to call me."
Status: Unclaimed
```

Inline actions:

- `Take lead`
- `Open WhatsApp`
- `Mark contacted`
- `Book appointment`
- `Mark junk`
- `View transcript`

Button actions update Grand Touch Supabase first, then edit the Telegram card. Telegram is a sales interface, not the system of record.

## 10. Notification Policy

Silent card creation/edit:

- conversation started;
- ordinary customer/bot messages;
- vehicle captured;
- delivery status captured;
- pre-quote stall;
- bot nudge sent;
- job seeker filtered.

Normal notification:

- qualified price delivered;
- delivery-pending prospect with a credible ETA;
- quoted follow-up becomes due;
- appointment booked;
- lead won.

Urgent notification:

- asks for Hamza, a human, or a call;
- accepts the package;
- expresses frustration with the bot;
- bot cannot complete a requested handoff.

If an urgent lead is unclaimed after three minutes during working hours, ping Hamza again. If still unclaimed after ten minutes, escalate to Sean. Escalations stop as soon as the lead is claimed.

## 11. Telegram Command Set

Keep commands short and operational:

- `/today` - qualified, unclaimed, follow-up due, booked, and won counts;
- `/unclaimed` - current actionable leads without an owner;
- `/followups` - due and overdue follow-ups;
- `/lead <phone-or-reference>` - find a lead;
- `/health` - intake, queue, and Telegram delivery health.

Ordinary group messages must not be parsed as leads. Only signed EasyAuto webhook events create or update CRM data.

## 12. Security

- Sign the raw request body with HMAC-SHA256 using a dedicated shared secret.
- Include a request timestamp and reject requests older than five minutes.
- Verify the signature before parsing or writing data.
- Rate-limit the intake endpoint by source.
- Keep both Supabase service-role keys private to their own projects.
- Use RLS for transcript tables and admin-only transcript access.
- Log validation failures without logging secrets or complete message content.
- Keep the Telegram group private and limit membership to authorised sales/admin users.

## 13. Reliability

- EasyAuto retries failed webhook deliveries with exponential backoff.
- Grand Touch acknowledges only after the event ledger write succeeds.
- Event processing is idempotent by `event_id`.
- Telegram delivery failure never rolls back the CRM update.
- Failed Telegram alerts remain in `crm_alert_queue` for retry.
- A reconciliation endpoint/report compares EasyAuto event counts with Grand Touch imported counts by day.

## 14. Current-System Changes Required

1. Add `easyauto-lead-intake` Edge Function in Grand Touch.
2. Add an external event ledger and WhatsApp transcript/conversation storage.
3. Extend the CRM alert queue with WhatsApp lifecycle alert types.
4. Add Telegram lead-card identity storage.
5. Refactor Telegram formatting into one lead-card renderer.
6. Add Telegram callback-query handling for inline actions.
7. Add transcript display/linking to the admin lead view.
8. Add one outbound signed-webhook publisher to EasyAuto.
9. Connect qualified, booked, and won states to the existing Meta feedback queue.

The current `telegram-crm-alerts` function sends standalone messages and handles commands, but it does not yet consume lead lifecycle events, edit existing lead cards, or process inline action callbacks.

## 15. Delivery Phases

### Phase 1 - Visibility and CRM intake

- Signed event endpoint.
- Immediate lead creation.
- State updates and deduplication.
- One Telegram lead card.
- Qualified and urgent notifications.
- Open WhatsApp and Take Lead buttons.

### Phase 2 - Transcript and workflow

- Complete text transcript storage.
- Admin transcript view.
- Telegram summary and latest-message excerpt.
- Contacted, booked, and junk callbacks.
- Follow-up tasks and escalation timers.

### Phase 3 - Advertising feedback and reporting

- Meta Lead/Schedule/Purchase feedback.
- Source/ad attribution preservation.
- Channel-level qualified CPL and booked-job reporting.
- Daily import reconciliation and health alerts.

## 16. Acceptance Criteria

- Every first inbound EasyAuto WhatsApp conversation appears in Grand Touch CRM within 10 seconds.
- The same conversation never creates duplicate leads or Telegram cards.
- A job seeker is marked junk and never sends a Meta lead event.
- A quoted prospect notifies Hamza and includes vehicle, package, price, phone, source, and latest customer message.
- A human request or acceptance reaches Hamza within 10 seconds.
- Taking a lead in Telegram assigns it in Grand Touch CRM.
- Full text transcript is viewable from the Grand Touch lead record.
- Telegram contains no message-by-message transcript flood.
- EasyAuto and Grand Touch retain separate Supabase credentials and ownership.
- Failed webhook or Telegram deliveries are visible and retryable.

