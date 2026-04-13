const DEFAULT_TIKTOK_PIXEL_IDS = ["D7EDTI3C77UF89IGHIHG", "D7EFCR3C77UF89IGHL5G"];

type TikTokStub = Array<unknown> & {
  methods?: string[];
  setAndDefer?: (target: TikTokStub, method: string) => void;
  instance?: (pixelId: string) => TikTokStub;
  load?: (pixelId: string, options?: Record<string, unknown>) => void;
  page?: (payload?: Record<string, unknown>) => void;
  track?: (eventName: string, payload?: Record<string, unknown>) => void;
  _i?: Record<string, TikTokStub>;
  _t?: Record<string, number>;
  _o?: Record<string, Record<string, unknown>>;
};

declare global {
  interface Window {
    TiktokAnalyticsObject?: string;
    ttq?: TikTokStub;
    __grandTouchTikTokPageTracked?: boolean;
  }
}

const getPixelIds = () => {
  const configured = import.meta.env.VITE_TIKTOK_PIXEL_ID;
  if (!configured) return DEFAULT_TIKTOK_PIXEL_IDS;

  return configured
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
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

export const initTikTokPixel = () => {
  const ttq = ensureTikTokStub();
  if (!ttq) return;

  const pixelIds = getPixelIds();
  for (const pixelId of pixelIds) {
    if (!ttq._t?.[pixelId]) {
      ttq.load?.(pixelId);
    }
  }

  if (!window.__grandTouchTikTokPageTracked) {
    for (const pixelId of pixelIds) {
      ttq.instance?.(pixelId).page?.();
    }
    window.__grandTouchTikTokPageTracked = true;
  }
};

export const trackTikTokSubmitForm = (payload: Record<string, unknown>) => {
  const ttq = ensureTikTokStub();
  if (!ttq) return;

  const pixelIds = getPixelIds();
  for (const pixelId of pixelIds) {
    if (!ttq._t?.[pixelId]) {
      ttq.load?.(pixelId);
    }
  }

  for (const pixelId of pixelIds) {
    ttq.instance?.(pixelId).track?.("SubmitForm", payload);
  }
};
