import { supabase } from "@/lib/supabase";

export type FunnelSessionExclusion = {
  sessionId: string;
  landingPageVariant: string;
  pathname: string;
};

const FUNNEL_SESSION_EXCLUSIONS_STORAGE_KEY = "gta_funnel_session_exclusions";

const getLocalStorageRef = (): Storage | null => {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage;
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

export const getSessionExclusionKey = ({
  sessionId,
  landingPageVariant,
  pathname,
}: FunnelSessionExclusion) => [sessionId, landingPageVariant, pathname].join("::");

export const normalizeSessionExclusion = (row: Record<string, unknown>): FunnelSessionExclusion => ({
  sessionId: String(row.session_id || row.sessionId || ""),
  landingPageVariant: String(row.landing_page_variant || row.landingPageVariant || ""),
  pathname: String(row.pathname || ""),
});

export const readStoredSessionExclusions = (): FunnelSessionExclusion[] => {
  const raw = getLocalStorageRef()?.getItem(FUNNEL_SESSION_EXCLUSIONS_STORAGE_KEY) ?? null;
  const parsed = safeParseJson<Array<Record<string, unknown>>>(raw, []);
  return parsed.map(normalizeSessionExclusion).filter((row) => row.sessionId);
};

const persistStoredSessionExclusions = (exclusions: FunnelSessionExclusion[]) => {
  try {
    getLocalStorageRef()?.setItem(FUNNEL_SESSION_EXCLUSIONS_STORAGE_KEY, JSON.stringify(exclusions));
  } catch {
    // Ignore storage failures.
  }
};

export const addStoredSessionExclusion = (exclusion: FunnelSessionExclusion) => {
  const next = readStoredSessionExclusions();
  const key = getSessionExclusionKey(exclusion);
  if (next.some((row) => getSessionExclusionKey(row) === key)) return next;
  const updated = [...next, exclusion];
  persistStoredSessionExclusions(updated);
  return updated;
};

export const isSessionScopeExcluded = (
  scope: {
    sessionId?: string;
    landingPageVariant?: string;
    pathname?: string;
  },
  exclusions: FunnelSessionExclusion[],
) => {
  if (!scope.sessionId || !exclusions.length) return false;

  return exclusions.some(
    (exclusion) =>
      exclusion.sessionId === scope.sessionId &&
      exclusion.landingPageVariant === String(scope.landingPageVariant || "") &&
      exclusion.pathname === String(scope.pathname || ""),
  );
};

export const isEventRecordExcluded = (
  record: {
    session_id: string;
    landing_page_variant: string;
    pathname: string;
  },
  exclusions: FunnelSessionExclusion[],
) =>
  isSessionScopeExcluded(
    {
      sessionId: record.session_id,
      landingPageVariant: record.landing_page_variant,
      pathname: record.pathname,
    },
    exclusions,
  );

export const loadFunnelSessionExclusions = async (): Promise<FunnelSessionExclusion[]> => {
  if (!supabase) {
    return readStoredSessionExclusions();
  }

  const { data, error } = await supabase
    .from("funnel_session_exclusions")
    .select("session_id, landing_page_variant, pathname")
    .order("created_at", { ascending: false })
    .limit(5000);

  if (error) {
    console.warn("Failed to load funnel session exclusions from Supabase", error);
    return readStoredSessionExclusions();
  }

  return ((data ?? []) as Array<Record<string, unknown>>)
    .map(normalizeSessionExclusion)
    .filter((row) => row.sessionId);
};

export const excludeFunnelSessionFromReporting = async (
  exclusion: FunnelSessionExclusion,
): Promise<FunnelSessionExclusion[]> => {
  if (!supabase) {
    return addStoredSessionExclusion(exclusion);
  }

  const { error } = await supabase.from("funnel_session_exclusions").upsert(
    {
      session_id: exclusion.sessionId,
      landing_page_variant: exclusion.landingPageVariant,
      pathname: exclusion.pathname,
      reason: "hidden_from_reporting",
    },
    { onConflict: "session_id,landing_page_variant,pathname" },
  );

  if (error) {
    // During local testing, the table or RLS policies might not exist yet on remote.
    // In that case, fall back to browser-local exclusions so hiding still works.
    console.warn(
      "Failed to persist funnel session exclusion to Supabase; falling back to local storage",
      error,
    );
    return addStoredSessionExclusion(exclusion);
  }

  addStoredSessionExclusion(exclusion);
  return loadFunnelSessionExclusions();
};
