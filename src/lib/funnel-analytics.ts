import { supabase } from "@/lib/supabase";

export type AttributionParams = {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_term: string;
  utm_content: string;
  /** Ad platform campaign id (e.g. TikTok `__CAMPAIGN_ID__` resolved in the final URL). */
  utm_id: string;
  gclid: string;
  fbclid: string;
  ttclid: string;
};

export type FunnelTrackingContext = {
  funnelName: string;
  landingPageVariant: string;
  sourcePlatform: string;
  pathname: string;
  hash: string;
  entrySection: string;
  sessionId: string;
  visitorId: string;
  attribution: AttributionParams;
};

export type FunnelEventRecord = {
  id: string;
  timestamp: string;
  event_name: string;
  funnel_name: string;
  landing_page_variant: string;
  source_platform: string;
  pathname: string;
  hash: string;
  entry_section: string;
  session_id: string;
  visitor_id: string;
  attribution: AttributionParams;
  payload: Record<string, unknown>;
};

type LeadSnapshotInput = {
  snapshotType: "contact" | "vehicle" | "submit";
  context: FunnelTrackingContext;
  fullName?: string;
  phone?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleYear?: string;
  capturedAt?: string;
  payload?: Record<string, unknown>;
};

export const FUNNEL_EVENTS_UPDATED_EVENT = "grand-touch:funnel-events-updated";

type MetaStandardEvent = "PageView" | "Lead" | "Contact";

type TrackFunnelEventInput = {
  eventName: string;
  context: FunnelTrackingContext;
  payload?: Record<string, unknown>;
  privatePayload?: Record<string, unknown>;
  metaStandardEvent?: MetaStandardEvent;
  metaPayload?: Record<string, unknown>;
};

const FUNNEL_EVENT_STORAGE_KEY = "grand-touch-funnel-events-v1";
const FUNNEL_VISITOR_ID_STORAGE_KEY = "grand-touch-funnel-visitor-id";
const FUNNEL_SESSION_ID_STORAGE_KEY = "grand-touch-funnel-session-id";
const MAX_STORED_EVENTS = 1000;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    ttq?: {
      track?: (eventName: string, payload?: Record<string, unknown>) => void;
    };
    dataLayer?: Array<Record<string, unknown>>;
  }
}

const emptyAttribution = (): AttributionParams => ({
  utm_source: "",
  utm_medium: "",
  utm_campaign: "",
  utm_term: "",
  utm_content: "",
  utm_id: "",
  gclid: "",
  fbclid: "",
  ttclid: "",
});

const normalizeHash = (value: string) => value.replace(/^#/, "").trim();

const sanitizePayload = (payload: Record<string, unknown> = {}) =>
  Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));

const getLocalStorageRef = (): Storage | null => {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

const getSessionStorageRef = (): Storage | null => {
  if (typeof window === "undefined") return null;

  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
};

const safeParseJson = <T>(value: string | null, fallback: T): T => {
  if (!value) return fallback;

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const createTrackingId = (prefix: string) => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
};

const getOrCreateId = (storage: Storage | null, key: string, prefix: string) => {
  if (!storage) {
    return createTrackingId(prefix);
  }

  try {
    const existing = storage.getItem(key);
    if (existing) {
      return existing;
    }

    const next = createTrackingId(prefix);
    storage.setItem(key, next);
    return next;
  } catch {
    return createTrackingId(prefix);
  }
};

export const parseAttributionParams = (): AttributionParams => {
  if (typeof window === "undefined") return emptyAttribution();

  const search = new URLSearchParams(window.location.search);

  return {
    utm_source: search.get("utm_source") || "",
    utm_medium: search.get("utm_medium") || "",
    utm_campaign: search.get("utm_campaign") || "",
    utm_term: search.get("utm_term") || "",
    utm_content: search.get("utm_content") || "",
    utm_id: search.get("utm_id") || "",
    gclid: search.get("gclid") || "",
    fbclid: search.get("fbclid") || "",
    ttclid: search.get("ttclid") || "",
  };
};

export const inferSourcePlatform = (
  attribution: AttributionParams,
  fallback: string = "direct",
): string => {
  const sourceHint = `${attribution.utm_source} ${attribution.utm_medium}`.toLowerCase();

  if (attribution.gclid || sourceHint.includes("google")) return "google";
  if (attribution.fbclid || /meta|facebook|instagram/.test(sourceHint)) return "meta";
  if (attribution.ttclid || /tiktok|tik tok/.test(sourceHint)) return "tiktok";
  if (sourceHint.includes("organic")) return "organic";

  return fallback;
};

export const createFunnelTrackingContext = ({
  funnelName,
  landingPageVariant,
  defaultSourcePlatform = "direct",
}: {
  funnelName: string;
  landingPageVariant: string;
  defaultSourcePlatform?: string;
}): FunnelTrackingContext => {
  const attribution = parseAttributionParams();
  const localStorageRef = getLocalStorageRef();
  const sessionStorageRef = getSessionStorageRef();
  const hash = typeof window !== "undefined" ? window.location.hash || "" : "";

  return {
    funnelName,
    landingPageVariant,
    sourcePlatform: inferSourcePlatform(attribution, defaultSourcePlatform),
    pathname: typeof window !== "undefined" ? window.location.pathname : "",
    hash,
    entrySection: normalizeHash(hash) || "default",
    sessionId: getOrCreateId(sessionStorageRef, FUNNEL_SESSION_ID_STORAGE_KEY, "sess"),
    visitorId: getOrCreateId(localStorageRef, FUNNEL_VISITOR_ID_STORAGE_KEY, "visitor"),
    attribution,
  };
};

export const readStoredFunnelEvents = (): FunnelEventRecord[] => {
  const localStorageRef = getLocalStorageRef();
  const sessionStorageRef = getSessionStorageRef();
  let raw: string | null = null;

  try {
    raw = localStorageRef?.getItem(FUNNEL_EVENT_STORAGE_KEY) ?? null;
  } catch {
    raw = null;
  }

  if (raw === null) {
    try {
      raw = sessionStorageRef?.getItem(FUNNEL_EVENT_STORAGE_KEY) ?? null;
    } catch {
      raw = null;
    }
  }

  return safeParseJson<FunnelEventRecord[]>(raw, []);
};

const persistStoredFunnelEvents = (records: FunnelEventRecord[]) => {
  const serialized = JSON.stringify(records);
  const localStorageRef = getLocalStorageRef();
  const sessionStorageRef = getSessionStorageRef();

  try {
    localStorageRef?.setItem(FUNNEL_EVENT_STORAGE_KEY, serialized);
    return;
  } catch {
    // Fall through to sessionStorage.
  }

  try {
    sessionStorageRef?.setItem(FUNNEL_EVENT_STORAGE_KEY, serialized);
  } catch {
    // Ignore storage write failure; callers can still use vendor analytics.
  }
};

const persistFunnelEventToSupabase = async (record: FunnelEventRecord) => {
  if (!supabase) return;

  const { error } = await supabase.from("lead_events").insert({
    external_event_id: record.id,
    session_id: record.session_id,
    visitor_id: record.visitor_id,
    event_name: record.event_name,
    funnel_name: record.funnel_name,
    landing_page_variant: record.landing_page_variant,
    source_platform: record.source_platform,
    pathname: record.pathname,
    attribution: record.attribution,
    payload: record.payload,
    occurred_at: record.timestamp,
  });

  if (error) {
    if (error.code === "23505") {
      return;
    }
    console.warn("Failed to persist funnel event to Supabase", error);
  }
};

export const clearStoredFunnelEvents = () => {
  const localStorageRef = getLocalStorageRef();
  const sessionStorageRef = getSessionStorageRef();

  try {
    localStorageRef?.removeItem(FUNNEL_EVENT_STORAGE_KEY);
  } catch {
    // Ignore.
  }

  try {
    sessionStorageRef?.removeItem(FUNNEL_EVENT_STORAGE_KEY);
  } catch {
    // Ignore.
  }
};

export const resetFunnelBrowserState = () => {
  const localStorageRef = getLocalStorageRef();
  const sessionStorageRef = getSessionStorageRef();

  clearStoredFunnelEvents();

  try {
    localStorageRef?.removeItem(FUNNEL_VISITOR_ID_STORAGE_KEY);
  } catch {
    // Ignore.
  }

  try {
    sessionStorageRef?.removeItem(FUNNEL_SESSION_ID_STORAGE_KEY);
  } catch {
    // Ignore.
  }
};

export const captureLeadSnapshot = async ({
  snapshotType,
  context,
  fullName,
  phone,
  vehicleMake,
  vehicleModel,
  vehicleYear,
  capturedAt = new Date().toISOString(),
  payload = {},
}: LeadSnapshotInput) => {
  if (!supabase) return;

  const { error } = await supabase.from("lead_contact_snapshots").insert({
    session_id: context.sessionId,
    visitor_id: context.visitorId,
    snapshot_type: snapshotType,
    full_name: fullName || null,
    phone: phone || null,
    vehicle_make: vehicleMake || null,
    vehicle_model: vehicleModel || null,
    vehicle_year: vehicleYear || null,
    source_platform: context.sourcePlatform,
    landing_page_variant: context.landingPageVariant,
    funnel_name: context.funnelName,
    attribution: context.attribution,
    payload: sanitizePayload({
      entry_section: context.entrySection,
      hash: context.hash,
      ...payload,
    }),
    captured_at: capturedAt,
  });

  if (error) {
    console.warn(
      "Failed to persist lead snapshot to Supabase",
      error.message,
      error.code ?? "",
      error.details ?? "",
      { snapshotType, sessionId: context.sessionId }
    );
  }
};

export const trackFunnelEvent = ({
  eventName,
  context,
  payload = {},
  privatePayload = {},
  metaStandardEvent,
  metaPayload,
}: TrackFunnelEventInput): FunnelEventRecord => {
  const cleanPayload = sanitizePayload(payload);
  const cleanPrivatePayload = sanitizePayload(privatePayload);
  const record: FunnelEventRecord = {
    id: createTrackingId("event"),
    timestamp: new Date().toISOString(),
    event_name: eventName,
    funnel_name: context.funnelName,
    landing_page_variant: context.landingPageVariant,
    source_platform: context.sourcePlatform,
    pathname: context.pathname,
    hash: context.hash,
    entry_section: context.entrySection,
    session_id: context.sessionId,
    visitor_id: context.visitorId,
    attribution: context.attribution,
    payload: sanitizePayload({
      entry_section: context.entrySection,
      hash: context.hash,
      ...cleanPayload,
      ...cleanPrivatePayload,
    }),
  };

  if (typeof window !== "undefined") {
    const stored = readStoredFunnelEvents();
    stored.push(record);
    persistStoredFunnelEvents(stored.slice(-MAX_STORED_EVENTS));

    try {
      window.dispatchEvent(new CustomEvent(FUNNEL_EVENTS_UPDATED_EVENT, { detail: record }));
    } catch {
      // Ignore environments without CustomEvent support.
    }

    const eventPayload = sanitizePayload({
      funnel_name: context.funnelName,
      landing_page_variant: context.landingPageVariant,
      source_platform: context.sourcePlatform,
      pathname: context.pathname,
      hash: context.hash,
      entry_section: context.entrySection,
      session_id: context.sessionId,
      visitor_id: context.visitorId,
      ...context.attribution,
      ...cleanPayload,
    });

    window.dataLayer = window.dataLayer || [];
    try {
      window.dataLayer.push({
        event: eventName,
        ...eventPayload,
      });
    } catch (error) {
      console.warn("Failed to push funnel event to dataLayer", error);
    }

    if (window.gtag) {
      try {
        window.gtag("event", eventName, eventPayload);
      } catch (error) {
        console.warn("Failed to send funnel event to gtag", error);
      }
    }

    if (window.fbq) {
      const cleanMetaPayload = sanitizePayload({
        funnel_name: context.funnelName,
        landing_page_variant: context.landingPageVariant,
        source_platform: context.sourcePlatform,
        pathname: context.pathname,
        hash: context.hash,
        entry_section: context.entrySection,
        ...context.attribution,
        ...cleanPayload,
        ...metaPayload,
      });

      if (metaStandardEvent) {
        try {
          window.fbq("track", metaStandardEvent, cleanMetaPayload);
        } catch (error) {
          console.warn("Failed to send funnel event to Meta Pixel", error);
        }
      } else {
        try {
          window.fbq("trackCustom", eventName, cleanMetaPayload);
        } catch (error) {
          console.warn("Failed to send custom funnel event to Meta Pixel", error);
        }
      }
    }
  }

  void persistFunnelEventToSupabase(record);

  return record;
};
