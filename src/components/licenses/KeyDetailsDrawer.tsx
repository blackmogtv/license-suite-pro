import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/primitives";
import { callManageKeys } from "@/lib/supabase";
import { normalizeLicenseKey, normalizeKeyEvent, type LicenseKey, type KeyEvent } from "@/lib/types";
import { StatusBadge, deriveStatus } from "./StatusBadge";
import { formatDate, formatDuration } from "@/lib/utils";

export function KeyDetailsDrawer({
  open,
  onClose,
  licenseKey,
  clientId,
}: {
  open: boolean;
  onClose: () => void;
  licenseKey: LicenseKey | null;
  clientId: string;
}) {
  const [details, setDetails] = useState<LicenseKey | null>(licenseKey);
  const [events, setEvents] = useState<KeyEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !licenseKey) return;
    setDetails(licenseKey);
    setEvents([]);
    setError(null);
    setLoading(true);
    callManageKeys<{ key?: LicenseKey; events?: KeyEvent[] } & LicenseKey>("get_key", {
      client_id: clientId,
      license_key: licenseKey.license_key,
    })
      .then((res: any) => {
        const k = res?.key ?? (res?.license_key ? res : null);
        if (k) setDetails(normalizeLicenseKey(k));
        const evs = res?.events ?? res?.history ?? [];
        if (Array.isArray(evs)) setEvents(evs.map(normalizeKeyEvent));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [open, licenseKey, clientId]);

  if (!licenseKey) return null;
  const k = details ?? licenseKey;
  const status = deriveStatus(k);

  return (
    <Modal open={open} onClose={onClose} title="KEY_INSPECT" size="xl">
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="font-mono text-lg text-foreground tracking-wider bg-background/60 p-3 rounded-sm border border-border break-all">
              {k.license_key}
            </div>
          </div>
          <StatusBadge status={status} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Field label="CLIENT_ID" value={k.client_id} mono />
          <Field label="CREATED" value={formatDate(k.created_at)} mono />
          <Field label="DURATION" value={formatDuration(k.duration_days)} />
          <Field label="GENERATED_BY" value={k.generated_by ?? "-"} mono />
          <Field label="USED_BY" value={k.used_by ?? "-"} mono />
          <Field label="FIRST_USED" value={k.used_at ? formatDate(k.used_at) : "-"} mono />
          <Field label="LAST_USED" value={k.last_used_at ? formatDate(k.last_used_at) : "-"} mono />
          <Field label="LAST_VALIDATED" value={k.last_validation_at ? formatDate(k.last_validation_at) : "-"} mono />
          <Field label="EXPIRES_AT" value={k.expires_at ? formatDate(k.expires_at) : "LIFETIME"} mono />
          <div className="col-span-2 md:col-span-3">
            <Field label="HWID" value={k.hwid ?? "UNASSIGNED_NULL"} mono />
          </div>
          {k.note && (
            <div className="col-span-2 md:col-span-3">
              <Field label="NOTE" value={k.note} />
            </div>
          )}
          {k.banned_reason && (
            <div className="col-span-2 md:col-span-3">
              <Field label="BANNED_REASON" value={k.banned_reason} mono />
            </div>
          )}
        </div>

        <div>
          <h3 className="font-mono text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
            EVENT_HISTORY
          </h3>
          {loading && (
            <div className="text-xs text-muted-foreground font-mono animate-pulse">LOADING...</div>
          )}
          {error && <div className="text-xs text-destructive font-mono">{error}</div>}
          {!loading && !error && events.length === 0 && (
            <div className="text-xs text-muted-foreground font-mono italic">NO_EVENTS_RECORDED</div>
          )}
          {events.length > 0 && (
            <div className="border border-border rounded-sm overflow-hidden">
              <table className="w-full font-mono text-xs">
                <thead>
                  <tr className="bg-background/40 text-muted-foreground border-b border-border">
                    <th className="text-left p-2 font-normal">TIMESTAMP</th>
                    <th className="text-left p-2 font-normal">EVENT</th>
                    <th className="text-left p-2 font-normal">ACTOR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {events.map((e, i) => (
                    <tr key={e.id ?? i} className="hover:bg-accent/50">
                      <td className="p-2 text-muted-foreground">{formatDate(e.created_at)}</td>
                      <td className="p-2 text-foreground">{e.event_type ?? "—"}</td>
                      <td className="p-2 text-muted-foreground">{e.actor ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-[9px] font-bold text-muted-foreground font-mono mb-1">{label}</p>
      <p className={`text-sm break-all ${mono ? "font-mono" : ""} text-foreground`}>{value}</p>
    </div>
  );
}
