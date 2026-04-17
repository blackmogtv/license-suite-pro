import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Activity as ActivityIcon, RefreshCw } from "lucide-react";
import { callManageKeys } from "@/lib/supabase";
import { useProducts } from "@/contexts/ProductContext";
import { type KeyEvent, normalizeKeyEvent } from "@/lib/types";
import { Button } from "@/components/ui/primitives";
import { formatDate, cn } from "@/lib/utils";

interface ActivityRow extends KeyEvent {
  product_name?: string;
}

type Filter = "all" | "valid" | "invalid";

const VALID_EVENTS = new Set([
  "valid_bound",
  "valid_existing_binding",
  "valid_rebound",
  "valid_unbound",
]);

const INVALID_EVENTS = new Set([
  "invalid_key",
  "unknown_product",
  "inactive_product",
  "hwid_mismatch",
  "expired",
  "banned",
]);

function classify(t?: string): "valid" | "invalid" | "other" {
  if (!t) return "other";
  const k = t.toLowerCase();
  if (VALID_EVENTS.has(k) || k.startsWith("valid_")) return "valid";
  if (INVALID_EVENTS.has(k)) return "invalid";
  return "other";
}

function eventAccent(t?: string) {
  const c = classify(t);
  if (c === "valid") return "text-status-used";
  if (c === "invalid") return "text-status-banned";
  return "text-foreground";
}

export default function Activity() {
  const { products } = useProducts();
  const [rows, setRows] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

  const productMap = useMemo(() => {
    const m = new Map<string, string>();
    products.forEach((p) => m.set(p.client_id, p.name || p.client_id));
    return m;
  }, [products]);

  const fetchActivity = async () => {
    setLoading(true);
    setError(null);
    try {
      const perProduct = await Promise.all(
        products.map(async (p) => {
          try {
            const data = await callManageKeys<any>("list_events", {
              client_id: p.client_id,
              limit: 100,
              offset: 0,
            });
            const raw: any[] = Array.isArray(data) ? data : (data?.items ?? data?.events ?? []);
            return raw.map((e) => normalizeKeyEvent({ ...e, client_id: e.client_id ?? p.client_id }) as ActivityRow);
          } catch {
            return [] as ActivityRow[];
          }
        }),
      );
      const collected: ActivityRow[] = perProduct.flat();

      collected.sort((a, b) => {
        const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
        const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
        return tb - ta;
      });

      setRows(
        collected.map((r) => ({
          ...r,
          product_name: r.client_id ? productMap.get(r.client_id) ?? r.client_id : undefined,
        })),
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (products.length > 0) fetchActivity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products.length]);

  const filteredRows = useMemo(() => {
    if (filter === "all") return rows;
    return rows.filter((r) => classify(r.event_type) === filter);
  }, [rows, filter]);

  const counts = useMemo(() => {
    let valid = 0, invalid = 0;
    for (const r of rows) {
      const c = classify(r.event_type);
      if (c === "valid") valid++;
      else if (c === "invalid") invalid++;
    }
    return { valid, invalid, all: rows.length };
  }, [rows]);

  const FilterBtn = ({ value, label, count }: { value: Filter; label: string; count: number }) => (
    <button
      type="button"
      onClick={() => setFilter(value)}
      className={cn(
        "px-3 py-1 rounded-sm border text-[10px] font-mono font-bold tracking-wider transition-colors",
        filter === value
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-surface text-muted-foreground border-border hover:text-foreground hover:border-muted-foreground/40",
      )}
    >
      {label} ({count})
    </button>
  );

  return (
    <>
      <Header
        action={
          <Button variant="secondary" onClick={fetchActivity} disabled={loading}>
            <RefreshCw className={cn("size-3 mr-1", loading && "animate-spin")} />
            REFRESH
          </Button>
        }
      />
      <div className="flex-1 p-8 radar-grid overflow-y-auto">
        <div className="mb-6 flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              ACTIVITY_STREAM
            </h1>
            <p className="text-sm text-muted-foreground mt-1 font-mono">
              Recent key validation events // {filteredRows.length} of {rows.length}
            </p>
          </div>
          <div className="flex gap-1">
            <FilterBtn value="all" label="ALL" count={counts.all} />
            <FilterBtn value="valid" label="VALID" count={counts.valid} />
            <FilterBtn value="invalid" label="INVALID" count={counts.invalid} />
          </div>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-sm p-4 text-sm text-destructive font-mono mb-4">
            ERROR: {error}
          </div>
        )}

        {loading && rows.length === 0 && (
          <div className="text-center py-16 text-muted-foreground font-mono text-xs animate-pulse tracking-widest">
            LOADING_ACTIVITY...
          </div>
        )}

        {!loading && filteredRows.length === 0 && !error && (
          <div className="bg-surface border border-border rounded-sm p-12 text-center">
            <ActivityIcon className="size-10 mx-auto text-muted-foreground mb-4" />
            <p className="font-mono text-sm text-muted-foreground">NO_EVENTS</p>
            <p className="text-xs text-muted-foreground/60 mt-2">
              Validation events will appear here as keys are used.
            </p>
          </div>
        )}

        {filteredRows.length > 0 && (
          <div className="border border-border rounded-sm overflow-hidden bg-surface">
            <table className="w-full font-mono text-xs">
              <thead>
                <tr className="bg-background/40 text-muted-foreground border-b border-border">
                  <th className="text-left p-3 font-normal">TIMESTAMP</th>
                  <th className="text-left p-3 font-normal">EVENT</th>
                  <th className="text-left p-3 font-normal">PRODUCT</th>
                  <th className="text-left p-3 font-normal">KEY</th>
                  <th className="text-left p-3 font-normal">USER</th>
                  <th className="text-left p-3 font-normal">HWID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRows.map((r, i) => (
                  <tr key={r.id ?? i} className="hover:bg-accent/40">
                    <td className="p-3 text-muted-foreground whitespace-nowrap">
                      {formatDate(r.created_at)}
                    </td>
                    <td className={cn("p-3 font-bold uppercase tracking-wider", eventAccent(r.event_type))}>
                      {r.event_type ?? "-"}
                    </td>
                    <td className="p-3 text-foreground">{r.product_name ?? r.client_id ?? "-"}</td>
                    <td className="p-3 text-muted-foreground truncate max-w-[200px]">
                      {r.license_key ?? "-"}
                    </td>
                    <td className="p-3 text-muted-foreground">{r.actor ?? "-"}</td>
                    <td className="p-3 text-muted-foreground truncate max-w-[160px]">
                      {r.hwid ?? "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
