import { Header } from "@/components/layout/Header";
import { Activity as ActivityIcon } from "lucide-react";

export default function Activity() {
  return (
    <>
      <Header />
      <div className="flex-1 p-8 radar-grid overflow-y-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            ACTIVITY_STREAM
          </h1>
          <p className="text-sm text-muted-foreground mt-1 font-mono">
            Per-key event history available via key inspect
          </p>
        </div>
        <div className="bg-surface border border-border rounded-sm p-12 text-center">
          <ActivityIcon className="size-10 mx-auto text-muted-foreground mb-4" />
          <p className="font-mono text-sm text-muted-foreground">
            GLOBAL_ACTIVITY_FEED — COMING_SOON
          </p>
          <p className="text-xs text-muted-foreground/60 mt-2">
            Open any license key to see its full audit trail.
          </p>
        </div>
      </div>
    </>
  );
}
