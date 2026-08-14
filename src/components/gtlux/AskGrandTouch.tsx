import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MessageCircle, Send, X } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { GT_WA } from "@/lib/gtProgram";

/**
 * "Ask Grand Touch" — the on-site assistant.
 *
 * Talks to the `gt-assistant` edge function (Grok), which owns the persona, the
 * price book and the lead capture. This component is deliberately thin: it
 * holds a session id, renders the thread, and reports capture events upward for
 * funnel tracking. It never contains a price or a claim of its own, so it can
 * never drift from gtProgram.
 *
 * Two engagement mechanics live here rather than in the model:
 *  - Typewriter reveal + a typing indicator, so a 4 second model call reads as
 *    someone composing a reply instead of a frozen box.
 *  - The number gate: after GATE_AFTER exchanges the composer is replaced by a
 *    phone field. The WhatsApp route stays open underneath it, deliberately —
 *    a visitor who will not type a number into a website will still message,
 *    and a dead end converts nobody.
 */

const SESSION_KEY = "gt-assistant-session";
/**
 * The gate is a consequence, not a timer. The assistant asks for the number
 * conversationally; only if the visitor carries on without giving one does the
 * field appear. Asking in the flow and then insisting is how a person does it —
 * a hard cut-off at message three interrupts people mid-thought and reads as a
 * paywall. IGNORES_BEFORE_GATE is how many times they may sail past the ask.
 */
const IGNORES_BEFORE_GATE = 2;
/** Backstop if the assistant somehow never asks. */
const GATE_HARD_STOP = 7;

// Openers CONTINUE the greeting's hook (the free panel-replacement story) —
// the first chip is the reply a hooked person would actually give, then the
// natural ladder. Disconnected openers read as a menu, not a conversation.
// Three simple doors. Each maps to a SCRIPTED first reply in the edge function
// (ENTRY_REPLIES) — identical for every visitor, instant, measurable. Keep the
// wording in sync with index.ts entryKey matching.
const OPENERS = [
  "I need PPF",
  "Window tint",
  "Just a question",
];

/**
 * Price cards the assistant can put into the thread. Keys match the edge function.
 *
 * ONLY genuine price cards belong here. There is deliberately no "programs" card:
 * no such image exists, and pointing the key at a blog hero meant the assistant
 * illustrated a programme comparison with a stock photo of an unrelated car. On
 * this page the carousel and comparison table already are the programmes card.
 */
const CARDS: Record<string, { src: string; alt: string }> = {
  tint_menu: { src: "/wa-cards/tint-pricing-card.png", alt: "Grand Touch window tint pricing" },
  tint_small: { src: "/wa-cards/tint-pricing-small.png", alt: "Window tint pricing — small car" },
  tint_sedan: { src: "/wa-cards/tint-pricing-sedan.png", alt: "Window tint pricing — sedan" },
  tint_sports: { src: "/wa-cards/tint-pricing-sports.png", alt: "Window tint pricing — sports car" },
  tint_suv: { src: "/wa-cards/tint-pricing-suv.png", alt: "Window tint pricing — SUV" },
  warranty_demo: { src: "/wa-cards/gt-warranty-demo.png", alt: "Specimen of the GT Owner's Warranty certificate" },
  signature_included: { src: "/wa-cards/gt-signature-included.png", alt: "GT Signature — everything included at AED 12,900" },
  film_ladder: { src: "/wa-cards/gt-film-ladder.png", alt: "The film ladder — Diamond Pro TPU and Diamond Pro X" },
  handover: { src: "/guided-sean-with-911.png", alt: "Delivery walkaround at the Grand Touch studio" },
  install_prep: { src: "/guided-install-detail.png", alt: "Paint preparation before film at Grand Touch" },
};

interface Msg {
  role: "user" | "assistant";
  content: string;
  /** Assistant messages animate in; restored/greeting ones don't. */
  animate?: boolean;
  /** Key into CARDS — renders a price card image above the bubble. */
  card?: string | null;
}

/** Dev only: a fresh session per page load, held in memory — refreshing
 *  localhost must start a clean thread, never restore yesterday's test chat.
 *  Production keeps the persistent localStorage id (cross-page resume). */
let devSessionId: string | null = null;

const sessionId = () => {
  if (typeof window === "undefined") return "ssr";
  if (import.meta.env.DEV) {
    if (!devSessionId) {
      devSessionId = `gtq_dev_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    }
    return devSessionId;
  }
  let id = window.localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = `gtq_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem(SESSION_KEY, id);
  }
  return id;
};

const GREETING =
  "Here's the thing nobody asks: scrape your car in a car park and that panel's film is replaced free here — for life. That's the level of cover I'm here to explain. Ask me anything, real prices included.";

/** Questions the placeholder types out, to show the box is alive and invite a first message. */
const PLACEHOLDER_PROMPTS = [
  "How much for a Patrol?",
  "Does the warranty cover yellowing?",
  "What film do you use?",
  "How long does it take?",
  "Where are you based?",
];

/**
 * Types a question into the placeholder, holds, deletes, moves to the next.
 * A static grey placeholder reads as a disabled field; a moving one reads as an
 * invitation. Stops for good the moment the visitor engages.
 */
const useAnimatedPlaceholder = (active: boolean) => {
  const [shown, setShown] = useState("");
  useEffect(() => {
    if (!active) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(PLACEHOLDER_PROMPTS[0]);
      return;
    }
    let idx = 0;
    let pos = 0;
    let deleting = false;
    let timer = 0;
    const tick = () => {
      const full = PLACEHOLDER_PROMPTS[idx];
      pos += deleting ? -1 : 1;
      setShown(full.slice(0, pos));
      let delay = deleting ? 28 : 52;
      if (!deleting && pos === full.length) {
        deleting = true;
        delay = 1700;
      } else if (deleting && pos === 0) {
        deleting = false;
        idx = (idx + 1) % PLACEHOLDER_PROMPTS.length;
        delay = 320;
      }
      timer = window.setTimeout(tick, delay);
    };
    timer = window.setTimeout(tick, 700);
    return () => window.clearTimeout(timer);
  }, [active]);
  return shown;
};

/** Reveals text a few characters at a time so a reply lands like it's being typed. */
const useTypewriter = (text: string, active: boolean) => {
  const [shown, setShown] = useState(active ? "" : text);
  useEffect(() => {
    if (!active) {
      setShown(text);
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(text);
      return;
    }
    let i = 0;
    setShown("");
    const step = Math.max(1, Math.round(text.length / 90));
    const timer = window.setInterval(() => {
      i += step;
      setShown(text.slice(0, i));
      if (i >= text.length) window.clearInterval(timer);
    }, 16);
    return () => window.clearInterval(timer);
  }, [text, active]);
  return shown;
};

const Bubble = ({ msg, onCardTap }: { msg: Msg; onCardTap: (card: { src: string; alt: string }) => void }) => {
  const shown = useTypewriter(msg.content, Boolean(msg.animate));
  if (msg.role === "user") {
    return (
      <div className="ml-auto max-w-[86%] rounded-2xl rounded-br-sm bg-primary/[0.14] px-4 py-2.5 text-[14px] leading-relaxed text-foreground">
        {msg.content}
      </div>
    );
  }
  const card = msg.card ? CARDS[msg.card] : null;
  return (
    <div className="mr-auto max-w-[88%] space-y-2">
      {card && (
        // A button, never a link: navigating to the raw image URL strands
        // mobile visitors on a bare PNG with no way back but browser-back,
        // which reloads the page. The lightbox keeps them in the chat.
        <button
          type="button"
          onClick={() => onCardTap(card)}
          aria-label={`View larger: ${card.alt}`}
          className="block w-full overflow-hidden rounded-xl border border-border/60 text-left"
        >
          {/* A missing asset must never show a broken frame — hide the whole card. */}
          <img
            src={card.src}
            alt={card.alt}
            loading="lazy"
            className="w-full"
            onError={(e) => {
              const wrap = e.currentTarget.parentElement;
              if (wrap) wrap.style.display = "none";
            }}
          />
        </button>
      )}
      <div className="rounded-2xl rounded-bl-sm border border-border/50 bg-white/[0.035] px-4 py-3 text-[14px] leading-relaxed text-foreground/90">
        {shown.split("\n").map((line, j) => (
          // Blank lines are real spacing in a chat, not noise — keep them so a
          // structured "what's included" answer breathes the way it was written.
          <p key={j} className={j ? (line.trim() ? "mt-2" : "mt-3") : ""}>
            {/* lightweight **bold** only — the model uses it to lead each line */}
            {line.split(/(\*\*[^*]+\*\*)/g).map((part, k) =>
              part.startsWith("**") && part.endsWith("**") ? (
                <strong key={k} className="font-semibold text-foreground">
                  {part.slice(2, -2)}
                </strong>
              ) : (
                <span key={k}>{part}</span>
              ),
            )}
          </p>
        ))}
        {shown.length < msg.content.length && (
          <span aria-hidden className="ml-0.5 inline-block h-[14px] w-[2px] animate-pulse bg-primary align-middle" />
        )}
      </div>
    </div>
  );
};

interface AskGrandTouchProps {
  /** fullscreen: fills its container edge-to-edge (parent owns size/overlay). */
  variant?: "inline" | "docked" | "fullscreen";
  className?: string;
  onLeadCaptured?: () => void;
  onFirstMessage?: () => void;
  /** Override the empty-state opener chips (page-specific questions). */
  openers?: string[];
  /** Send a message from outside (e.g. a question chip elsewhere on the page).
   *  Bump `nonce` for each send — the same text can be asked twice. The parent
   *  MUST clear it via onPromptConsumed, or a remount re-sends it. */
  prompt?: { text: string; nonce: number } | null;
  onPromptConsumed?: () => void;
  /** Suggested next questions shown after each assistant reply, so a visitor
   *  who never types still gets guided. Indexed by assistant turn (last entry
   *  repeats). The edge function's own `followups` (when present) win. */
  followupLadder?: string[][];
  /** Called after every assistant reply with what the turn contained, so the
   *  page can fire funnel/retargeting events. The widget stays pixel-free. */
  onAssistantTurn?: (turn: { reply: string; askedForPhone: boolean; leadCaptured: boolean }) => void;
  /** Post-capture WhatsApp handoff: the page supplies the prefilled href and
   *  gets the tap back for Contact tracking. Rendered once the number is in —
   *  WhatsApp is where the deal actually closes. */
  waHref?: string;
  onWhatsAppTap?: () => void;
}

const AskGrandTouch = ({
  variant = "inline",
  className = "",
  onLeadCaptured,
  onFirstMessage,
  openers,
  prompt = null,
  onPromptConsumed,
  followupLadder,
  onAssistantTurn,
  waHref,
  onWhatsAppTap,
}: AskGrandTouchProps) => {
  const [open, setOpen] = useState(variant === "inline");
  const [messages, setMessages] = useState<Msg[]>([{ role: "assistant", content: GREETING }]);
  const [input, setInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [captured, setCaptured] = useState(false);
  const [exchanges, setExchanges] = useState(0);
  const [asked, setAsked] = useState(false);
  const [ignored, setIgnored] = useState(0);
  const [touched, setTouched] = useState(false);
  const [suggested, setSuggested] = useState<string[]>([]);
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);
  const threadRef = useRef<HTMLDivElement | null>(null);
  const firstSent = useRef(false);
  const turnRef = useRef(0);

  const gated =
    !captured && ((asked && ignored >= IGNORES_BEFORE_GATE) || exchanges >= GATE_HARD_STOP);

  // Escape closes the LIGHTBOX first — capture phase, so the page's own
  // Escape-closes-the-chat listener never sees the key while a card is open.
  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setLightbox(null);
      }
    };
    window.addEventListener("keydown", onKey, { capture: true });
    return () => window.removeEventListener("keydown", onKey, { capture: true });
  }, [lightbox]);
  /** Nothing said yet and never focused — invite them in. */
  const idle = !touched && !busy && messages.length === 1 && !input;
  const animatedPlaceholder = useAnimatedPlaceholder(idle);

  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, busy, gated]);

  // When the keyboard opens the thread loses height — keep it pinned to the
  // latest message instead of leaving the visitor staring mid-history.
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const pin = () => {
      const el = threadRef.current;
      if (el) el.scrollTo({ top: el.scrollHeight });
    };
    vv.addEventListener("resize", pin);
    return () => vv.removeEventListener("resize", pin);
  }, []);

  /**
   * Restore the thread on mount. The messages already live in the DB keyed by
   * session id, so leaving the page or moving between pages resumes the same
   * conversation rather than starting cold — and the gate state comes back with
   * it, so a captured number is not re-requested.
   */
  useEffect(() => {
    let live = true;
    (async () => {
      if (!isSupabaseConfigured || !supabase) return;
      try {
        const { data } = await supabase.functions.invoke("gt-assistant", {
          body: { session_id: sessionId(), load_history: true },
        });
        const rows = (data?.messages ?? []) as { role: "user" | "assistant"; content: string; card?: string | null }[];
        if (!live || !rows.length) return;
        setMessages([
          { role: "assistant", content: GREETING },
          ...rows.map((r) => ({ role: r.role, content: r.content, card: r.card ?? null })),
        ]);
        // Count assistant turns so the gate resumes where they left it.
        setExchanges(rows.filter((r) => r.role === "assistant").length);
        if (data?.lead_captured) setCaptured(true);
        firstSent.current = true;
      } catch {
        /* a failed restore just means a fresh thread — never block the UI */
      }
    })();
    return () => {
      live = false;
    };
  }, []);

  const send = useCallback(
    async (raw: string, isPhone = false) => {
      const message = raw.trim();
      if (!message || busy) return;

      if (!firstSent.current) {
        firstSent.current = true;
        onFirstMessage?.();
      }

      setMessages((m) => [...m, { role: "user", content: message }]);
      setInput("");
      setPhoneInput("");
      setSuggested([]);
      setBusy(true);

      try {
        if (!isSupabaseConfigured || !supabase) throw new Error("not configured");
        const params = new URLSearchParams(window.location.search);
        const { data, error } = await supabase.functions.invoke("gt-assistant", {
          body: {
            session_id: sessionId(),
            message: isPhone ? `My number is ${message}` : message,
            page_path: window.location.pathname,
            visitor_id: window.localStorage.getItem("gt-visitor-id"),
            attribution: {
              utm_source: params.get("utm_source"),
              utm_medium: params.get("utm_medium"),
              utm_campaign: params.get("utm_campaign"),
              gclid: params.get("gclid"),
              fbclid: params.get("fbclid"),
            },
          },
        });
        if (error) throw error;

        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            content: data?.reply ?? "Sorry, I didn't catch that.",
            card: data?.card ?? null,
            animate: true,
          },
        ]);
        setExchanges((n) => n + 1);
        turnRef.current += 1;

        // Guided next questions: the brain's own suggestions win; the page's
        // curated ladder covers turns the brain doesn't (or an older deploy).
        const fromApi = Array.isArray(data?.followups)
          ? (data.followups as unknown[]).filter((f): f is string => typeof f === "string" && !!f.trim()).slice(0, 3)
          : [];
        const ladder =
          followupLadder && followupLadder.length
            ? followupLadder[Math.min(turnRef.current - 1, followupLadder.length - 1)]
            : [];
        setSuggested(fromApi.length ? fromApi : ladder);

        // Once the assistant has asked in-conversation, count how many times the
        // visitor carries on without answering. That, not a message count, is
        // what brings the field up.
        if (asked && !isPhone) setIgnored((n) => n + 1);
        if (data?.asked_for_phone) setAsked(true);
        // Code-owned close: the moment the funnel reaches the price, the field
        // is there — capture never depends on the model remembering to ask.
        if (data?.stage === "close") setAsked(true);

        if (data?.lead_captured && !captured) {
          setCaptured(true);
          onLeadCaptured?.();
        }

        onAssistantTurn?.({
          reply: String(data?.reply ?? ""),
          askedForPhone: Boolean(data?.asked_for_phone),
          leadCaptured: Boolean(data?.lead_captured),
        });
      } catch {
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            content:
              "Sorry, I can't reach the studio's system right now. Message Sean on WhatsApp +971 56 719 1045 and he'll answer you directly.",
            animate: true,
          },
        ]);
      } finally {
        setBusy(false);
      }
    },
    [asked, busy, captured, onFirstMessage, onLeadCaptured, followupLadder],
  );

  // External question chips (elsewhere on the page) send through here. The
  // prompt is consumed exactly once and the parent clears it — refs reset on
  // remount (HMR, conditional mounting), so the ref alone cannot be the guard.
  const lastPromptNonce = useRef(0);
  useEffect(() => {
    if (!prompt || !prompt.text || prompt.nonce === lastPromptNonce.current) return;
    lastPromptNonce.current = prompt.nonce;
    setOpen(true);
    void send(prompt.text);
    onPromptConsumed?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prompt?.nonce]);

  const panel = (
    <div
      // Mobile needs real height — header, opener chips and composer eat most of
      // a short box and the thread ends up a squashed scroll strip. Desktop can
      // be leaner because the value column sits beside it.
      className={`relative flex flex-col overflow-hidden ${
        variant === "fullscreen" ? "rounded-none md:rounded-2xl" : "rounded-2xl"
      } ${
        variant === "docked"
          ? "h-[min(620px,76vh)] w-[min(400px,92vw)]"
          : variant === "fullscreen"
            ? "h-full w-full"
            : "h-[620px] w-full md:h-[clamp(620px,76vh,780px)]"
      }`}
      // Lighter than the panel behind it: the chat has to read as a lit surface
      // sitting on the section, not another dark rectangle inside a dark one.
      style={{
        background: "linear-gradient(168deg, hsl(0 0% 17%), hsl(0 0% 11%) 55%, hsl(0 0% 12%))",
        boxShadow: "0 40px 90px -25px hsl(0 0% 0% / 0.9), 0 0 70px hsl(38 92% 58% / 0.12)",
      }}
    >
      {/* gold hairline frame — this is a feature, not a footnote */}
      <span
        aria-hidden
        className={`pointer-events-none absolute inset-0 ${
          variant === "fullscreen" ? "rounded-none md:rounded-2xl" : "rounded-2xl"
        }`}
        style={{
          padding: 1,
          background: "linear-gradient(160deg, hsl(38 92% 58% / .9), hsl(38 70% 45% / .3) 45%, hsl(38 60% 40% / .15) 75%)",
          WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
        }}
      />

      {/* header */}
      <div className="relative flex items-center gap-3 border-b border-border/50 px-5 py-4">
        <span
          aria-hidden
          className="flex h-10 w-10 items-center justify-center rounded-full text-primary-foreground"
          style={{ background: "linear-gradient(135deg, hsl(38 92% 58%), hsl(18 95% 58%))" }}
        >
          <MessageCircle className="h-[18px] w-[18px]" />
        </span>
        <div className="flex-1">
          <div className="text-[14px] font-semibold text-foreground">Ask Grand Touch</div>
          <div className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            Answering now — prices, warranty, films
          </div>
        </div>
        {variant === "docked" && (
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close the assistant"
            className="rounded-full p-1.5 text-muted-foreground transition hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* thread */}
      <div ref={threadRef} className="relative flex-1 space-y-3.5 overflow-y-auto px-5 py-5">
        {messages.map((m, i) => (
          <Bubble key={i} msg={m} onCardTap={setLightbox} />
        ))}

        {busy && (
          <div className="mr-auto flex items-center gap-2 rounded-2xl rounded-bl-sm border border-border/50 bg-white/[0.035] px-4 py-3">
            <span className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-primary/80"
                  style={{ animation: `gtq-bounce 1.1s ${i * 0.15}s infinite ease-in-out` }}
                />
              ))}
            </span>
            <span className="text-[12px] text-muted-foreground">typing…</span>
          </div>
        )}

        {messages.length === 1 && !busy && (
          <div className="flex flex-wrap gap-2 pt-1">
            {(openers ?? OPENERS).map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => send(q)}
                className="rounded-full border border-border/70 bg-white/[0.02] px-3.5 py-2 text-left text-[12.5px] text-muted-foreground transition hover:border-primary/60 hover:text-foreground"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Guided next questions — the visitor never has to compose a message
            to be walked through the story. Hidden while the number gate is up
            so the chips can't route around the capture. */}
        {messages.length > 1 && !busy && !gated && suggested.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {suggested.map((q, i) => (
              <button
                key={q}
                type="button"
                onClick={() => {
                  // A closing chip ("lock my slot", "take my number") summons
                  // the phone field instantly — zero-latency beats waiting for
                  // the model to ask back.
                  if (!captured && /\b(lock|slot|book|reserve)\b|number/i.test(q)) setAsked(true);
                  send(q);
                }}
                style={{ animationDelay: `${i * 90}ms` }}
                className="gtq-suggest rounded-full border border-primary/30 bg-primary/[0.04] px-3.5 py-2 text-left text-[12.5px] text-foreground/85 transition hover:border-primary/60 hover:text-foreground"
              >
                {q}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Post-capture handoff: the number is in, so the next best click is the
          channel deals actually close on. Page supplies the prefilled href. */}
      {captured && waHref && (
        <div className="border-t border-border/40 px-5 py-3">
          <a
            href={waHref}
            target="_blank"
            rel="noreferrer"
            onClick={() => onWhatsAppTap?.()}
            className="flex items-center justify-center gap-2 rounded-md border border-primary/50 bg-primary/[0.07] px-4 py-3 text-[13.5px] font-semibold text-foreground transition hover:border-primary"
          >
            <MessageCircle className="h-4 w-4 text-primary" />
            Continue with Sean on WhatsApp
          </a>
          <p className="mt-1.5 text-center text-[11px] text-muted-foreground">
            Your number&apos;s already with him — this just gets you there faster.
          </p>
        </div>
      )}

      {/* Soft capture row: the moment the assistant ASKS for the number, the
          field is right there — nobody should have to type a phone number into
          a chat composer. Non-blocking; the conversation stays open. */}
      {asked && !captured && !gated && (
        <div className="border-t border-border/40 px-5 py-3">
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              send(phoneInput, true);
            }}
          >
            <input
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="05X XXX XXXX"
              aria-label="Your WhatsApp number"
              className="flex-1 rounded-md border border-primary/40 bg-black/30 px-3 py-2.5 text-[14px] text-foreground outline-none transition focus:border-primary/70 placeholder:text-muted-foreground/60"
            />
            <button
              type="submit"
              disabled={busy || !phoneInput.trim()}
              className="rounded-md px-4 py-2.5 text-[13px] font-semibold text-primary-foreground disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, hsl(38 92% 58%), hsl(18 95% 58%))" }}
            >
              Send to Sean
            </button>
          </form>
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            Goes straight to Sean. No calls until you want one.
          </p>
        </div>
      )}

      {/* composer, or the number gate */}
      {gated ? (
        <div className="relative border-t border-primary/25 bg-primary/[0.05] px-5 py-4">
          <div className="text-[13px] font-semibold text-foreground">
            Let&apos;s make this real
          </div>
          <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
            Pop your number in and Sean will sort your slot and send real installs of
            similar cars. Then ask me anything else you like.
          </p>
          <form
            className="mt-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              send(phoneInput, true);
            }}
          >
            <input
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="05X XXX XXXX"
              aria-label="Your phone number"
              className="flex-1 rounded-md border border-border/70 bg-black/30 px-3 py-2.5 text-[14px] text-foreground outline-none transition focus:border-primary/60 placeholder:text-muted-foreground/60"
              disabled={busy}
            />
            <button
              type="submit"
              disabled={busy || phoneInput.replace(/\D/g, "").length < 7}
              className="rounded-md px-5 text-[13px] font-semibold text-primary-foreground transition disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, hsl(38 92% 58%), hsl(18 95% 58%))" }}
            >
              Continue
            </button>
          </form>
          <a
            href={GT_WA.general}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-block text-[11.5px] text-muted-foreground underline underline-offset-4 transition hover:text-foreground"
          >
            Or just message Sean on WhatsApp instead
          </a>
        </div>
      ) : (
        // A real, filled input. A transparent strip on a dark panel reads as a
        // disabled footer, which is exactly how this was landing.
        <form
          className="relative border-t border-border/50 px-4 py-4"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <div
            className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 transition-all ${
              idle ? "gtq-invite border-primary/55" : "border-border/70 bg-black/35"
            }`}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={() => setTouched(true)}
              placeholder={idle ? `${animatedPlaceholder}▌` : "Ask about prices, warranty, films…"}
              aria-label="Ask Grand Touch a question"
              className="flex-1 bg-transparent px-1 py-2.5 text-[14.5px] text-foreground outline-none placeholder:text-foreground/55"
              disabled={busy}
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              aria-label="Send"
              className="rounded-lg p-2.5 text-primary-foreground transition disabled:opacity-45"
              style={{ background: "linear-gradient(135deg, hsl(38 92% 58%), hsl(18 95% 58%))" }}
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            Type a question — answers are instant and come from our published prices
          </p>
        </form>
      )}

      {/* Card lightbox — portaled above everything (including the page's chat
          close button) so one tap anywhere, the X, or Escape returns to the
          conversation exactly as it was. Never a navigation. */}
      {lightbox &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
            role="dialog"
            aria-label={lightbox.alt}
            onClick={() => setLightbox(null)}
          >
            <button
              type="button"
              aria-label="Close image"
              onClick={() => setLightbox(null)}
              className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border border-border/70 bg-black/60 text-foreground"
              style={{ marginTop: "env(safe-area-inset-top, 0px)" }}
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={lightbox.src}
              alt={lightbox.alt}
              className="max-h-[86vh] max-w-full rounded-xl border border-border/50 object-contain"
            />
            <p className="pointer-events-none absolute bottom-5 left-0 right-0 text-center text-[12px] text-white/60">
              Tap anywhere to go back to the chat
            </p>
          </div>,
          document.body,
        )}

      <style>{`
        @keyframes gtq-bounce{0%,80%,100%{transform:translateY(0);opacity:.5}40%{transform:translateY(-4px);opacity:1}}
        .gtq-suggest{animation:gtq-suggest-in .4s cubic-bezier(.22,1,.36,1) both}
        @keyframes gtq-suggest-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
        @media (prefers-reduced-motion: reduce){.gtq-suggest{animation:none}}
        /* Until the visitor engages, the composer breathes gold so it reads as
           the live part of the panel rather than a disabled footer. */
        /* Until the visitor engages, the input breathes gold so it reads as the
           live part of the panel rather than a disabled footer. */
        @keyframes gtq-invite{
          0%,100%{box-shadow:0 0 0 0 hsl(38 92% 58% / .32), inset 0 0 18px -10px hsl(38 92% 58% / .5)}
          50%    {box-shadow:0 0 0 5px hsl(38 92% 58% / 0), inset 0 0 22px -6px hsl(38 92% 58% / .8)}
        }
        .gtq-invite{
          background:linear-gradient(180deg, hsl(38 92% 58% / .09), hsl(0 0% 0% / .35));
          animation:gtq-invite 2.4s ease-in-out infinite;
        }
        @media (prefers-reduced-motion:reduce){ .gtq-invite{animation:none} }
      `}</style>
    </div>
  );

  if (variant === "inline") return <div className={className}>{panel}</div>;

  // Fullscreen: the parent owns the overlay and sizing; this fills it.
  if (variant === "fullscreen") return <div className={`min-h-0 ${className}`}>{panel}</div>;

  return (
    <div className={`fixed bottom-24 right-5 z-[60] md:bottom-6 ${className}`}>
      {open ? (
        panel
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-2.5 rounded-full border border-primary/40 px-5 py-3.5 text-[13px] font-semibold text-foreground shadow-lg transition hover:border-primary"
          style={{ background: "linear-gradient(165deg, hsl(0 0% 12%), hsl(0 0% 8%))" }}
        >
          <MessageCircle className="h-4 w-4 text-primary" />
          Ask Grand Touch
        </button>
      )}
    </div>
  );
};

export default AskGrandTouch;
