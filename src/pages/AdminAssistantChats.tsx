import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabase";

/**
 * Ask Grand Touch — transcript review.
 *
 * Every conversation and message the assistant has, so its answers can actually
 * be audited: what people ask, where it hedges, which questions it fumbles, and
 * which conversations turned into a number. The transcripts are the training
 * material for tuning the persona — read the ones that went nowhere first.
 */

interface Conversation {
  id: string;
  session_id: string;
  phone: string | null;
  full_name: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  vehicle_year: string | null;
  service_interest: string | null;
  program_interest: string | null;
  timeline: string | null;
  usage: string | null;
  possession: string | null;
  buyer_focus: string | null;
  message_count: number;
  intent_score: number;
  handoff_requested: boolean;
  off_topic: string | null;
  page_path: string | null;
  lead_id: string | null;
  created_at: string;
  last_message_at: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

const Pill = ({ label, tone = "muted" }: { label: string; tone?: "gold" | "green" | "muted" | "red" }) => {
  const tones = {
    gold: "border-amber-400/40 bg-amber-400/10 text-amber-300",
    green: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
    red: "border-red-400/40 bg-red-400/10 text-red-300",
    muted: "border-white/15 bg-white/5 text-white/60",
  };
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${tones[tone]}`}>
      {label}
    </span>
  );
};

const AdminAssistantChats = () => {
  const [rows, setRows] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "captured" | "no_lead" | "price" | "quality">("all");

  const load = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    const { data } = await supabase
      .from("gt_assistant_conversations")
      .select("*")
      .order("last_message_at", { ascending: false })
      .limit(300);
    setRows((data ?? []) as Conversation[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openThread = useCallback(async (conversation: Conversation) => {
    setSelected(conversation);
    setMessages([]);
    if (!supabase) return;
    const { data } = await supabase
      .from("gt_assistant_messages")
      .select("id, role, content, created_at")
      .eq("conversation_id", conversation.id)
      .order("created_at", { ascending: true });
    setMessages((data ?? []) as Message[]);
  }, []);

  const filtered = useMemo(() => {
    switch (filter) {
      case "captured":
        return rows.filter((r) => r.phone);
      // The most useful view for tuning: real conversations that never produced
      // a number. These are where the persona is losing people.
      case "no_lead":
        return rows.filter((r) => !r.phone && r.message_count >= 4);
      case "price":
        return rows.filter((r) => r.buyer_focus === "price");
      case "quality":
        return rows.filter((r) => r.buyer_focus === "quality");
      default:
        return rows;
    }
  }, [rows, filter]);

  const stats = useMemo(() => {
    const total = rows.length;
    const captured = rows.filter((r) => r.phone).length;
    const engaged = rows.filter((r) => r.message_count >= 4).length;
    return {
      total,
      captured,
      engaged,
      rate: engaged ? Math.round((captured / engaged) * 100) : 0,
    };
  }, [rows]);

  /** The drop-off ladder, from fields stamped on the conversation row — each
   *  station is where the ones missing from the next station walked. */
  const funnelStations = useMemo(() => {
    const total = rows.length;
    const carKnown = rows.filter((r) => r.vehicle_make || r.vehicle_model).length;
    const engaged = rows.filter((r) => r.message_count >= 4).length;
    const captured = rows.filter((r) => r.phone).length;
    return [
      { label: "Started", count: total },
      { label: "Engaged (4+ msgs)", count: engaged },
      { label: "Car known", count: carKnown },
      { label: "Number captured", count: captured },
    ].map((s) => ({ ...s, pct: total ? Math.round((s.count / total) * 100) : 0 }));
  }, [rows]);

  return (
    <AdminShell
      title="Ask Grand Touch — chats"
      description="Every conversation the site assistant has had, with the transcript and what it managed to qualify. Read the 'engaged, no number' view first: those are the conversations where the persona is losing people, and they are the material for improving it."
    >
      <div className="flex flex-wrap items-center gap-3">
        <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <SelectTrigger className="w-[240px] border-white/10 bg-black/20 text-white">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All conversations</SelectItem>
            <SelectItem value="captured">Captured a number</SelectItem>
            <SelectItem value="no_lead">Engaged, no number</SelectItem>
            <SelectItem value="price">Read as price-focused</SelectItem>
            <SelectItem value="quality">Read as quality-focused</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => void load()} className="border-white/10 bg-black/20 text-white">
          Refresh
        </Button>
        <div className="ml-auto flex gap-5 text-xs text-white/60">
          <span>
            <b className="text-white">{stats.total}</b> chats
          </span>
          <span>
            <b className="text-white">{stats.engaged}</b> engaged (4+ msgs)
          </span>
          <span>
            <b className="text-amber-300">{stats.captured}</b> numbers
          </span>
          <span>
            <b className="text-white">{stats.rate}%</b> capture rate
          </span>
        </div>
      </div>

      {/* Drop-off ladder: the gap between adjacent bars is where people walk. */}
      {rows.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {funnelStations.map((s, i) => (
            <div key={s.label} className="rounded-xl border border-white/10 bg-black/20 p-3">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[11px] uppercase tracking-wide text-white/50">{s.label}</span>
                <span className="text-[11px] text-white/40">{s.pct}%</span>
              </div>
              <p className="mt-1 text-xl font-semibold text-white">{s.count}</p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full rounded-full ${i === funnelStations.length - 1 ? "bg-emerald-400" : "bg-amber-400/80"}`}
                  style={{ width: `${s.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.15fr_1fr]">
        {/* list */}
        <div className="overflow-hidden rounded-xl border border-white/10 bg-black/20">
          <div className="max-h-[70vh] overflow-y-auto">
            {loading && <p className="p-5 text-sm text-white/50">Loading…</p>}
            {!loading && filtered.length === 0 && (
              <p className="p-5 text-sm text-white/50">No conversations match this filter yet.</p>
            )}
            {filtered.map((c) => {
              const car = [c.vehicle_year, c.vehicle_make, c.vehicle_model].filter(Boolean).join(" ");
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => void openThread(c)}
                  className={`block w-full border-b border-white/5 px-4 py-3 text-left transition hover:bg-white/[0.04] ${
                    selected?.id === c.id ? "bg-white/[0.06]" : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">
                      {c.full_name || car || "Anonymous visitor"}
                    </span>
                    {c.phone && <Pill label={c.phone} tone="green" />}
                    {c.handoff_requested && <Pill label="wants human" tone="red" />}
                    {c.off_topic && <Pill label={c.off_topic} tone="red" />}
                    <span className="ml-auto text-[11px] text-white/40">{fmtDate(c.last_message_at)}</span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    {car && <Pill label={car} />}
                    {c.program_interest && <Pill label={c.program_interest} tone="gold" />}
                    {c.buyer_focus && <Pill label={c.buyer_focus} />}
                    {c.usage && <Pill label={c.usage.replace("_", " ")} />}
                    {c.possession && <Pill label={c.possession === "on_order" ? "on order" : "has car"} />}
                    {c.timeline && <Pill label={c.timeline.replace("_", " ")} />}
                    <span className="ml-auto text-[11px] text-white/40">
                      {c.message_count} msgs · intent {c.intent_score}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* transcript */}
        <div className="overflow-hidden rounded-xl border border-white/10 bg-black/20">
          {!selected ? (
            <p className="p-5 text-sm text-white/50">Pick a conversation to read the transcript.</p>
          ) : (
            <>
              <div className="border-b border-white/10 px-5 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-white">
                    {selected.full_name || "Anonymous visitor"}
                  </span>
                  {selected.phone && <Pill label={selected.phone} tone="green" />}
                  {selected.lead_id && (
                    <Link
                      to={`/admin/leads?lead=${selected.lead_id}`}
                      className="text-[11px] text-amber-300 underline underline-offset-4"
                    >
                      open in CRM
                    </Link>
                  )}
                </div>
                <p className="mt-1 text-[11px] text-white/45">
                  {selected.page_path} · started {fmtDate(selected.created_at)} · session {selected.session_id}
                </p>
              </div>
              <div className="max-h-[62vh] space-y-3 overflow-y-auto px-5 py-4">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`max-w-[88%] rounded-xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                      m.role === "user"
                        ? "ml-auto bg-amber-400/10 text-white"
                        : "mr-auto border border-white/10 bg-white/[0.03] text-white/80"
                    }`}
                  >
                    {m.content.split("\n").map((line, i) => (
                      <p key={i} className={i ? "mt-2" : ""}>
                        {line}
                      </p>
                    ))}
                  </div>
                ))}
                {messages.length === 0 && <p className="text-sm text-white/50">Loading transcript…</p>}
              </div>
            </>
          )}
        </div>
      </div>
    </AdminShell>
  );
};

export default AdminAssistantChats;
