import { cn } from "@/lib/utils";
import type { KeyStatus } from "@/lib/types";

const styles: Record<string, string> = {
  USED: "bg-status-used/10 text-status-used",
  UNUSED: "bg-status-unused/10 text-status-unused",
  BANNED: "bg-status-banned/10 text-status-banned",
  EXPIRED: "bg-status-expired/10 text-status-expired",
};

const accents: Record<string, string> = {
  USED: "bg-status-used",
  UNUSED: "bg-status-unused",
  BANNED: "bg-status-banned",
  EXPIRED: "bg-status-expired",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const s = (status ?? "UNUSED").toUpperCase();
  return (
    <span
      className={cn(
        "text-[10px] font-bold px-1.5 py-0.5 rounded-sm uppercase font-mono tracking-wider",
        styles[s] ?? styles.UNUSED,
        className,
      )}
    >
      {s}
    </span>
  );
}

export function statusAccent(status: string) {
  const s = (status ?? "UNUSED").toUpperCase();
  return accents[s] ?? accents.UNUSED;
}

export function deriveStatus(key: {
  banned?: boolean;
  used_by?: string | null;
  hwid?: string | null;
  expires_at?: string | null;
  status?: string;
}): KeyStatus {
  if (key.status) {
    const s = key.status.toUpperCase();
    if (["USED", "UNUSED", "BANNED", "EXPIRED"].includes(s)) return s as KeyStatus;
  }
  if (key.banned) return "BANNED";
  if (key.expires_at && new Date(key.expires_at).getTime() < Date.now()) return "EXPIRED";
  if (key.used_by || key.hwid) return "USED";
  return "UNUSED";
}
