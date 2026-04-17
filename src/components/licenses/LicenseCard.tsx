import { useState } from "react";
import { MoreVertical, Copy, Ban, RotateCcw, Edit3, Clock, Trash2, ShieldCheck } from "lucide-react";
import type { LicenseKey } from "@/lib/types";
import { StatusBadge, statusAccent, deriveStatus } from "./StatusBadge";
import { cn, formatDate, formatDuration } from "@/lib/utils";
import { toast } from "sonner";

interface Props {
  k: LicenseKey;
  onCopy: (k: LicenseKey) => void;
  onResetHwid: (k: LicenseKey) => void;
  onBan: (k: LicenseKey) => void;
  onUnban: (k: LicenseKey) => void;
  onEditNote: (k: LicenseKey) => void;
  onChangeDuration: (k: LicenseKey) => void;
  onDelete: (k: LicenseKey) => void;
  onOpen: (k: LicenseKey) => void;
}

export function LicenseCard({
  k,
  onCopy,
  onResetHwid,
  onBan,
  onUnban,
  onEditNote,
  onChangeDuration,
  onDelete,
  onOpen,
}: Props) {
  const [open, setOpen] = useState(false);
  const status = deriveStatus(k);
  const banned = status === "BANNED";

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(k.license_key);
    toast.success("Key copied", { description: k.license_key });
    onCopy(k);
  };

  return (
    <div
      onClick={() => onOpen(k)}
      className="bg-surface border border-border p-4 relative group hover:border-muted-foreground/30 transition-colors cursor-pointer animate-fade-in rounded-sm"
    >
      <div className={cn("absolute top-0 left-0 w-1 h-full rounded-l-sm", statusAccent(status))} />

      <div className="flex justify-between items-start mb-3">
        <StatusBadge status={status} />
        <div className="flex items-center gap-1">
          <span className="font-mono text-[10px] text-muted-foreground">
            {formatDate(k.created_at)}
          </span>
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setOpen((v) => !v)}
              className="p-1 text-muted-foreground hover:text-foreground rounded-sm hover:bg-accent"
            >
              <MoreVertical className="size-3.5" />
            </button>
            {open && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
                <div className="absolute right-0 top-7 z-30 w-48 bg-popover border border-border rounded-sm shadow-xl py-1 font-mono text-xs animate-fade-in">
                  <MenuItem icon={Copy} label="COPY_KEY" onClick={() => { setOpen(false); handleCopy({ stopPropagation() {} } as React.MouseEvent); }} />
                  <MenuItem icon={RotateCcw} label="RESET_HWID" onClick={() => { setOpen(false); onResetHwid(k); }} />
                  {banned ? (
                    <MenuItem icon={ShieldCheck} label="UNBAN" onClick={() => { setOpen(false); onUnban(k); }} />
                  ) : (
                    <MenuItem icon={Ban} label="BAN" onClick={() => { setOpen(false); onBan(k); }} danger />
                  )}
                  <MenuItem icon={Edit3} label="EDIT_NOTE" onClick={() => { setOpen(false); onEditNote(k); }} />
                  <MenuItem icon={Clock} label="CHANGE_DURATION" onClick={() => { setOpen(false); onChangeDuration(k); }} />
                  <div className="h-px bg-border my-1" />
                  <MenuItem icon={Trash2} label="DELETE" onClick={() => { setOpen(false); onDelete(k); }} danger />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div
        onClick={handleCopy}
        title="Click to copy"
        className={cn(
          "font-mono text-foreground text-sm tracking-wider mb-4 bg-background/60 p-2 rounded-sm border border-border/50 group-hover:border-primary/30 transition-colors truncate",
          banned && "line-through text-foreground/40",
        )}
      >
        {k.license_key}
      </div>

      <div className="grid grid-cols-2 gap-y-3">
        <Field label="DURATION" value={formatDuration(k.duration_days)} />
        <Field label="GENERATED_BY" value={k.generated_by ?? "—"} mono />
        <Field
          label="USED_BY"
          value={k.used_by ?? "—"}
          mono
          muted={!k.used_by}
        />
        <Field label="USED_ON" value={k.used_at ? formatDate(k.used_at) : "—"} mono muted={!k.used_at} />
        <div className="col-span-2">
          <Field label="HWID" value={k.hwid ?? "UNASSIGNED_NULL"} mono muted={!k.hwid} truncate />
        </div>
        {k.note && (
          <div className="col-span-2">
            <Field label="NOTE" value={k.note} truncate />
          </div>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  mono,
  muted,
  truncate,
}: {
  label: string;
  value: string;
  mono?: boolean;
  muted?: boolean;
  truncate?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[9px] font-bold text-muted-foreground font-mono">{label}</p>
      <p
        className={cn(
          "text-xs",
          mono && "font-mono",
          muted ? "text-muted-foreground" : "text-foreground",
          truncate && "truncate",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2 px-3 py-1.5 hover:bg-accent transition-colors text-left",
        danger ? "text-destructive" : "text-foreground",
      )}
    >
      <Icon className="size-3.5" />
      <span>{label}</span>
    </button>
  );
}
