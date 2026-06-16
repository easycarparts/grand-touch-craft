import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, RefreshCw } from "lucide-react";

import { AdminShell } from "@/components/admin/AdminShell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type AdsMetricRow = {
  campaignId: string;
  campaignName: string;
  status?: string;
  servingStatus?: string;
  channelType?: string;
  biddingStrategyType?: string;
  budget?: number;
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
  conversionValue: number;
  ctr: number;
  averageCpc: number;
  costPerConversion: number | null;
};

type AdsAdGroupRow = AdsMetricRow & {
  adGroupId: string;
  adGroupName: string;
};

type AdsAdRow = AdsAdGroupRow & {
  adId: string;
  finalUrls: string[];
};

type AdsSearchTermRow = AdsAdGroupRow & {
  searchTerm: string;
};

type GoogleAdsDashboardResponse = {
  startDate: string;
  endDate: string;
  customerId: string;
  campaigns: AdsMetricRow[];
  adGroups: AdsAdGroupRow[];
  ads: AdsAdRow[];
  searchTerms: AdsSearchTermRow[];
  error?: string;
};

type LeadRow = {
  id: string;
  primary_session_id: string | null;
  visitor_id: string | null;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  vehicle_label: string | null;
  source_platform: string | null;
  lead_source_type: string | null;
  status: string | null;
  quality_label: string | null;
  intent_score: number | null;
  latest_quote_estimate: number | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  external_campaign_name: string | null;
  external_ad_name: string | null;
  gclid: string | null;
  fbclid: string | null;
  ttclid: string | null;
  first_captured_at: string | null;
  source_received_at: string | null;
  created_at: string;
  last_activity_at: string | null;
  submitted_at: string | null;
  whatsapp_clicked_at: string | null;
};

type SessionRollupRow = {
  session_id: string;
  visitor_id: string | null;
  started_at: string;
  ended_at: string | null;
  source_platform: string | null;
  landing_page_variant: string | null;
  pathname: string | null;
  funnel_name: string | null;
  lead_submitted: boolean | null;
  whatsapp_clicked: boolean | null;
  selected_price_whatsapp_clicked: boolean | null;
  general_whatsapp_clicked: boolean | null;
  duration_ms: number | null;
  intent_score: number | null;
  quote_estimate: number | null;
  lead_name: string | null;
  lead_phone: string | null;
};

type LeadEventRow = {
  event_name: string;
  occurred_at: string;
  session_id: string | null;
  source_platform: string | null;
  funnel_name: string | null;
  landing_page_variant: string | null;
  attribution: Record<string, unknown> | null;
  payload: Record<string, unknown> | null;
};

const money = new Intl.NumberFormat("en-AE", {
  style: "currency",
  currency: "AED",
  maximumFractionDigits: 0,
});

const compactMoney = new Intl.NumberFormat("en-AE", {
  maximumFractionDigits: 0,
});

const formatMoney = (value: number | null | undefined) =>
  Number.isFinite(Number(value)) ? money.format(Number(value)) : "n/a";

const formatPercent = (value: number | null | undefined) =>
  Number.isFinite(Number(value)) ? `${(Number(value) * 100).toFixed(1)}%` : "n/a";

const formatDuration = (ms: number | null | undefined) => {
  const totalSeconds = Math.round(Number(ms || 0) / 1000);
  if (!totalSeconds) return "0s";
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (!minutes) return `${seconds}s`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (!hours) return `${minutes}m ${seconds}s`;
  return `${hours}h ${remainingMinutes}m`;
};

const formatDateInput = (date: Date) => date.toISOString().slice(0, 10);

const defaultDateRange = () => {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 6);
  return {
    startDate: formatDateInput(start),
    endDate: formatDateInput(end),
  };
};

const normalize = (value: unknown) => String(value || "").trim().toLowerCase();
const normalizeCampaignText = (value: unknown) =>
  normalize(value)
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");

const isGoogleText = (value: unknown) => normalize(value).includes("google") || normalize(value).includes("gclid");

const readAttributionString = (
  source: Record<string, unknown> | null | undefined,
  ...keys: string[]
) => {
  for (const key of keys) {
    const value = source?.[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
};

const getLeadDate = (lead: LeadRow) => lead.first_captured_at || lead.source_received_at || lead.created_at;

const isWithinDateRange = (isoDate: string | null | undefined, startDate: string, endDate: string) => {
  if (!isoDate) return false;
  const day = isoDate.slice(0, 10);
  return day >= startDate && day <= endDate;
};

const isGoogleLead = (lead: LeadRow) =>
  Boolean(lead.gclid) ||
  isGoogleText(lead.source_platform) ||
  isGoogleText(lead.utm_source) ||
  isGoogleText(lead.utm_medium) ||
  isGoogleText(lead.lead_source_type);

const isQualifiedLead = (lead: LeadRow) => {
  const status = normalize(lead.status);
  const quality = normalize(lead.quality_label);
  return (
    ["qualified", "quoted", "won"].includes(status) ||
    ["qualified", "high", "good", "warm", "hot"].includes(quality)
  );
};

const isWonLead = (lead: LeadRow) => normalize(lead.status) === "won";

const getLeadCampaignKeys = (lead: LeadRow) =>
  [lead.utm_campaign, lead.external_campaign_name, lead.external_ad_name]
    .map(normalizeCampaignText)
    .filter(Boolean);

const campaignMatchesLead = (campaign: AdsMetricRow, lead: LeadRow) => {
  const campaignName = normalizeCampaignText(campaign.campaignName);
  const campaignId = normalizeCampaignText(campaign.campaignId);
  const leadKeys = getLeadCampaignKeys(lead);

  return leadKeys.some((key) => {
    if (key === campaignName || key === campaignId || campaignName.includes(key)) return true;

    const keyTokens = key.split(" ").filter((token) => token.length > 1);
    if (keyTokens.length >= 3 && keyTokens.every((token) => campaignName.includes(token))) return true;

    return false;
  });
};

const isGoogleSession = (row: SessionRollupRow) =>
  isGoogleText(row.source_platform) ||
  isGoogleText(row.landing_page_variant) ||
  isGoogleText(row.funnel_name) ||
  normalize(row.pathname).includes("gclid");

const isGoogleEvent = (row: LeadEventRow) => {
  const utmSource = readAttributionString(row.attribution, "utm_source", "source", "source_platform");
  const gclid = readAttributionString(row.attribution, "gclid");
  return Boolean(gclid) || isGoogleText(row.source_platform) || isGoogleText(utmSource);
};

const sum = <T,>(rows: T[], selector: (row: T) => number | null | undefined) =>
  rows.reduce((total, row) => total + Number(selector(row) || 0), 0);

const average = <T,>(rows: T[], selector: (row: T) => number | null | undefined) => {
  const values = rows.map(selector).map(Number).filter((value) => Number.isFinite(value) && value > 0);
  return values.length ? values.reduce((total, value) => total + value, 0) / values.length : 0;
};

const buildCtaRows = (events: LeadEventRow[]) => {
  const grouped = new Map<string, { label: string; total: number; selectedPrice: number; general: number; form: number }>();
  for (const event of events) {
    const location =
      readAttributionString(event.payload, "cta_location", "location", "button_location", "component") ||
      "unknown";
    const current = grouped.get(location) ?? {
      label: location,
      total: 0,
      selectedPrice: 0,
      general: 0,
      form: 0,
    };

    current.total += 1;
    if (event.event_name === "selected_price_whatsapp_click") current.selectedPrice += 1;
    if (event.event_name === "general_whatsapp_click" || event.event_name === "whatsapp_click") current.general += 1;
    if (event.event_name === "save_quote_submitted" || event.event_name === "lead_submitted") current.form += 1;
    grouped.set(location, current);
  }

  return Array.from(grouped.values()).sort((left, right) => right.total - left.total);
};

const getCampaignCrmMetrics = (campaign: AdsMetricRow, leads: LeadRow[]) => {
  const matchedLeads = leads.filter((lead) => campaignMatchesLead(campaign, lead));
  const wonLeads = matchedLeads.filter(isWonLead);
  const revenue = sum(wonLeads, (lead) => lead.latest_quote_estimate);
  return {
    leads: matchedLeads.length,
    qualified: matchedLeads.filter(isQualifiedLead).length,
    won: wonLeads.length,
    revenue,
    avgIntent: average(matchedLeads, (lead) => lead.intent_score),
    trueCpa: wonLeads.length ? campaign.cost / wonLeads.length : null,
    roas: campaign.cost ? revenue / campaign.cost : 0,
  };
};

const StatCard = ({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) => (
  <Card className="border-white/10 bg-black/25 p-4">
    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
    <p className="mt-2 text-2xl font-bold text-white">{value}</p>
    {detail ? <p className="mt-1 text-sm text-slate-400">{detail}</p> : null}
  </Card>
);

const AdminGoogleAdsDashboard = () => {
  const initialRange = useMemo(defaultDateRange, []);
  const [startDate, setStartDate] = useState(initialRange.startDate);
  const [endDate, setEndDate] = useState(initialRange.endDate);
  const [selectedCampaignId, setSelectedCampaignId] = useState("all");
  const [adsData, setAdsData] = useState<GoogleAdsDashboardResponse | null>(null);
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [sessions, setSessions] = useState<SessionRollupRow[]>([]);
  const [events, setEvents] = useState<LeadEventRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      setError("Supabase is not configured in this environment.");
      return;
    }

    setLoading(true);
    setError(null);

    const nextCampaignId = selectedCampaignId;

    const sessionResult = await supabase.auth.getSession();
    const accessToken = sessionResult.data.session?.access_token;
    if (!accessToken) throw new Error("Admin session expired. Sign in again and reload the dashboard.");

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const adsPromise = fetch(`${supabaseUrl}/functions/v1/google-ads-dashboard`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        startDate,
        endDate,
        campaignId: nextCampaignId,
      }),
    }).then(async (response) => {
      const payload = (await response.json().catch(() => ({}))) as GoogleAdsDashboardResponse;
      if (!response.ok) {
        throw new Error(payload.error || `Google Ads function failed with HTTP ${response.status}.`);
      }
      return { data: payload, error: null };
    });

    const leadsPromise = supabase
      .from("leads")
      .select(
        "id, primary_session_id, visitor_id, full_name, phone, email, vehicle_make, vehicle_model, vehicle_label, source_platform, lead_source_type, status, quality_label, intent_score, latest_quote_estimate, utm_source, utm_medium, utm_campaign, external_campaign_name, external_ad_name, gclid, fbclid, ttclid, first_captured_at, source_received_at, created_at, last_activity_at, submitted_at, whatsapp_clicked_at, landing_page_variant, funnel_name",
      )
      .order("created_at", { ascending: false })
      .limit(5000);

    const sessionsPromise = supabase
      .from("admin_session_rollups")
      .select(
        "session_id, visitor_id, started_at, ended_at, source_platform, landing_page_variant, pathname, funnel_name, lead_submitted, whatsapp_clicked, selected_price_whatsapp_clicked, general_whatsapp_clicked, duration_ms, intent_score, quote_estimate, lead_name, lead_phone",
      )
      .gte("started_at", `${startDate}T00:00:00`)
      .lte("started_at", `${endDate}T23:59:59`)
      .order("started_at", { ascending: false })
      .limit(5000);

    const eventsPromise = supabase
      .from("lead_events")
      .select("event_name, occurred_at, session_id, source_platform, funnel_name, landing_page_variant, attribution, payload")
      .gte("occurred_at", `${startDate}T00:00:00`)
      .lte("occurred_at", `${endDate}T23:59:59`)
      .in("event_name", [
        "whatsapp_click",
        "selected_price_whatsapp_click",
        "general_whatsapp_click",
        "lead_submitted",
        "save_quote_submitted",
      ])
      .order("occurred_at", { ascending: false })
      .limit(5000);

    const [adsResult, leadsResult, sessionsResult, eventsResult] = await Promise.all([
      adsPromise,
      leadsPromise,
      sessionsPromise,
      eventsPromise,
    ]);

    if (adsResult.error) throw adsResult.error;
    if (adsResult.data?.error) throw new Error(adsResult.data.error);
    if (leadsResult.error) throw leadsResult.error;
    if (sessionsResult.error) throw sessionsResult.error;
    if (eventsResult.error) throw eventsResult.error;

    setAdsData(adsResult.data ?? null);
    setLeads(((leadsResult.data ?? []) as LeadRow[]).filter((lead) => isWithinDateRange(getLeadDate(lead), startDate, endDate)));
    setSessions((sessionsResult.data ?? []) as SessionRollupRow[]);
    setEvents((eventsResult.data ?? []) as LeadEventRow[]);
  }, [endDate, selectedCampaignId, startDate]);

  useEffect(() => {
    void loadDashboard().catch((caught) => {
      setError(caught instanceof Error ? caught.message : "Failed to load Google Ads dashboard.");
    }).finally(() => setLoading(false));
  }, [loadDashboard]);

  const googleLeads = useMemo(() => leads.filter(isGoogleLead), [leads]);
  const googleSessions = useMemo(() => sessions.filter(isGoogleSession), [sessions]);
  const googleEvents = useMemo(() => events.filter(isGoogleEvent), [events]);
  const ctaRows = useMemo(() => buildCtaRows(googleEvents), [googleEvents]);

  const visibleCampaigns = adsData?.campaigns ?? [];
  const campaignOptions = adsData?.campaigns ?? [];
  const selectedCampaign = selectedCampaignId === "all" ? null : visibleCampaigns[0] ?? null;
  const scopedGoogleLeads = selectedCampaign
    ? googleLeads.filter((lead) => campaignMatchesLead(selectedCampaign, lead))
    : googleLeads;
  const adsTotals = useMemo(
    () => ({
      cost: sum(visibleCampaigns, (row) => row.cost),
      clicks: sum(visibleCampaigns, (row) => row.clicks),
      impressions: sum(visibleCampaigns, (row) => row.impressions),
      conversions: sum(visibleCampaigns, (row) => row.conversions),
    }),
    [visibleCampaigns],
  );

  const wonLeads = scopedGoogleLeads.filter(isWonLead);
  const wonRevenue = sum(wonLeads, (lead) => lead.latest_quote_estimate);
  const avgIntent = average(scopedGoogleLeads, (lead) => lead.intent_score);
  const avgSessionTime = average(googleSessions, (row) => row.duration_ms);
  const whatsappActions =
    googleSessions.filter((row) => row.whatsapp_clicked).length ||
    googleEvents.filter((row) => row.event_name.includes("whatsapp")).length;
  const formSubmits =
    googleSessions.filter((row) => row.lead_submitted).length ||
    googleEvents.filter((row) => ["lead_submitted", "save_quote_submitted"].includes(row.event_name)).length;

  return (
    <AdminShell
      title="Google Ads Dashboard"
      description="Read-only Google Ads performance joined with CRM lead quality, won status, quoted amount, and funnel behaviour."
    >
      <div className="space-y-6">
        <Card className="border-white/10 bg-black/20 p-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_1fr_1.4fr_auto]">
            <Input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="border-white/10 bg-black/20 text-white"
            />
            <Input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="border-white/10 bg-black/20 text-white"
            />
            <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
              <SelectTrigger className="border-white/10 bg-black/20 text-white">
                <SelectValue placeholder="Campaign" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All active and paused campaigns</SelectItem>
                {campaignOptions.map((campaign) => (
                  <SelectItem key={campaign.campaignId} value={campaign.campaignId}>
                    {campaign.campaignName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              onClick={() => void loadDashboard().finally(() => setLoading(false))}
              disabled={loading}
              className="bg-primary text-black hover:bg-primary/90"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
          <p className="mt-3 text-sm text-slate-400">
            CRM attribution uses source platform, UTM source, campaign name, and GCLID. Manual WhatsApp leads can be
            marked as Google from the lead detail panel.
          </p>
        </Card>

        {error ? (
          <Alert variant="destructive" className="border-rose-400/20 bg-rose-950/30 text-rose-100">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Google Ads dashboard could not load</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Google spend" value={formatMoney(adsTotals.cost)} detail={`${adsTotals.clicks} clicks`} />
          <StatCard
            label="Google Ads conversions"
            value={compactMoney.format(adsTotals.conversions)}
            detail={`${formatPercent(adsTotals.clicks ? adsTotals.conversions / adsTotals.clicks : 0)} CVR`}
          />
          <StatCard
            label="CRM Google leads"
            value={compactMoney.format(scopedGoogleLeads.length)}
            detail={`${scopedGoogleLeads.filter(isQualifiedLead).length} qualified`}
          />
          <StatCard
            label="Won revenue"
            value={formatMoney(wonRevenue)}
            detail={`${wonLeads.length} won jobs`}
          />
          <StatCard
            label="True won CPA"
            value={wonLeads.length ? formatMoney(adsTotals.cost / wonLeads.length) : "n/a"}
            detail="Spend divided by CRM won jobs"
          />
          <StatCard
            label="ROAS from won jobs"
            value={adsTotals.cost ? `${(wonRevenue / adsTotals.cost).toFixed(1)}x` : "n/a"}
            detail="Won quoted amount / spend"
          />
          <StatCard label="Avg intent" value={`${Math.round(avgIntent)}/100`} detail="Google CRM leads" />
          <StatCard label="Avg page time" value={formatDuration(avgSessionTime)} detail={`${googleSessions.length} sessions`} />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <StatCard label="WhatsApp actions" value={compactMoney.format(whatsappActions)} detail="Google-attributed sessions/events" />
          <StatCard label="Form submits" value={compactMoney.format(formSubmits)} detail="Google-attributed sessions/events" />
        </div>

        <Card className="border-white/10 bg-black/20 p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Campaigns</p>
              <h2 className="text-xl font-semibold text-white">Ads spend vs CRM outcomes</h2>
            </div>
            <Badge variant="outline" className="border-primary/20 bg-primary/10 text-primary">
              {adsData?.customerId ? `CID ${adsData.customerId}` : "Live API"}
            </Badge>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead>Campaign</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Spend</TableHead>
                <TableHead className="text-right">Clicks</TableHead>
                <TableHead className="text-right">CPC</TableHead>
                <TableHead className="text-right">Ads conv.</TableHead>
                <TableHead className="text-right">CRM leads</TableHead>
                <TableHead className="text-right">Won</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">ROAS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleCampaigns.map((campaign) => {
                const crm = getCampaignCrmMetrics(campaign, googleLeads);
                return (
                  <TableRow key={campaign.campaignId} className="border-white/10">
                    <TableCell>
                      <p className="font-medium text-white">{campaign.campaignName}</p>
                      <p className="text-xs text-slate-500">{campaign.campaignId}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-white/10 bg-white/5 text-slate-200">
                        {campaign.status || "unknown"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-white">{formatMoney(campaign.cost)}</TableCell>
                    <TableCell className="text-right text-white">{campaign.clicks}</TableCell>
                    <TableCell className="text-right text-white">{formatMoney(campaign.averageCpc)}</TableCell>
                    <TableCell className="text-right text-white">{campaign.conversions.toFixed(1)}</TableCell>
                    <TableCell className="text-right text-white">
                      {crm.leads}
                      <span className="ml-1 text-xs text-slate-500">/{crm.qualified} q</span>
                    </TableCell>
                    <TableCell className="text-right text-white">{crm.won}</TableCell>
                    <TableCell className="text-right text-white">{formatMoney(crm.revenue)}</TableCell>
                    <TableCell className="text-right text-white">{crm.roas ? `${crm.roas.toFixed(1)}x` : "n/a"}</TableCell>
                  </TableRow>
                );
              })}
              {!visibleCampaigns.length ? (
                <TableRow>
                  <TableCell colSpan={10} className="py-8 text-center text-slate-400">
                    No Google Ads campaign rows returned for this date range.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </Card>

        <div className="grid gap-4 xl:grid-cols-2">
          <Card className="border-white/10 bg-black/20 p-4">
            <p className="text-sm uppercase tracking-[0.18em] text-slate-500">CTA Breakdown</p>
            <h2 className="mt-1 text-xl font-semibold text-white">Where Google users contact from</h2>
            <Table className="mt-4">
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Selected price WA</TableHead>
                  <TableHead className="text-right">General WA</TableHead>
                  <TableHead className="text-right">Form</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ctaRows.slice(0, 12).map((row) => (
                  <TableRow key={row.label} className="border-white/10">
                    <TableCell className="font-medium text-white">{row.label}</TableCell>
                    <TableCell className="text-right text-white">{row.total}</TableCell>
                    <TableCell className="text-right text-white">{row.selectedPrice}</TableCell>
                    <TableCell className="text-right text-white">{row.general}</TableCell>
                    <TableCell className="text-right text-white">{row.form}</TableCell>
                  </TableRow>
                ))}
                {!ctaRows.length ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-slate-400">
                      No Google-attributed CTA events found in this date range.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </Card>

          <Card className="border-white/10 bg-black/20 p-4">
            <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Search Terms</p>
            <h2 className="mt-1 text-xl font-semibold text-white">Spend by query</h2>
            <Table className="mt-4">
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead>Term</TableHead>
                  <TableHead className="text-right">Spend</TableHead>
                  <TableHead className="text-right">Clicks</TableHead>
                  <TableHead className="text-right">Conv.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(adsData?.searchTerms ?? []).slice(0, 12).map((row) => (
                  <TableRow key={`${row.campaignId}:${row.adGroupId}:${row.searchTerm}`} className="border-white/10">
                    <TableCell>
                      <p className="font-medium text-white">{row.searchTerm || "(not provided)"}</p>
                      <p className="text-xs text-slate-500">{row.campaignName}</p>
                    </TableCell>
                    <TableCell className="text-right text-white">{formatMoney(row.cost)}</TableCell>
                    <TableCell className="text-right text-white">{row.clicks}</TableCell>
                    <TableCell className="text-right text-white">{row.conversions.toFixed(1)}</TableCell>
                  </TableRow>
                ))}
                {!(adsData?.searchTerms ?? []).length ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-slate-400">
                      Search terms are unavailable or empty for this range.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </Card>
        </div>

        <Card className="border-white/10 bg-black/20 p-4">
          <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Google CRM Leads</p>
          <h2 className="mt-1 text-xl font-semibold text-white">Lead quality and won value</h2>
          <Table className="mt-4">
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead>Lead</TableHead>
                <TableHead>Campaign</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Intent</TableHead>
                <TableHead className="text-right">Quote / won value</TableHead>
                <TableHead>Click ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scopedGoogleLeads.slice(0, 40).map((lead) => (
                <TableRow key={lead.id} className="border-white/10">
                  <TableCell>
                    <Link to={`/admin/leads?lead=${lead.id}`} className="font-medium text-white hover:text-primary">
                      {lead.full_name || lead.phone || lead.email || "Unnamed Google lead"}
                    </Link>
                    <p className="text-xs text-slate-500">{[lead.vehicle_make, lead.vehicle_model, lead.vehicle_label].filter(Boolean).join(" ") || "Vehicle not captured"}</p>
                  </TableCell>
                  <TableCell className="text-white">
                    {lead.external_campaign_name || lead.utm_campaign || "Not captured"}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="border-white/10 bg-white/5 text-slate-200">
                        {lead.status || "new"}
                      </Badge>
                      <Badge variant="outline" className="border-white/10 bg-white/5 text-slate-200">
                        {lead.quality_label || "unreviewed"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-white">{Math.round(Number(lead.intent_score || 0))}/100</TableCell>
                  <TableCell className="text-right text-white">{formatMoney(lead.latest_quote_estimate)}</TableCell>
                  <TableCell className="max-w-[180px] truncate text-slate-300">{lead.gclid || "No gclid"}</TableCell>
                </TableRow>
              ))}
              {!scopedGoogleLeads.length ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-slate-400">
                    No CRM leads marked as Google for this date range yet.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </Card>
      </div>
    </AdminShell>
  );
};

export default AdminGoogleAdsDashboard;
