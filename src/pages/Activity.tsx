import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Activity as ActivityIcon, RefreshCw } from "lucide-react";
import { callManageKeys } from "@/lib/supabase";
import { useProducts } from "@/contexts/ProductContext";
import { normalizeKeyEvent, type KeyEvent } from "@/lib/types";
import { Button } from "@/components/ui/primitives";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface ActivityRow extends KeyEvent {
  product_name?: string;
}

const EVENT_ACCENT: Record<string, string> = {
  used: "text-status-used",
  validated: "text-status-used",
  created: "text-status-unused",
  banned: "text-status-banned",
  unbanned: "text-status-used",
  reset_hwid: "text-status-expired",
  deleted: "text-destructive",
};

function eventAccent(t?: string) {
  if (!t) return "text-foreground";
  const k = t.toLowerCase();
  for (const [needle, cls] of Object.entries(EVENT_ACCENT)) {
    if (k.includes(needle)) return cls;
  }
  return "text-foreground";
}

export default function Activity() {
  const { products } = useProducts();
  const [rows, setRows] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const productMap = useMemo(() => {
    const m = new Map<string, string>();
    products.forEach((p) => m.set(p.client_id, p.name || p.client_id));
    return m;
  }, [products]);

  const fetchActivity = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fan out per product: backend requires client_id on every action.
      const perProduct = await Promise.all(
        products.map(async (p) => {
          // 1) Try a per-product list_events if the backend supports it.
          try {
            const data = await callManageKeys<any>("list_events", {
              client_id: p.client_id,
              limit: 50,
            });
            const raw: any[] = Array.isArray(data) ? data : (data?.items ?? data?.events ?? []);
            if (raw.length > 0) {
              return raw.map((e) => ({
                ...normalizeKeyEvent(e),
                client_id: e.client_id ?? p.client_id,
              })) as ActivityRow[];
            }
          } catch {
            // ignore and fall through to key-derived activity
          }

          // 2) Fallback: derive recent activity from keys' usage timestamps.
          try {
            const data = await callManageKeys<any>("list_keys", {
              client_id: p.client_id,
              limit: 50,
              offset: 0,
            });
            const raw: any[] = Array.isArray(data) ? data : (data?.items ?? data?.keys ?? []);
            return raw
              .filter((k) => k.last_used_at || k.first_used_at || k.used_at)
              .map((k) => ({
                id: `${p.client_id}:${k.license_key}`,
                created_at: k.last_used_at ?? k.first_used_at ?? k.used_at,
                event_type: "key_used",
                actor: k.user_label ?? k.used_by ?? null,
                license_key: k.license_key,
                client_id: p.client_id,
                hwid: k.hwid ?? null,
                details: { duration_days: k.duration_days, status: k.status },
              }) as ActivityRow);
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
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            ACTIVITY_STREAM
          </h1>
          <p className="text-sm text-muted-foreground mt-1 font-mono">
            Recent key usage across all products // {rows.length} event(s)
          </p>
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

        {!loading && rows.length === 0 && !error && (
          <div className="bg-surface border border-border rounded-sm p-12 text-center">
            <ActivityIcon className="size-10 mx-auto text-muted-foreground mb-4" />
            <p className="font-mono text-sm text-muted-foreground">NO_RECENT_ACTIVITY</p>
            <p className="text-xs text-muted-foreground/60 mt-2">
              Once keys are used, validated, or banned, events will appear here.
            </p>
          </div>
        )}

        {rows.length > 0 && (
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
                {rows.map((r, i) => (
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
