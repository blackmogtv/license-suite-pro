import { useState } from "react";
import { Modal, Button, Input, Label, Textarea } from "@/components/ui/primitives";
import { callManageKeys } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function CreateKeysModal({
  open,
  onClose,
  clientId,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  clientId: string;
  onCreated: () => void;
}) {
  const { user } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [duration, setDuration] = useState<string>("30"); // empty = lifetime
  const [createdBy, setCreatedBy] = useState(clientId);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        client_id: clientId,
        quantity,
        duration_days: duration === "" ? null : Number(duration),
        created_by: createdBy || clientId,
        note: note || undefined,
        actor: user?.email,
      };
      await callManageKeys("create_keys", payload);
      toast.success(`Generated ${quantity} key(s)`);
      onCreated();
      onClose();
      setQuantity(1);
      setNote("");
    } catch (err) {
      toast.error("Failed to create keys", { description: (err as Error).message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="GENERATE_BATCH"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            CANCEL
          </Button>
          <Button variant="primary" onClick={submit as any} disabled={loading}>
            {loading ? "..." : "GENERATE"}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label>SCOPE</Label>
          <Input value={clientId} disabled className="font-mono" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>QUANTITY</Label>
            <Input
              type="number"
              min={1}
              max={1000}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
            />
          </div>
          <div>
            <Label>DURATION (DAYS)</Label>
            <Input
              type="number"
              min={0}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="empty = lifetime"
            />
          </div>
        </div>
        <div>
          <Label>CREATED_BY</Label>
          <Input value={createdBy} onChange={(e) => setCreatedBy(e.target.value)} />
        </div>
        <div>
          <Label>NOTE (OPTIONAL)</Label>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. April batch" />
        </div>
      </form>
    </Modal>
  );
}

export function EditNoteModal({
  open,
  onClose,
  licenseKey,
  clientId,
  initialNote,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  licenseKey: string;
  clientId: string;
  initialNote: string;
  onSaved: (note: string) => void;
}) {
  const { user } = useAuth();
  const [note, setNote] = useState(initialNote);
  const [loading, setLoading] = useState(false);

  const save = async () => {
    setLoading(true);
    try {
      await callManageKeys("update_note", {
        client_id: clientId,
        license_key: licenseKey,
        note,
        actor: user?.email,
      });
      toast.success("Note updated");
      onSaved(note);
      onClose();
    } catch (err) {
      toast.error("Failed", { description: (err as Error).message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="EDIT_NOTE"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>CANCEL</Button>
          <Button variant="primary" onClick={save} disabled={loading}>
            {loading ? "..." : "SAVE"}
          </Button>
        </>
      }
    >
      <Label>NOTE</Label>
      <Textarea value={note} onChange={(e) => setNote(e.target.value)} />
    </Modal>
  );
}

export function ChangeDurationModal({
  open,
  onClose,
  licenseKey,
  clientId,
  initialDays,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  licenseKey: string;
  clientId: string;
  initialDays: number | null | undefined;
  onSaved: (days: number | null) => void;
}) {
  const { user } = useAuth();
  const [days, setDays] = useState<string>(initialDays == null ? "" : String(initialDays));
  const [loading, setLoading] = useState(false);

  const save = async () => {
    setLoading(true);
    try {
      const payload = days === "" ? null : Number(days);
      await callManageKeys("set_duration", {
        client_id: clientId,
        license_key: licenseKey,
        duration_days: payload,
        actor: user?.email,
      });
      toast.success("Duration updated");
      onSaved(payload);
      onClose();
    } catch (err) {
      toast.error("Failed", { description: (err as Error).message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="CHANGE_DURATION"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>CANCEL</Button>
          <Button variant="primary" onClick={save} disabled={loading}>
            {loading ? "..." : "SAVE"}
          </Button>
        </>
      }
    >
      <Label>DURATION (DAYS) — EMPTY = LIFETIME</Label>
      <Input
        type="number"
        min={0}
        value={days}
        onChange={(e) => setDays(e.target.value)}
        placeholder="lifetime"
      />
    </Modal>
  );
}

export function BanKeyModal({
  open,
  onClose,
  licenseKey,
  clientId,
  onBanned,
}: {
  open: boolean;
  onClose: () => void;
  licenseKey: string;
  clientId: string;
  onBanned: (reason: string) => void;
}) {
  const { user } = useAuth();
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      await callManageKeys("ban_key", {
        client_id: clientId,
        license_key: licenseKey,
        banned_reason: reason || "manual_ban",
        actor: user?.email,
      });
      toast.success("Key banned");
      onBanned(reason || "manual_ban");
      onClose();
      setReason("");
    } catch (err) {
      toast.error("Failed", { description: (err as Error).message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="BAN_KEY"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>CANCEL</Button>
          <Button variant="destructive" onClick={submit} disabled={loading}>
            {loading ? "..." : "BAN"}
          </Button>
        </>
      }
    >
      <Label>REASON</Label>
      <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. chargeback" />
    </Modal>
  );
}
