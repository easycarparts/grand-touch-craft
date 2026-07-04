import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, EyeOff, RefreshCw, X } from "lucide-react";

import { AdminShell } from "@/components/admin/AdminShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/lib/supabase";

type OverallStats = {
  total: number;
  won: number;
  lost: number;
  open: number;
  revenue: number;
  avg_deal: number;
  avg_followups_won: number;
  avg_days_to_close: number;
};

type SourceRow = {
  source_group: string;
  total: number;
  won: number;
  lost: number;
  open: number;
  revenue: number;
  avg_followups_won: number;
};

type FunnelRow = {
  funnel_key: string;
  source_group: string;
  total: number;
  won: number;
  lost: number;
  open: number;
  revenue: number;
};

type OwnerRow = {
  owner_id: string;
  owner_name: string;
  total: number;
  won: number;
  lost: number;
  open: number;
  revenue: number;
  avg_followups_won: number;
  avg_days_to_close: number;
};

type MonthRow = {
  month: string;
  total: number;
  won: number;
  lost: number;
  revenue: number;
};

type CloseRateStats = {
  overall: OverallStats;
  by_source: SourceRow[];
  by_funnel: FunnelRow[];
  by_owner: OwnerRow[];
  by_month: MonthRow[];
};

type RangePreset = "all" | "30" | "90" | "month" | "custom";

const emptyOverall: OverallStats = {
  total: 0,
  won: 0,
  lost: 0,
  open: 0,
  revenue: 0,
  avg_deal: 0,
  avg_followups_won: 0,
  avg_days_to_close: 0,
};

const formatAed = (value: number) => `AED ${Math.round(value).toLocaleString("en-AE")}`;

const formatPercent = (numerator: number, denominator: number) =>
  denominator > 0 ? `${((numerator / denominator) * 100).toFixed(1)}%` : "—";

const rangeLabels: Record<RangePreset, string> = {
  all: "All time",
  "30": "Last 30 days",
  "90": "Last 90 days",
  month: "This month",
  custom: "Custom range",
};

const sourceLabels: Record<string, string> = {
  meta: "Meta (Facebook / Instagram)",
  google: "Google",
  tiktok: "TikTok",
  website: "Website",
  manual: "Manual / walk-in",
};

const EXCLUSIONS_STORAGE_KEY = "adminCloseRateExclusions";

type StoredExclusions = { sources: string[]; funnels: string[] };

const readStoredExclusions = (): StoredExclusions => {
  try {
    const raw = window.localStorage.getItem(EXCLUSIONS_STORAGE_KEY);
    if (!raw) return { sources: [], funnels: [] };
    const parsed = JSON.parse(raw) as Partial<StoredExclusions>;
    return {
      sources: Array.isArray(parsed.sources) ? parsed.sources : [],
      funnels: Array.isArray(parsed.funnels) ? parsed.funnels : [],
    };
  } catch {
    return { sources: [], funnels: [] };
  }
};

const AdminCloseRates = () => {
  const [stats, setStats] = useState<CloseRateStats | null>(null);
  const [range, setRange] = useState<RangePreset>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({});
  const [excludedSources, setExcludedSources] = useState<string[]>(() => readStoredExclusions().sources);
  const [excludedFunnels, setExcludedFunnels] = useState<string[]>(() => readStoredExclusions().funnels);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const dateBounds = useMemo((): { from: string | null; to: string | null } => {
    const now = new Date();
    if (range === "30") return { from: new Date(now.getTime() - 30 * 86_400_000).toISOString(), to: null };
    if (range === "90") return { from: new Date(now.getTime() - 90 * 86_400_000).toISOString(), to: null };
    if (range === "month") return { from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(), to: null };
    if (range === "custom") {
      const from = customFrom ? new Date(`${customFrom}T00:00:00`).toISOString() : null;
      // End date is inclusive: query everything before the following midnight.
      const to = customTo ? new Date(new Date(`${customTo}T00:00:00`).getTime() + 86_400_000).toISOString() : null;
      return { from, to };
    }
    return { from: null, to: null };
  }, [range, customFrom, customTo]);

  const loadStats = useCallback(
    async (options?: { refresh?: boolean }) => {
      if (!supabase) {
        setIsLoading(false);
        return;
      }

      if (options?.refresh || stats) setIsRefreshing(true);
      else setIsLoading(true);

      const { data, error } = await supabase.rpc("admin_close_rate_stats", {
        p_from: dateBounds.from,
        p_to: dateBounds.to,
        p_owner: ownerFilter === "all" ? null : ownerFilter,
        p_exclude_sources: excludedSources.length ? excludedSources : null,
        p_exclude_funnels: excludedFunnels.length ? excludedFunnels : null,
      });

      if (error) {
        console.warn("Failed to load close-rate stats", error);
        setLoadError(error.message);
      } else {
        setLoadError(null);
        setStats((data ?? null) as CloseRateStats | null);
      }

      setIsLoading(false);
      setIsRefreshing(false);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dateBounds, ownerFilter, excludedSources, excludedFunnels],
  );

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  useEffect(() => {
    window.localStorage.setItem(
      EXCLUSIONS_STORAGE_KEY,
      JSON.stringify({ sources: excludedSources, funnels: excludedFunnels }),
    );
  }, [excludedSources, excludedFunnels]);

  const overall = stats?.overall ?? emptyOverall;
  const decided = overall.won + overall.lost;

  // The by_owner section always covers all owners, so the selector never loses options.
  const ownerOptions = useMemo(
    () =>
      (stats?.by_owner ?? [])
        .slice()
        .sort((left, right) => right.total - left.total)
        .map((row) => ({ id: row.owner_id, name: row.owner_name })),
    [stats],
  );

  const selectedOwnerName = useMemo(() => {
    if (ownerFilter === "all") return null;
    return ownerOptions.find((option) => option.id === ownerFilter)?.name ?? "Selected owner";
  }, [ownerFilter, ownerOptions]);

  // Group funnels under their source with an expandable summary row per source.
  const sourceGroups = useMemo(() => {
    const funnels = stats?.by_funnel ?? [];
    return (stats?.by_source ?? []).map((source) => ({
      ...source,
      funnels: funnels
        .filter((funnel) => funnel.source_group === source.source_group)
        .sort((left, right) => right.total - left.total),
    }));
  }, [stats]);

  const toggleSource = (sourceGroup: string) =>
    setExpandedSources((current) => ({ ...current, [sourceGroup]: !current[sourceGroup] }));

  const hideSource = (sourceGroup: string) =>
    setExcludedSources((current) => (current.includes(sourceGroup) ? current : [...current, sourceGroup]));

  const hideFunnel = (sourceGroup: string, funnelKey: string) => {
    const key = `${sourceGroup}:${funnelKey}`;
    setExcludedFunnels((current) => (current.includes(key) ? current : [...current, key]));
  };

  const hasExclusions = excludedSources.length > 0 || excludedFunnels.length > 0;

  const filterSummary = [
    selectedOwnerName ? `Salesperson: ${selectedOwnerName}` : null,
    range === "custom"
      ? `From ${customFrom || "start"} to ${customTo || "today"}`
      : rangeLabels[range],
    hasExclusions ? `${excludedSources.length + excludedFunnels.length} hidden from view` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <AdminShell
      title="Close Rates"
      description="Lead-to-job conversion across funnels, sources, and owners. Won amounts are billed ex-VAT where jobs have been reconciled against the job card export, so revenue here reflects real invoiced work. 'Decided' means won + lost — leads that reached an outcome; open leads are not counted against the decided rate."
    >
      <div className="flex flex-wrap items-center gap-3">
        <Select value={ownerFilter} onValueChange={setOwnerFilter}>
          <SelectTrigger className="w-[200px] border-white/10 bg-black/20 text-white">
            <SelectValue placeholder="Salesperson" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All salespeople</SelectItem>
            {ownerOptions.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={range} onValueChange={(value) => setRange(value as RangePreset)}>
          <SelectTrigger className="w-[170px] border-white/10 bg-black/20 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(rangeLabels) as RangePreset[]).map((preset) => (
              <SelectItem key={preset} value={preset}>
                {rangeLabels[preset]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {range === "custom" ? (
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={customFrom}
              onChange={(event) => setCustomFrom(event.target.value)}
              className="w-[160px] border-white/10 bg-black/20 text-white"
            />
            <span className="text-sm text-slate-500">to</span>
            <Input
              type="date"
              value={customTo}
              onChange={(event) => setCustomTo(event.target.value)}
              className="w-[160px] border-white/10 bg-black/20 text-white"
            />
          </div>
        ) : null}
        <Button
          type="button"
          variant="outline"
          className="border-white/10 bg-black/20 text-white hover:bg-white/10"
          onClick={() => void loadStats({ refresh: true })}
          disabled={isLoading || isRefreshing}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
        <Badge variant="outline" className="border-white/10 bg-black/20 text-slate-300">
          {filterSummary}
        </Badge>
        {loadError ? (
          <Badge variant="outline" className="border-rose-400/20 bg-rose-500/10 text-rose-200">
            Failed to load: {loadError}
          </Badge>
        ) : null}
      </div>

      {hasExclusions ? (
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-400">
          <span className="flex items-center gap-1 text-xs uppercase tracking-[0.18em] text-slate-500">
            <EyeOff className="h-3.5 w-3.5" /> Hidden from view
          </span>
          {excludedSources.map((source) => (
            <Badge
              key={source}
              variant="outline"
              className="gap-1 border-amber-400/20 bg-amber-500/10 text-amber-200"
            >
              {sourceLabels[source] ?? source}
              <button
                type="button"
                aria-label={`Show ${source} again`}
                className="ml-1 rounded-full hover:text-white"
                onClick={() => setExcludedSources((current) => current.filter((item) => item !== source))}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {excludedFunnels.map((key) => (
            <Badge
              key={key}
              variant="outline"
              className="gap-1 border-amber-400/20 bg-amber-500/10 text-amber-200"
            >
              {key.split(":")[1] ?? key}
              <button
                type="button"
                aria-label={`Show ${key} again`}
                className="ml-1 rounded-full hover:text-white"
                onClick={() => setExcludedFunnels((current) => current.filter((item) => item !== key))}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 border-white/10 bg-black/20 px-3 text-xs text-slate-300 hover:bg-white/10"
            onClick={() => {
              setExcludedSources([]);
              setExcludedFunnels([]);
            }}
          >
            Show all
          </Button>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(10,10,10,0.96))] p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Leads</p>
          <p className="mt-3 text-3xl font-semibold text-white">{overall.total}</p>
          <p className="mt-2 text-sm text-slate-400">
            {overall.open} still open · {overall.lost} lost
          </p>
        </Card>
        <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(10,10,10,0.96))] p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Won</p>
          <p className="mt-3 text-3xl font-semibold text-emerald-200">{overall.won}</p>
          <p className="mt-2 text-sm text-slate-400">
            {formatPercent(overall.won, overall.total)} of all leads ·{" "}
            {formatPercent(overall.won, decided)} of decided
          </p>
        </Card>
        <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(10,10,10,0.96))] p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Revenue (ex VAT)</p>
          <p className="mt-3 text-3xl font-semibold text-white">{formatAed(overall.revenue)}</p>
          <p className="mt-2 text-sm text-slate-400">Avg deal {formatAed(overall.avg_deal)}</p>
        </Card>
        <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(10,10,10,0.96))] p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Sales effort</p>
          <p className="mt-3 text-3xl font-semibold text-white">{overall.avg_followups_won}</p>
          <p className="mt-2 text-sm text-slate-400">
            Avg follow-ups per won lead · {overall.avg_days_to_close} days to close
          </p>
        </Card>
      </div>

      <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(10,10,10,0.96))] p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-white">By salesperson</h2>
        <p className="mt-1 text-sm text-slate-400">
          Always shows everyone for comparison (date range applies, salesperson filter does not). Click a
          row to filter the rest of the page to that person.
        </p>
        <div className="mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Owner</TableHead>
                <TableHead>Leads</TableHead>
                <TableHead>Won</TableHead>
                <TableHead>Lost</TableHead>
                <TableHead>Close rate (all)</TableHead>
                <TableHead>Close rate (decided)</TableHead>
                <TableHead>Revenue (ex VAT)</TableHead>
                <TableHead>Avg follow-ups</TableHead>
                <TableHead>Avg days to close</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-slate-400">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : (
                (stats?.by_owner ?? []).map((row) => (
                  <TableRow
                    key={row.owner_id}
                    className={`cursor-pointer transition-colors ${
                      ownerFilter === row.owner_id ? "bg-primary/10" : "hover:bg-white/5"
                    }`}
                    onClick={() =>
                      setOwnerFilter((current) => (current === row.owner_id ? "all" : row.owner_id))
                    }
                  >
                    <TableCell className="font-medium text-white">{row.owner_name}</TableCell>
                    <TableCell>{row.total}</TableCell>
                    <TableCell className="text-emerald-200">{row.won}</TableCell>
                    <TableCell className="text-rose-200">{row.lost}</TableCell>
                    <TableCell>{formatPercent(row.won, row.total)}</TableCell>
                    <TableCell>{formatPercent(row.won, row.won + row.lost)}</TableCell>
                    <TableCell>{formatAed(row.revenue)}</TableCell>
                    <TableCell>{row.avg_followups_won}</TableCell>
                    <TableCell>{row.avg_days_to_close || "—"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(10,10,10,0.96))] p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-white">
          Sources &amp; funnels{selectedOwnerName ? ` — ${selectedOwnerName}` : ""}
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Each source groups its funnels and lead forms — click a row to expand. Use the eye icon to hide
          a source or funnel from the whole data set (view only, nothing is deleted).
        </p>
        <div className="mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Source / funnel</TableHead>
                <TableHead>Leads</TableHead>
                <TableHead>Won</TableHead>
                <TableHead>Lost</TableHead>
                <TableHead>Open</TableHead>
                <TableHead>Close rate (all)</TableHead>
                <TableHead>Close rate (decided)</TableHead>
                <TableHead>Revenue (ex VAT)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-slate-400">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : (
                sourceGroups.map((source) => {
                  const isExpanded = Boolean(expandedSources[source.source_group]);
                  return (
                    <Fragment key={source.source_group}>
                      <TableRow
                        className="cursor-pointer bg-white/[0.03] transition-colors hover:bg-white/[0.06]"
                        onClick={() => toggleSource(source.source_group)}
                      >
                        <TableCell className="font-medium text-white">
                          <span className="flex items-center gap-2">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-slate-400" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-slate-400" />
                            )}
                            {sourceLabels[source.source_group] ?? source.source_group}
                            <span className="text-xs font-normal text-slate-500">
                              {source.funnels.length} funnel{source.funnels.length === 1 ? "" : "s"}
                            </span>
                            <button
                              type="button"
                              title="Hide this source from the data set view"
                              className="ml-1 rounded-full p-1 text-slate-500 transition-colors hover:bg-white/10 hover:text-white"
                              onClick={(event) => {
                                event.stopPropagation();
                                hideSource(source.source_group);
                              }}
                            >
                              <EyeOff className="h-3.5 w-3.5" />
                            </button>
                          </span>
                        </TableCell>
                        <TableCell className="font-medium text-white">{source.total}</TableCell>
                        <TableCell className="font-medium text-emerald-200">{source.won}</TableCell>
                        <TableCell className="font-medium text-rose-200">{source.lost}</TableCell>
                        <TableCell>{source.open}</TableCell>
                        <TableCell>{formatPercent(source.won, source.total)}</TableCell>
                        <TableCell>{formatPercent(source.won, source.won + source.lost)}</TableCell>
                        <TableCell className="font-medium text-white">{formatAed(source.revenue)}</TableCell>
                      </TableRow>
                      {isExpanded
                        ? source.funnels.map((funnel) => (
                            <TableRow key={`${source.source_group}-${funnel.funnel_key}`}>
                              <TableCell className="pl-12 text-slate-300">
                                <span className="flex items-center gap-2">
                                  {funnel.funnel_key}
                                  <button
                                    type="button"
                                    title="Hide this funnel from the data set view"
                                    className="rounded-full p-1 text-slate-500 transition-colors hover:bg-white/10 hover:text-white"
                                    onClick={() => hideFunnel(funnel.source_group, funnel.funnel_key)}
                                  >
                                    <EyeOff className="h-3.5 w-3.5" />
                                  </button>
                                </span>
                              </TableCell>
                              <TableCell>{funnel.total}</TableCell>
                              <TableCell className="text-emerald-200">{funnel.won}</TableCell>
                              <TableCell className="text-rose-200">{funnel.lost}</TableCell>
                              <TableCell>{funnel.open}</TableCell>
                              <TableCell>{formatPercent(funnel.won, funnel.total)}</TableCell>
                              <TableCell>{formatPercent(funnel.won, funnel.won + funnel.lost)}</TableCell>
                              <TableCell>{formatAed(funnel.revenue)}</TableCell>
                            </TableRow>
                          ))
                        : null}
                    </Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(10,10,10,0.96))] p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-white">
          By month{selectedOwnerName ? ` — ${selectedOwnerName}` : ""}
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Lead intake and closed revenue by the month the lead was received.
        </p>
        <div className="mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead>Leads</TableHead>
                <TableHead>Won</TableHead>
                <TableHead>Lost</TableHead>
                <TableHead>Close rate (all)</TableHead>
                <TableHead>Close rate (decided)</TableHead>
                <TableHead>Revenue (ex VAT)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-slate-400">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : (
                (stats?.by_month ?? []).map((row) => (
                  <TableRow key={row.month}>
                    <TableCell className="font-medium text-white">{row.month}</TableCell>
                    <TableCell>{row.total}</TableCell>
                    <TableCell className="text-emerald-200">{row.won}</TableCell>
                    <TableCell className="text-rose-200">{row.lost}</TableCell>
                    <TableCell>{formatPercent(row.won, row.total)}</TableCell>
                    <TableCell>{formatPercent(row.won, row.won + row.lost)}</TableCell>
                    <TableCell>{formatAed(row.revenue)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <p className="text-xs text-slate-500">
        Notes: recent leads are naturally still open, so "close rate (all)" understates true performance for
        fresh periods — "close rate (decided)" (won ÷ won + lost) is the fairer number there. Won revenue only
        includes leads with a quoted amount; jobs done before the CRM existed (January–mid April) are not
        represented here. The g700 customizer is permanently excluded — it is a configurator for existing
        customers, not a lead source.
      </p>
    </AdminShell>
  );
};

export default AdminCloseRates;
