const DEFAULT_TIKTOK_PIXEL_IDS = ["D7EDTI3C77UF89IGHIHG", "D7EFCR3C77UF89IGHL5G"];

type TikTokPixelOptions = {
  pixelIds?: string | string[];
};

type TikTokStub = Array<unknown> & {
  methods?: string[];
  setAndDefer?: (target: TikTokStub, method: string) => void;
  instance?: (pixelId: string) => TikTokStub;
  load?: (pixelId: string, options?: Record<string, unknown>) => void;
  page?: (payload?: Record<string, unknown>) => void;
  identify?: (payload?: Record<string, unknown>) => void;
  track?: (eventName: string, payload?: Record<string, unknown>) => void;
  _i?: Record<string, TikTokStub>;
  _t?: Record<string, number>;
  _o?: Record<string, Record<string, unknown>>;
};

type TikTokIdentifyInput = {
  email?: string;
  phoneNumber?: string;
  externalId?: string;
};

declare global {
  interface Window {
    TiktokAnalyticsObject?: string;
    ttq?: TikTokStub;
    __grandTouchTikTokPageTracked?: boolean;
    __grandTouchTikTokPageTrackedIds?: Record<string, boolean>;
  }
}

const normalizePixelIds = (pixelIds?: string | string[]) => {
  if (!pixelIds) return [];
  const values = Array.isArray(pixelIds) ? pixelIds : pixelIds.split(",");
  return values.map((value) => value.trim()).filter(Boolean);
};

const getPixelIds = (options: TikTokPixelOptions = {}) => {
  const explicitPixelIds = normalizePixelIds(options.pixelIds);
  if (explicitPixelIds.length) return explicitPixelIds;

  const configured = import.meta.env.VITE_TIKTOK_PIXEL_ID;
  if (!configured) return DEFAULT_TIKTOK_PIXEL_IDS;

  return normalizePixelIds(configured);
};

const ensureTikTokStub = () => {
  if (typeof window === "undefined") return null;

  window.TiktokAnalyticsObject = "ttq";
  const ttq = (window.ttq = window.ttq || ([] as unknown as TikTokStub));

  if (!ttq.methods) {
    ttq.methods = [
      "page",
      "track",
      "identify",
      "instances",
      "debug",
      "on",
      "off",
      "once",
      "ready",
      "alias",
      "group",
      "enableCookie",
      "disableCookie",
      "holdConsent",
      "revokeConsent",
      "grantConsent",
    ];

    ttq.setAndDefer = (target, method) => {
      target[method as keyof TikTokStub] = ((...args: unknown[]) => {
        target.push([method, ...args]);
      }) as TikTokStub[keyof TikTokStub];
    };

    for (const method of ttq.methods) {
      ttq.setAndDefer(ttq, method);
    }

    ttq.instance = (pixelId: string) => {
      const instance = ttq._i?.[pixelId] || ([] as unknown as TikTokStub);
      for (const method of ttq.methods || []) {
        ttq.setAndDefer?.(instance, method);
      }
      return instance;
    };

    ttq.load = (pixelId: string, options?: Record<string, unknown>) => {
      const src = "https://analytics.tiktok.com/i18n/pixel/events.js";
      ttq._i = ttq._i || {};
      ttq._t = ttq._t || {};
      ttq._o = ttq._o || {};
      ttq._i[pixelId] = ttq._i[pixelId] || ([] as unknown as TikTokStub);
      ttq._i[pixelId]._u = src as never;
      ttq._t[pixelId] = Date.now();
      ttq._o[pixelId] = options || {};

      if (!document.querySelector(`script[data-tiktok-pixel-id="${pixelId}"]`)) {
        const script = document.createElement("script");
        script.async = true;
        script.src = `${src}?sdkid=${encodeURIComponent(pixelId)}&lib=ttq`;
        script.dataset.tiktokPixelId = pixelId;
        const firstScript = document.getElementsByTagName("script")[0];
        firstScript?.parentNode?.insertBefore(script, firstScript);
      }
    };
  }

  return ttq;
};

export const initTikTokPixel = (options: TikTokPixelOptions = {}) => {
  const ttq = ensureTikTokStub();
  if (!ttq) return;

  const pixelIds = getPixelIds(options);
  for (const pixelId of pixelIds) {
    if (!ttq._t?.[pixelId]) {
      ttq.load?.(pixelId);
    }
  }

  window.__grandTouchTikTokPageTrackedIds = window.__grandTouchTikTokPageTrackedIds || {};
  let sentAnyPageView = false;
  for (const pixelId of pixelIds) {
    if (window.__grandTouchTikTokPageTrackedIds[pixelId]) continue;
    ttq.instance?.(pixelId).page?.();
    window.__grandTouchTikTokPageTrackedIds[pixelId] = true;
    sentAnyPageView = true;
  }

  if (sentAnyPageView) {
    window.__grandTouchTikTokPageTracked = true;
  } else if (!window.__grandTouchTikTokPageTracked) {
    for (const pixelId of pixelIds) {
      ttq.instance?.(pixelId).page?.();
      window.__grandTouchTikTokPageTrackedIds[pixelId] = true;
    }
    window.__grandTouchTikTokPageTracked = true;
  }
};

export const trackTikTokSubmitForm = (
  payload: Record<string, unknown>,
  options: TikTokPixelOptions = {},
) => {
  const ttq = ensureTikTokStub();
  if (!ttq) return;

  const pixelIds = getPixelIds(options);
  for (const pixelId of pixelIds) {
    if (!ttq._t?.[pixelId]) {
      ttq.load?.(pixelId);
    }
  }

  const leadPayload = cleanLeadEventPayload(payload);

  for (const pixelId of pixelIds) {
    ttq.instance?.(pixelId).track?.("SubmitForm", leadPayload);
  }
};

const sha256Hex = async (value: string) => {
  if (typeof window === "undefined" || !window.crypto?.subtle) return "";

  const encoded = new TextEncoder().encode(value);
  const digest = await window.crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

const normalizeEmailForTikTok = (value: string) => value.trim().toLowerCase();
const normalizePhoneForTikTok = (value: string) => value.replace(/\D/g, "");

export const identifyTikTokUser = async (
  input: TikTokIdentifyInput,
  options: TikTokPixelOptions = {},
) => {
  const ttq = ensureTikTokStub();
  if (!ttq) return;

  const pixelIds = getPixelIds(options);
  for (const pixelId of pixelIds) {
    if (!ttq._t?.[pixelId]) {
      ttq.load?.(pixelId);
    }
  }

  const payload: Record<string, string> = {};
  const normalizedEmail = input.email ? normalizeEmailForTikTok(input.email) : "";
  const normalizedPhone = input.phoneNumber ? normalizePhoneForTikTok(input.phoneNumber) : "";
  const normalizedExternalId = input.externalId?.trim() ?? "";

  if (normalizedEmail) payload.email = await sha256Hex(normalizedEmail);
  if (normalizedPhone) payload.phone_number = await sha256Hex(normalizedPhone);
  if (normalizedExternalId) payload.external_id = await sha256Hex(normalizedExternalId);

  if (!Object.keys(payload).length || Object.values(payload).some((value) => !value)) return;

  for (const pixelId of pixelIds) {
    ttq.instance?.(pixelId).identify?.(payload);
  }
};

export const trackTikTokEvent = (
  eventName: string,
  payload: Record<string, unknown> = {},
  options: TikTokPixelOptions = {},
) => {
  const ttq = ensureTikTokStub();
  if (!ttq) return;

  const pixelIds = getPixelIds(options);
  for (const pixelId of pixelIds) {
    if (!ttq._t?.[pixelId]) {
      ttq.load?.(pixelId);
    }
  }

  const eventPayload = shouldCleanLeadPayload(eventName) ? cleanLeadEventPayload(payload) : payload;

  for (const pixelId of pixelIds) {
    ttq.instance?.(pixelId).track?.(eventName, eventPayload);
  }
};

const shouldCleanLeadPayload = (eventName: string) =>
  ["SubmitForm", "Lead", "Contact", "ClickButton"].includes(eventName);

const cleanLeadEventPayload = (payload: Record<string, unknown>) => {
  const {
    content_type: _contentType,
    content_id: _contentId,
    content_ids: _contentIds,
    contents: _contents,
    ...leadPayload
  } = payload;

  return leadPayload;
};
