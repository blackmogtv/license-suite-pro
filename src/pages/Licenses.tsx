import { useEffect, useMemo, useRef, useState } from "react";
import { Header } from "@/components/layout/Header";
import { useProducts } from "@/contexts/ProductContext";
import { useAuth } from "@/contexts/AuthContext";
import { callManageKeys } from "@/lib/supabase";
import type { LicenseKey } from "@/lib/types";
import { LicenseCard } from "@/components/licenses/LicenseCard";
import { Button, ConfirmModal, Input } from "@/components/ui/primitives";
import { CreateKeysModal, EditNoteModal, ChangeDurationModal, BanKeyModal } from "@/components/licenses/KeyModals";
import { KeyDetailsDrawer } from "@/components/licenses/KeyDetailsDrawer";
import { Search, LayoutGrid, List, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { deriveStatus, StatusBadge } from "@/components/licenses/StatusBadge";

const PAGE_SIZE = 25;

export default function Licenses() {
  const { selected } = useProducts();
  const { user } = useAuth();
  const [keys, setKeys] = useState<LicenseKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [activeKey, setActiveKey] = useState<LicenseKey | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editNoteOpen, setEditNoteOpen] = useState(false);
  const [changeDurationOpen, setChangeDurationOpen] = useState(false);
  const [banOpen, setBanOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [resetHwidOpen, setResetHwidOpen] = useState(false);

  // Debounce search
  const t = useRef<number | null>(null);
  useEffect(() => {
    if (t.current) window.clearTimeout(t.current);
    t.current = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 300);
    return () => {
      if (t.current) window.clearTimeout(t.current);
    };
  }, [search]);

  const fetchKeys = async () => {
    if (!selected) return;
    setLoading(true);
    setError(null);
    try {
      const data = await callManageKeys<{ keys?: LicenseKey[] } | LicenseKey[]>("list_keys", {
        client_id: selected,
        search: debouncedSearch,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      });
      const list: LicenseKey[] = Array.isArray(data) ? data : (data?.keys ?? []);
      setKeys(list);
      setHasMore(list.length === PAGE_SIZE);
    } catch (err) {
      setError((err as Error).message);
      setKeys([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, debouncedSearch, page]);

  const stats = useMemo(() => {
    let used = 0,
      banned = 0;
    keys.forEach((k) => {
      const s = deriveStatus(k);
      if (s === "USED") used++;
      if (s === "BANNED") banned++;
    });
    return { used, banned, total: keys.length };
  }, [keys]);

  const optimisticUpdate = (license_key: string, patch: Partial<LicenseKey>) => {
    setKeys((prev) =>
      prev.map((k) => (k.license_key === license_key ? { ...k, ...patch } : k)),
    );
  };

  const handleResetHwid = async () => {
    if (!activeKey || !selected) return;
    try {
      await callManageKeys("reset_hwid", {
        client_id: selected,
        license_key: activeKey.license_key,
        actor: user?.email,
      });
      optimisticUpdate(activeKey.license_key, { hwid: null });
      toast.success("HWID reset");
    } catch (err) {
      toast.error("Failed", { description: (err as Error).message });
    }
  };

  const handleUnban = async (k: LicenseKey) => {
    if (!selected) return;
    try {
      await callManageKeys("unban_key", {
        client_id: selected,
        license_key: k.license_key,
        actor: user?.email,
      });
      optimisticUpdate(k.license_key, { banned: false, banned_reason: null, status: "UNUSED" });
      toast.success("Key unbanned");
    } catch (err) {
      toast.error("Failed", { description: (err as Error).message });
    }
  };

  const handleDelete = async () => {
    if (!activeKey || !selected) return;
    try {
      await callManageKeys("delete_key", {
        client_id: selected,
        license_key: activeKey.license_key,
        actor: user?.email,
      });
      setKeys((prev) => prev.filter((k) => k.license_key !== activeKey.license_key));
      toast.success("Key deleted");
    } catch (err) {
      toast.error("Failed", { description: (err as Error).message });
    }
  };

  return (
    <>
      <Header
        action={
          <Button
            variant="primary"
            onClick={() => setCreateOpen(true)}
            disabled={!selected}
          >
            GENERATE_BATCH
          </Button>
        }
      />

      <div className="flex-1 p-8 radar-grid overflow-y-auto">
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              LICENSE_MANIFEST
            </h1>
            <p className="text-sm text-muted-foreground mt-1 font-mono">
              {selected ? `Scope: ${selected}` : "No product selected"} ·{" "}
              {stats.total} loaded
            </p>
          </div>
          <div className="flex gap-2">
            <Stat label="LOADED" value={stats.total} />
            <Stat label="USED" value={stats.used} accent="text-status-used" />
            <Stat label="BANNED" value={stats.banned} accent="text-status-banned" />
          </div>
        </div>

        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search keys, HWID, user..."
              className="pl-9 font-mono"
            />
          </div>
          <div className="flex bg-surface border border-border rounded-sm">
            <button
              onClick={() => setView("grid")}
              className={cn(
                "p-2 transition-colors",
                view === "grid" ? "text-primary bg-accent" : "text-muted-foreground hover:text-foreground",
              )}
              title="Grid"
            >
              <LayoutGrid className="size-4" />
            </button>
            <button
              onClick={() => setView("list")}
              className={cn(
                "p-2 transition-colors",
                view === "list" ? "text-primary bg-accent" : "text-muted-foreground hover:text-foreground",
              )}
              title="List"
            >
              <List className="size-4" />
            </button>
          </div>
        </div>

        {loading && (
          <div className="text-center py-16 text-muted-foreground font-mono text-xs animate-pulse tracking-widest">
            LOADING_KEYS...
          </div>
        )}
        {error && !loading && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-sm p-4 text-sm text-destructive font-mono">
            ERROR: {error}
          </div>
        )}
        {!loading && !error && keys.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground font-mono text-sm">NO_KEYS_FOUND</p>
            <p className="text-muted-foreground/60 text-xs mt-1">
              Generate a batch to get started.
            </p>
          </div>
        )}

        {!loading && !error && keys.length > 0 && view === "grid" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {keys.map((k) => (
              <LicenseCard
                key={k.license_key}
                k={k}
                onCopy={() => {}}
                onResetHwid={(kk) => {
                  setActiveKey(kk);
                  setResetHwidOpen(true);
                }}
                onBan={(kk) => {
                  setActiveKey(kk);
                  setBanOpen(true);
                }}
                onUnban={handleUnban}
                onEditNote={(kk) => {
                  setActiveKey(kk);
                  setEditNoteOpen(true);
                }}
                onChangeDuration={(kk) => {
                  setActiveKey(kk);
                  setChangeDurationOpen(true);
                }}
                onDelete={(kk) => {
                  setActiveKey(kk);
                  setDeleteOpen(true);
                }}
                onOpen={(kk) => {
                  setActiveKey(kk);
                  setDetailsOpen(true);
                }}
              />
            ))}
          </div>
        )}

        {!loading && !error && keys.length > 0 && view === "list" && (
          <div className="border border-border rounded-sm overflow-hidden bg-surface">
            <table className="w-full font-mono text-xs">
              <thead>
                <tr className="bg-background/40 text-muted-foreground border-b border-border">
                  <th className="text-left p-3 font-normal">KEY</th>
                  <th className="text-left p-3 font-normal">STATUS</th>
                  <th className="text-left p-3 font-normal">DURATION</th>
                  <th className="text-left p-3 font-normal">USED_BY</th>
                  <th className="text-left p-3 font-normal">HWID</th>
                  <th className="text-left p-3 font-normal">CREATED</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {keys.map((k) => (
                  <tr
                    key={k.license_key}
                    onClick={() => {
                      setActiveKey(k);
                      setDetailsOpen(true);
                    }}
                    className="hover:bg-accent/40 cursor-pointer"
                  >
                    <td className="p-3 text-foreground">{k.license_key}</td>
                    <td className="p-3"><StatusBadge status={deriveStatus(k)} /></td>
                    <td className="p-3 text-muted-foreground">
                      {k.duration_days == null ? "LIFETIME" : `${k.duration_days}d`}
                    </td>
                    <td className="p-3 text-muted-foreground">{k.used_by ?? "—"}</td>
                    <td className="p-3 text-muted-foreground truncate max-w-[160px]">{k.hwid ?? "—"}</td>
                    <td className="p-3 text-muted-foreground">{k.created_at?.slice(0, 10) ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {(page > 0 || hasMore) && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-xs text-muted-foreground font-mono">
              PAGE {page + 1}
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                <ChevronLeft className="size-3 mr-1" />
                PREV
              </Button>
              <Button
                variant="secondary"
                disabled={!hasMore}
                onClick={() => setPage((p) => p + 1)}
              >
                NEXT
                <ChevronRight className="size-3 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {selected && (
        <CreateKeysModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          clientId={selected}
          onCreated={() => {
            setPage(0);
            fetchKeys();
          }}
        />
      )}

      {activeKey && selected && (
        <>
          <KeyDetailsDrawer
            open={detailsOpen}
            onClose={() => setDetailsOpen(false)}
            licenseKey={activeKey}
            clientId={selected}
          />
          <EditNoteModal
            open={editNoteOpen}
            onClose={() => setEditNoteOpen(false)}
            licenseKey={activeKey.license_key}
            clientId={selected}
            initialNote={activeKey.note ?? ""}
            onSaved={(note) => optimisticUpdate(activeKey.license_key, { note })}
          />
          <ChangeDurationModal
            open={changeDurationOpen}
            onClose={() => setChangeDurationOpen(false)}
            licenseKey={activeKey.license_key}
            clientId={selected}
            initialDays={activeKey.duration_days}
            onSaved={(days) => optimisticUpdate(activeKey.license_key, { duration_days: days })}
          />
          <BanKeyModal
            open={banOpen}
            onClose={() => setBanOpen(false)}
            licenseKey={activeKey.license_key}
            clientId={selected}
            onBanned={(reason) =>
              optimisticUpdate(activeKey.license_key, {
                banned: true,
                banned_reason: reason,
                status: "BANNED",
              })
            }
          />
          <ConfirmModal
            open={deleteOpen}
            onClose={() => setDeleteOpen(false)}
            onConfirm={handleDelete}
            title="DELETE_KEY"
            message={`Permanently delete ${activeKey.license_key}? This cannot be undone.`}
            confirmLabel="DELETE"
            destructive
          />
          <ConfirmModal
            open={resetHwidOpen}
            onClose={() => setResetHwidOpen(false)}
            onConfirm={handleResetHwid}
            title="RESET_HWID"
            message={`Reset hardware ID binding for ${activeKey.license_key}?`}
            confirmLabel="RESET"
          />
        </>
      )}
    </>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="bg-surface border border-border px-3 py-2 rounded-sm flex flex-col min-w-28">
      <span className="text-[9px] font-bold text-muted-foreground font-mono">{label}</span>
      <span className={cn("font-mono text-lg tabular-nums", accent ?? "text-foreground")}>
        {String(value).padStart(4, "0")}
      </span>
    </div>
  );
}
