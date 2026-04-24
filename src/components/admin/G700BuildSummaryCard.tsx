import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { LeadTaskLead } from "@/lib/admin-lead-tasks";
import { formatCurrency } from "@/lib/admin-lead-tasks";
import { supabase } from "@/lib/supabase";

type G700AccessoryEntry = {
  title: string;
  price: number | null;
};

type G700SnapshotPayload = {
  configured?: boolean;
  color_id?: string | null;
  color_label?: string | null;
  color_swatch?: string | null;
  finish?: string | null;
  trim_package?: string | null;
  trim_label?: string | null;
  build_summary?: string | null;
  build_from_price?: number | null;
  accessories?: G700AccessoryEntry[] | null;
  accessories_count?: number | null;
  accessories_subtotal?: number | null;
  accessories_price_on_request_count?: number | null;
  include_build_in_total?: boolean | null;
  grand_total?: number | null;
  estimate_value?: number | null;
};

type LoadedSnapshot = {
  snapshotType: string;
  capturedAt: string;
  payload: G700SnapshotPayload;
};

type Props = {
  lead: Pick<LeadTaskLead, "id" | "phone" | "funnel_name" | "landing_page_variant" | "primary_session_id" | "visitor_id">;
};

const G700_FUNNEL_NAME = "g700_customizer";
const G700_LANDING_PAGE_VARIANT = "g700-customizer";

const isG700Lead = (
  lead: Pick<LeadTaskLead, "funnel_name" | "landing_page_variant">,
) =>
  lead.funnel_name === G700_FUNNEL_NAME ||
  lead.landing_page_variant === G700_LANDING_PAGE_VARIANT;

const normalizePhone = (value: string | null | undefined): string => {
  if (!value) return "";
  return value.replace(/\D+/g, "");
};

const formatFinishLabel = (value: string | null | undefined) => {
  if (!value) return null;
  return value.charAt(0).toUpperCase() + value.slice(1);
};

export const G700BuildSummaryCard = ({ lead }: Props) => {
  const [snapshot, setSnapshot] = useState<LoadedSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const shouldRender = useMemo(() => isG700Lead(lead), [lead]);

  useEffect(() => {
    if (!shouldRender) return;
    if (!supabase) {
      setLoadError("Supabase not configured");
      return;
    }

    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const normalized = normalizePhone(lead.phone);

        const { data, error } = await supabase
          .from("lead_contact_snapshots")
          .select("snapshot_type, captured_at, payload, phone, session_id, visitor_id, funnel_name")
          .eq("funnel_name", G700_FUNNEL_NAME)
          .order("captured_at", { ascending: false })
          .limit(50);
        if (error) throw error;

        const match = (data ?? []).find((row: Record<string, unknown>) => {
          const rowPhone = normalizePhone(row.phone as string | null);
          if (normalized && rowPhone && rowPhone.slice(-8) === normalized.slice(-8)) {
            return true;
          }
          if (lead.primary_session_id && row.session_id === lead.primary_session_id) {
            return true;
          }
          if (lead.visitor_id && row.visitor_id === lead.visitor_id) {
            return true;
          }
          return false;
        });

        if (cancelled) return;

        if (!match) {
          setSnapshot(null);
          return;
        }

        setSnapshot({
          snapshotType: (match.snapshot_type as string) ?? "submit",
          capturedAt: (match.captured_at as string) ?? "",
          payload: (match.payload as G700SnapshotPayload) ?? {},
        });
      } catch (caught) {
        if (cancelled) return;
        const message = caught instanceof Error ? caught.message : String(caught);
        setLoadError(message);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [lead.phone, lead.primary_session_id, lead.visitor_id, shouldRender]);

  if (!shouldRender) return null;

  const payload = snapshot?.payload ?? {};
  const accessories = Array.isArray(payload.accessories) ? payload.accessories : [];
  const buildFromPrice = payload.build_from_price ?? null;
  const accessoriesSubtotal = payload.accessories_subtotal ?? null;
  const includeBuildInTotal = payload.include_build_in_total !== false;
  const grandTotal =
    payload.grand_total ??
    (buildFromPrice !== null && accessoriesSubtotal !== null
      ? (includeBuildInTotal ? buildFromPrice : 0) + accessoriesSubtotal
      : null);

  return (
    <Card className="border-primary/20 bg-[linear-gradient(180deg,rgba(247,181,43,0.08),rgba(12,12,12,0.25))] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-amber-200/80">G700 Build</p>
          <p className="mt-0.5 text-xs text-slate-400">
            Captured from /g700-customizer {snapshot?.capturedAt ? `· ${new Date(snapshot.capturedAt).toLocaleString()}` : ""}
          </p>
        </div>
        <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
          Jetour G700
        </Badge>
      </div>

      {isLoading ? (
        <p className="mt-4 text-sm text-slate-400">Loading build selection…</p>
      ) : loadError ? (
        <p className="mt-4 text-sm text-rose-300">Could not load build ({loadError})</p>
      ) : !snapshot ? (
        <p className="mt-4 text-sm text-slate-400">
          No build selection captured yet. Lead came in before completing the configurator.
        </p>
      ) : (
        <>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-black/30 p-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Colour</p>
              <div className="mt-1.5 flex items-center gap-2">
                {payload.color_swatch ? (
                  <span
                    className="inline-block h-5 w-5 rounded-full border border-white/20"
                    style={{ backgroundColor: payload.color_swatch }}
                  />
                ) : null}
                <p className="text-sm font-semibold text-white">
                  {payload.color_label ?? payload.color_id ?? "Not selected"}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/30 p-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Finish</p>
              <p className="mt-1.5 text-sm font-semibold text-white">
                {formatFinishLabel(payload.finish) ?? "Not selected"}
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/30 p-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Trim package</p>
              <p className="mt-1.5 text-sm font-semibold text-white">
                {payload.trim_label ?? payload.trim_package ?? "Not selected"}
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/30 p-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Build from</p>
              <p className="mt-1.5 text-sm font-semibold text-white">
                {buildFromPrice !== null ? formatCurrency(buildFromPrice) : "—"}
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                Accessories {accessories.length ? `(${accessories.length})` : ""}
              </p>
              {payload.accessories_price_on_request_count ? (
                <Badge variant="outline" className="border-amber-400/30 bg-amber-500/10 text-amber-200">
                  {payload.accessories_price_on_request_count} price on request
                </Badge>
              ) : null}
            </div>
            {accessories.length ? (
              <ul className="mt-2 space-y-1.5 text-sm text-slate-200">
                {accessories.map((item) => (
                  <li
                    key={item.title}
                    className="flex items-center justify-between gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-2.5 py-1.5"
                  >
                    <span className="truncate">{item.title}</span>
                    <span className="shrink-0 text-xs font-medium text-white/85">
                      {item.price ? formatCurrency(item.price) : "Price on request"}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-slate-400">None selected</p>
            )}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-black/30 p-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Accessories subtotal</p>
              <p className="mt-1 text-sm font-semibold text-white">
                {accessoriesSubtotal !== null ? formatCurrency(accessoriesSubtotal) : "—"}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/30 p-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Include build in total</p>
              <p className="mt-1 text-sm font-semibold text-white">
                {includeBuildInTotal ? "Yes" : "No"}
              </p>
            </div>
            <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-200/80">Grand total from</p>
              <p className="mt-1 text-sm font-semibold text-emerald-100">
                {grandTotal !== null ? formatCurrency(grandTotal) : "—"}
              </p>
            </div>
          </div>

          <p className="mt-3 text-[11px] text-slate-500">
            Pricing shown is the customer-facing "from" amount selected in the configurator. Installation charged separately.
          </p>
        </>
      )}
    </Card>
  );
};

export default G700BuildSummaryCard;
