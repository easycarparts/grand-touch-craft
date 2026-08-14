// Ask Grand Touch — website assistant, powered by Grok (xAI).
//
// Writes to the GRAND TOUCH Supabase project only: gt_assistant_conversations /
// gt_assistant_messages, and promotes a chat into public.leads the moment a
// phone number is captured so it lands in the same CRM pipeline (and Telegram
// alerting) as every funnel lead.
//
// Secrets required (set with `supabase secrets set`):
//   XAI_API_KEY                 xAI / Grok API key
//   SUPABASE_URL                (provided by the platform)
//   SUPABASE_SERVICE_ROLE_KEY   (provided by the platform)
// Optional:
//   XAI_MODEL                   defaults to grok-4.3
//   GT_ASSISTANT_ALLOWED_ORIGIN defaults to *

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { GT_FACTS, GT_JSON_HINT, GT_PERSONA } from "./persona.ts";

type JsonObject = Record<string, unknown>;

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const xaiKey = Deno.env.get("XAI_API_KEY");
const xaiModel = Deno.env.get("XAI_MODEL") ?? "grok-4.3";
// Primary brain: Claude Sonnet — same provider the EasyAuto WhatsApp GT persona
// runs on (owner decision 2026-08-13; Grok measured p50 8.6s on this prompt).
// Grok remains the fallback provider if no Anthropic key is configured.
const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
const claudeModel = Deno.env.get("GT_ASSISTANT_MODEL") ?? "claude-sonnet-5";
const allowedOrigin = Deno.env.get("GT_ASSISTANT_ALLOWED_ORIGIN") ?? "*";

if (!supabaseUrl || !serviceRoleKey) throw new Error("Missing Supabase environment variables.");

const supabase = createClient(supabaseUrl, serviceRoleKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: JsonObject, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const text = (value: unknown): string | null => {
  const v = typeof value === "string" ? value.trim() : "";
  return v && v.toLowerCase() !== "unknown" && v.toLowerCase() !== "null" ? v : null;
};

const clampScore = (value: unknown) => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.min(100, Math.round(n))) : 0;
};

/**
 * A phone is only trusted if the visitor actually typed those digits. The model
 * is instructed never to invent one, but a hallucinated number would poison the
 * CRM, so it is verified against the raw message before it is stored.
 */
/** Capture backstop: a visitor who TYPES their number is a capture even if the
 *  model's extraction misses it. Accepts UAE-shaped mobiles and long
 *  internationals; rejects short digit runs (prices, years) and our own
 *  studio number typed back at us. */
const typedPhone = (text: string): string | null => {
  const matches = text.match(/\+?\d[\d\s\-().]{7,18}\d/g);
  if (!matches) return null;
  for (const candidate of matches) {
    const digits = candidate.replace(/\D/g, "");
    if (digits.length < 9 || digits.length > 15) continue;
    if (digits.endsWith("567191045")) continue; // the studio's own number
    if (digits.length === 9 && !digits.startsWith("5")) continue;
    if (digits.length === 10 && !digits.startsWith("05")) continue;
    return candidate.trim();
  }
  return null;
};

const verifiedPhone = (claimed: unknown, userText: string): string | null => {
  const candidate = text(claimed);
  if (!candidate) return null;
  const digits = candidate.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) return null;
  const typedDigits = userText.replace(/\D/g, "");
  // the last 7 digits must appear in what they actually sent
  return typedDigits.includes(digits.slice(-7)) ? candidate : null;
};

const MAX_TURNS = 24;

/**
 * SCRIPTED OPENING (owner decision 2026-08-13): the first exchange is
 * code-owned — identical for every visitor, instant, free, and measurable.
 * The model takes over from message two with a STAGE line telling it where
 * the conversation stands. "Each flow is the same and measurable."
 */
const ENTRY_REPLIES: Record<string, { reply: string; followups: string[] }> = {
  "i need ppf": {
    reply:
      "Good call. Here's the bit nobody knows: if a valet or a car park catches your paint, that panel's film is replaced free here. For life.\nWhat's the car?",
    followups: ["Why is that free?", "What does it cost?"],
  },
  "window tint": {
    reply: "Easy. What car is it for?",
    followups: ["Just show me the tint prices"],
  },
  "just a question": {
    reply: "Go on, ask me anything. Prices, warranty, the install, all fair game.",
    followups: ["What's the warranty actually cover?", "Where are you based?"],
  },
};

const entryKey = (message: string) =>
  message.toLowerCase().replace(/[^a-z ]/g, "").trim();

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

async function callGrokOnce(model: string, system: string, history: ChatMessage[]): Promise<JsonObject> {
  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${xaiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: system }, ...history],
      response_format: { type: "json_object" },
      // Replies are chat-length by design (the persona bans walls of text);
      // a big allowance only buys waffle and latency.
      max_tokens: 500,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    const err = new Error(`xAI ${res.status}: ${detail.slice(0, 300)}`) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) throw new Error("xAI returned no content");
  try {
    return JSON.parse(content) as JsonObject;
  } catch {
    // Salvage net: the model ignored the JSON contract — a good answer beats a
    // clean schema, so keep the words and skip extraction this turn.
    if (!content.trim().startsWith("{") && content.trim().length >= 8) return { reply: content.trim() };
    throw new Error("xAI returned unparseable JSON");
  }
}

/** Retry with backoff; an unknown fast-model alias falls back to the base model. */
/**
 * Claude path. Assistant history is re-serialized AS the JSON it should have
 * produced — with prose turns in the transcript the model imitates prose and
 * breaks the contract from turn 2 (live incident 2026-07-24 on the WhatsApp
 * bot). NOTE: the old "{" assistant-prefill trick is NOT supported on the
 * Claude 5 family ("conversation must end with a user message") — JSON
 * discipline rides on the hint + JSON-shaped history + the tolerant parse.
 */
async function callClaude(system: string, history: ChatMessage[]): Promise<JsonObject> {
  // History arrives already JSON-shaped (assistant turns serialized where the
  // history is built) — no re-wrapping here or turns get double-nested.
  const messages = history;
  const delays = [0, 400, 1200];
  let lastError: unknown = null;
  for (const delay of delays) {
    if (delay) await new Promise((r) => setTimeout(r, delay));
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": anthropicKey!,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        // No temperature: deprecated on the Claude 5 family (API rejects it).
        // 1200 tokens: the JSON envelope (reply + followups + extraction
        // fields) overflowed 700 on value-stack replies and truncated mid-JSON.
        body: JSON.stringify({
          model: claudeModel,
          system,
          messages,
          max_tokens: 1200,
        }),
      });
      if (res.status === 429 || res.status >= 500) {
        lastError = new Error(`anthropic ${res.status}`);
        continue;
      }
      if (!res.ok) throw new Error(`anthropic ${res.status}: ${(await res.text()).slice(0, 300)}`);
      const data = await res.json();
      const text = (data?.content ?? [])
        .filter((b: JsonObject) => b.type === "text")
        .map((b: JsonObject) => b.text)
        .join("");
      // Tolerant parse: strip markdown fences, else extract the first JSON
      // object, else salvage the prose. A good answer beats a clean schema.
      const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
      try {
        return JSON.parse(cleaned) as JsonObject;
      } catch {
        const block = cleaned.match(/\{[\s\S]*\}/);
        if (block) {
          try {
            return JSON.parse(block[0]) as JsonObject;
          } catch { /* fall through */ }
        }
        // Truncated JSON (e.g. cut at max_tokens): pull the reply string out
        // so the visitor NEVER sees raw JSON in the bubble.
        const replyMatch = cleaned.match(/"reply"\s*:\s*"((?:[^"\\]|\\.)*)/);
        if (replyMatch) {
          try {
            return { reply: JSON.parse(`"${replyMatch[1]}"`) };
          } catch {
            return { reply: replyMatch[1].replace(/\\n/g, "\n").replace(/\\"/g, '"') };
          }
        }
        return { reply: cleaned };
      }
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError ?? new Error("anthropic call failed");
}

async function callGrok(system: string, history: ChatMessage[]): Promise<JsonObject> {
  const delays = [0, 400, 1200];
  let model = xaiModel;
  let lastError: unknown;
  for (const delay of delays) {
    if (delay) await new Promise((r) => setTimeout(r, delay));
    try {
      return await callGrokOnce(model, system, history);
    } catch (error) {
      lastError = error;
      const status = (error as { status?: number }).status;
      // Model-not-found: swap to the known-good base model and keep going.
      if (status === 404 && model !== xaiFallbackModel) {
        model = xaiFallbackModel;
        continue;
      }
      // Our-bug statuses don't get better by retrying.
      if (status && status >= 400 && status < 429 && status !== 404 && status !== 408) break;
    }
  }
  throw lastError;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!anthropicKey && !xaiKey)
    return json({ error: "Assistant is not configured (missing ANTHROPIC_API_KEY / XAI_API_KEY)." }, 503);

  let payload: JsonObject;
  try {
    payload = (await req.json()) as JsonObject;
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const sessionId = text(payload.session_id);
  if (!sessionId) return json({ error: "session_id is required" }, 400);

  // ---- history restore -------------------------------------------------
  // Called on mount so a visitor who navigates away and comes back (or opens a
  // different page) resumes the same conversation instead of starting cold.
  if (payload.load_history === true) {
    const { data: convo } = await supabase
      .from("gt_assistant_conversations")
      .select("id, phone")
      .eq("session_id", sessionId)
      .maybeSingle();
    if (!convo) return json({ messages: [], lead_captured: false });
    const { data: rows } = await supabase
      .from("gt_assistant_messages")
      .select("role, content, extracted, created_at")
      .eq("conversation_id", convo.id)
      .order("created_at", { ascending: true })
      .limit(60);
    return json({
      messages: (rows ?? []).map((m) => ({
        role: m.role,
        content: m.content,
        card: (m.extracted as JsonObject | null)?.send_card ?? null,
      })),
      lead_captured: Boolean(convo.phone),
    });
  }

  const userMessage = text(payload.message);
  if (!userMessage) return json({ error: "message is required" }, 400);
  if (userMessage.length > 2000) return json({ error: "message too long" }, 400);

  const attribution = (payload.attribution ?? {}) as JsonObject;

  // ---- conversation row -------------------------------------------------
  const { data: existing } = await supabase
    .from("gt_assistant_conversations")
    .select("*")
    .eq("session_id", sessionId)
    .maybeSingle();

  let conversation = existing;
  if (!conversation) {
    const { data: created, error } = await supabase
      .from("gt_assistant_conversations")
      .insert({
        session_id: sessionId,
        visitor_id: text(payload.visitor_id),
        page_path: text(payload.page_path),
        source_platform: text(attribution.source_platform),
        utm_source: text(attribution.utm_source),
        utm_medium: text(attribution.utm_medium),
        utm_campaign: text(attribution.utm_campaign),
        gclid: text(attribution.gclid),
        fbclid: text(attribution.fbclid),
        ttclid: text(attribution.ttclid),
      })
      .select("*")
      .single();
    if (error) return json({ error: "Could not start conversation", detail: error.message }, 500);
    conversation = created;
  }

  // ---- history ----------------------------------------------------------
  const { data: priorRows } = await supabase
    .from("gt_assistant_messages")
    .select("role, content, extracted")
    .eq("conversation_id", conversation.id)
    .order("created_at", { ascending: true })
    .limit(MAX_TURNS);

  // Assistant history is re-serialized AS the JSON it should have produced —
  // with prose assistant turns in the transcript, a model imitates the prose
  // and drifts off the JSON contract from turn 2 (live incident on the
  // WhatsApp twin, 2026-07-24). JSON-shaped history makes the contract the
  // demonstrated pattern.
  const history: ChatMessage[] = (priorRows ?? []).map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.role === "assistant" ? JSON.stringify({ reply: m.content }) : m.content,
  }));
  history.push({ role: "user", content: userMessage });

  await supabase.from("gt_assistant_messages").insert({
    conversation_id: conversation.id,
    role: "user",
    content: userMessage,
  });

  // ---- scripted opening: code answers the entry chips, not the model -----
  // Identical for every visitor, instant, free — and it makes the funnel
  // measurable: every conversation starts at the same station.
  if ((priorRows ?? []).length === 0) {
    const canned = ENTRY_REPLIES[entryKey(userMessage)];
    if (canned) {
      await supabase.from("gt_assistant_messages").insert({
        conversation_id: conversation.id,
        role: "assistant",
        content: canned.reply,
        extracted: { scripted: true, followups: canned.followups },
      });
      await supabase
        .from("gt_assistant_conversations")
        .update({
          message_count: (conversation.message_count ?? 0) + 2,
          last_message_at: new Date().toISOString(),
          service_interest:
            entryKey(userMessage) === "window tint"
              ? "tint"
              : entryKey(userMessage) === "i need ppf"
                ? "ppf"
                : conversation.service_interest,
        })
        .eq("id", conversation.id);
      return json({
        reply: canned.reply,
        followups: canned.followups,
        card: null,
        conversation_id: conversation.id,
        lead_captured: false,
        asked_for_phone: false,
        handoff_requested: false,
        scripted: true,
        stage: "opening",
      });
    }
  }

  // ---- known-so-far block, so the model never re-asks -------------------
  const known = {
    name: conversation.full_name,
    phone: conversation.phone ? "already given — never ask again" : null,
    car: [conversation.vehicle_year, conversation.vehicle_make, conversation.vehicle_model]
      .filter(Boolean)
      .join(" ") || null,
    program_interest: conversation.program_interest,
    timeline: conversation.timeline,
    usage: conversation.usage,
    possession: conversation.possession,
    buyer_focus: conversation.buyer_focus,
  };

  // ---- stage: CODE tells the model where the conversation stands, so the
  // play's acts are enforced, not remembered (the EasyAuto ladder lesson).
  const carKnown = Boolean(conversation.vehicle_make || conversation.vehicle_model);
  const priceShown = (priorRows ?? []).some(
    (m) => m.role === "assistant" && /12,900|18,900|7,900/.test(m.content),
  );
  const askedBefore = (priorRows ?? []).some(
    (m) => (m.extracted as JsonObject | null)?.asked_for_phone === true,
  );
  // Tint cross-sell state: once the word has appeared anywhere (either side),
  // the rider is spent — the rider reply itself contains "tint", so it
  // self-retires after one firing.
  const tintDiscussed =
    /tint/i.test(userMessage ?? "") || (priorRows ?? []).some((m) => /tint/i.test(m.content));
  // Machine-readable stage for the widget: it force-shows the phone field the
  // moment the funnel reaches the close, independent of whether the model
  // remembered to set asked_for_phone. Capture is code-owned, not model-owned.
  const stageKey = conversation.phone ? "captured" : priceShown ? "close" : carKnown ? "case" : "opening";
  const stage = conversation.phone
    ? "STAGE: CAPTURED — aftercare mode. No selling, no asks. Answer warmly, wrap cleanly." +
      (!conversation.full_name
        ? " One exception: their name is unknown — fold a single casual ask for a first name into this reply (who should Sean ask for?). That is the reply's only question; the tint rider waits until the name is in."
        : tintDiscussed
          ? ""
          : " One licensed exception, exactly once: THE TINT RIDER — a single line offering the windows done in the same visit, since the car is already booked in. If they pass or ignore it, never again.")
    : priceShown
      ? "STAGE: CLOSE — the price is on the table. This reply answers what they asked, then closes: one tight summary line and the ask for their number (a phone field appears under your message). No new beats unless they ask for them."
      : carKnown
        ? "STAGE: THE CASE — car known, price not yet given. One new beat per reply; the number the moment they ask, wrapped."
        : "STAGE: OPENING — get the car with a hook. Nothing else yet.";
  const askedNote =
    askedBefore && !conversation.phone
      ? " They already ignored one number ask — never repeat it in the same shape; only the close asks once more, in different words."
      : "";

  const system = [
    GT_PERSONA,
    GT_FACTS,
    `KNOWN SO FAR (never re-ask any of this): ${JSON.stringify(known)}`,
    stage + askedNote,
    conversation.phone
      ? "THEY HAVE ALREADY GIVEN THEIR NUMBER. Do not ask for it again, ever. Just be useful."
      : "You do not have their number yet. Earn it — answer well first, then ask once.",
    GT_JSON_HINT,
  ].join("\n\n");

  let parsed: JsonObject;
  try {
    parsed = anthropicKey ? await callClaude(system, history) : await callGrok(system, history);
  } catch (error) {
    console.error("gt-assistant model error", error);
    return json(
      {
        reply:
          "Sorry, I dropped the connection there. Message Sean directly on WhatsApp +971 56 719 1045 and he'll sort you out.",
        degraded: true,
      },
      200,
    );
  }

  const reply =
    text(parsed.reply) ??
    "Sorry, I didn't catch that. Ask me about the programs, the warranty, the films we use or where we are.";

  // ---- code backstops (the model owns nuance; these own the unambiguous) --
  // A visitor demanding a human is never refused; a promised human never
  // silently fails to be flagged.
  const askedHuman = /\b(sean|human|real person|actual person|someone real|an? agent|call me|talk to (a )?(person|human|someone))\b/i.test(
    userMessage,
  );
  const promisedHuman = /\bsean('?s| will| can| is going to)?\b[^.!?\n]{0,60}\b(whatsapp|message|call|reach|send|come back|contact|hold|lock)\b/i.test(
    reply,
  );
  const handoffRequested = parsed.handoff_requested === true || askedHuman || promisedHuman;

  // ---- extraction -------------------------------------------------------
  // The studio's own number typed back is never a capture, whichever path
  // extracted it — a visitor quoting our WhatsApp line must not become a lead.
  const candidatePhone = verifiedPhone(parsed.phone, userMessage) ?? typedPhone(userMessage);
  const phone =
    candidatePhone && candidatePhone.replace(/\D/g, "").endsWith("567191045") ? null : candidatePhone;
  const patch: JsonObject = {
    message_count: (conversation.message_count ?? 0) + 2,
    last_message_at: new Date().toISOString(),
    intent_score: clampScore(parsed.intent_score),
  };
  if (phone && !conversation.phone) patch.phone = phone;
  if (text(parsed.full_name) && !conversation.full_name) patch.full_name = text(parsed.full_name);
  if (text(parsed.make)) patch.vehicle_make = text(parsed.make);
  if (text(parsed.model_name)) patch.vehicle_model = text(parsed.model_name);
  if (text(parsed.year)) patch.vehicle_year = text(parsed.year);
  if (text(parsed.service_interest)) patch.service_interest = text(parsed.service_interest);
  if (text(parsed.timeline)) patch.timeline = text(parsed.timeline);

  // Qualification reads. Constrained to the allowed values so a stray model
  // string can never violate the column check and fail the whole update.
  const oneOf = (value: unknown, allowed: string[]) => {
    const v = text(value)?.toLowerCase();
    return v && allowed.includes(v) ? v : null;
  };
  const usage = oneOf(parsed.usage, ["outdoors_highway", "mixed", "garaged"]);
  const possession = oneOf(parsed.possession, ["yes", "on_order"]);
  const buyerFocus = oneOf(parsed.buyer_focus, ["price", "quality", "unsure"]);
  if (usage) patch.usage = usage;
  if (possession) patch.possession = possession;
  if (buyerFocus) patch.buyer_focus = buyerFocus;
  if (text(parsed.off_topic)) patch.off_topic = text(parsed.off_topic);
  if (handoffRequested) patch.handoff_requested = true;

  const program = text(parsed.program_interest)?.toLowerCase();
  if (program && ["essential", "signature", "concours"].includes(program)) {
    patch.program_interest = program;
  }

  await supabase.from("gt_assistant_messages").insert({
    conversation_id: conversation.id,
    role: "assistant",
    content: reply,
    extracted: parsed,
  });

  // ---- promote to a CRM lead the moment we have a number ----------------
  let leadId: string | null = conversation.lead_id ?? null;
  const capturedPhone = phone ?? conversation.phone ?? null;

  if (capturedPhone) {
    const normalized = capturedPhone.replace(/\D/g, "");
    const leadRow: JsonObject = {
      phone: capturedPhone,
      full_name: (patch.full_name as string) ?? conversation.full_name ?? null,
      vehicle_make: (patch.vehicle_make as string) ?? conversation.vehicle_make ?? null,
      vehicle_model: (patch.vehicle_model as string) ?? conversation.vehicle_model ?? null,
      vehicle_year: (patch.vehicle_year as string) ?? conversation.vehicle_year ?? null,
      primary_session_id: sessionId,
      visitor_id: conversation.visitor_id,
      funnel_name: "gt-assistant",
      landing_page_variant: conversation.page_path,
      source_platform: conversation.source_platform,
      lead_source_type: "form",
      intent_score: clampScore(parsed.intent_score),
      utm_source: conversation.utm_source,
      utm_medium: conversation.utm_medium,
      utm_campaign: conversation.utm_campaign,
      gclid: conversation.gclid,
      fbclid: conversation.fbclid,
      ttclid: conversation.ttclid,
      last_activity_at: new Date().toISOString(),
    };

    if (!leadId) {
      // Dedupe against an existing lead from the same number before inserting.
      const { data: match } = await supabase
        .from("leads")
        .select("id")
        .eq("normalized_phone", normalized)
        .maybeSingle();

      if (match?.id) {
        leadId = match.id;
        await supabase.from("leads").update(leadRow).eq("id", leadId);
      } else {
        const { data: inserted, error } = await supabase
          .from("leads")
          .insert({ ...leadRow, first_captured_at: new Date().toISOString(), submitted_at: new Date().toISOString() })
          .select("id")
          .single();
        if (error) console.error("gt-assistant lead insert failed", error);
        leadId = inserted?.id ?? null;
      }

      if (leadId) {
        patch.lead_id = leadId;
        await supabase.from("lead_events").insert({
          lead_id: leadId,
          event_name: "gt_assistant_lead_captured",
          payload: {
            session_id: sessionId,
            page_path: conversation.page_path,
            program_interest: patch.program_interest ?? conversation.program_interest ?? null,
            intent_score: clampScore(parsed.intent_score),
          },
        }).then(undefined, (e) => console.error("gt-assistant lead_event failed", e));
      }
    } else {
      await supabase.from("leads").update(leadRow).eq("id", leadId);
    }
  }

  await supabase.from("gt_assistant_conversations").update(patch).eq("id", conversation.id);

  // Only cards we actually ship as real assets. There is no "programs" card:
  // the page itself shows the programmes, and mapping that key to any other
  // image made the assistant illustrate answers with stock photos.
  // warranty_demo returns to this list the moment its PNG ships
  // (screenshot of public/wa-cards/gt-warranty-demo-card.html).
  const CARDS = new Set([
    "tint_menu",
    "tint_small",
    "tint_sedan",
    "tint_sports",
    "tint_suv",
    "handover",
    "install_prep",
    "warranty_demo",
    "signature_included",
    "film_ladder",
  ]);
  const card = CARDS.has(String(parsed.send_card ?? "")) ? String(parsed.send_card) : null;

  // Guided next questions for the widget's tap chips: short strings only,
  // capped so a rambling model can't render a wall of buttons.
  const followups = Array.isArray(parsed.followups)
    ? (parsed.followups as unknown[])
        .filter((f): f is string => typeof f === "string" && !!f.trim() && f.trim().length <= 80)
        .slice(0, 3)
    : [];

  return json({
    reply,
    followups,
    card,
    conversation_id: conversation.id,
    lead_captured: Boolean(capturedPhone),
    asked_for_phone: parsed.asked_for_phone === true,
    handoff_requested: handoffRequested,
    // Post-turn stage: a phone captured THIS turn moves the key to captured
    // (never a capture field under a capture confirmation), and a price landing
    // in THIS reply moves it to close — the field appears with the pitch, the
    // intent moment, not one turn late.
    stage: capturedPhone
      ? "captured"
      : stageKey === "close" || /12,900|18,900|7,900/.test(reply)
        ? "close"
        : stageKey,
  });
});
