import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { useProducts } from "@/contexts/ProductContext";
import { useAuth } from "@/contexts/AuthContext";
import { callManageKeys } from "@/lib/supabase";
import { Button, Input, Label, Modal } from "@/components/ui/primitives";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function Products() {
  const { products, refresh, loading } = useProducts();
  const { user } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const [newId, setNewId] = useState("");
  const [newName, setNewName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submitCreate = async () => {
    setSubmitting(true);
    try {
      await callManageKeys("create_product", {
        client_id: newId,
        display_name: newName || newId,
        description: "",
        is_active: true,
        actor: user?.email,
      });
      toast.success("Product created");
      setCreateOpen(false);
      setNewId("");
      setNewName("");
      refresh();
    } catch (err) {
      toast.error("Failed", { description: (err as Error).message });
    } finally {
      setSubmitting(false);
    }
  };

  const toggle = async (p: { client_id: string; name?: string; is_active: boolean }) => {
    try {
      await callManageKeys("create_product", {
        client_id: p.client_id,
        display_name: p.name || p.client_id,
        description: "",
        is_active: !p.is_active,
        actor: user?.email,
      });
      toast.success(`Product ${!p.is_active ? "activated" : "deactivated"}`);
      refresh();
    } catch (err) {
      toast.error("Failed", { description: (err as Error).message });
    }
  };

  return (
    <>
      <Header
        action={
          <Button variant="primary" onClick={() => setCreateOpen(true)}>
            CREATE_PRODUCT
          </Button>
        }
      />
      <div className="flex-1 p-8 radar-grid overflow-y-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            PRODUCT_REGISTRY
          </h1>
          <p className="text-sm text-muted-foreground mt-1 font-mono">
            {products.length} product(s) registered
          </p>
        </div>

        {loading && (
          <div className="text-center py-16 text-muted-foreground font-mono text-xs animate-pulse">
            LOADING...
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((p) => (
            <div
              key={p.client_id}
              className="bg-surface border border-border p-5 rounded-sm relative"
            >
              <div
                className={cn(
                  "absolute top-0 left-0 w-1 h-full rounded-l-sm",
                  p.is_active ? "bg-status-used" : "bg-muted",
                )}
              />
              <div className="flex items-start justify-between mb-3">
                <span
                  className={cn(
                    "text-[10px] font-bold px-1.5 py-0.5 rounded-sm uppercase font-mono tracking-wider",
                    p.is_active
                      ? "bg-status-used/10 text-status-used"
                      : "bg-muted/30 text-muted-foreground",
                  )}
                >
                  {p.is_active ? "ACTIVE" : "INACTIVE"}
                </span>
              </div>
              <h3 className="font-mono text-foreground text-sm font-bold mb-1">
                {p.client_id}
              </h3>
              {p.name && p.name !== p.client_id && (
                <p className="text-xs text-muted-foreground mb-4">{p.name}</p>
              )}
              <Button
                variant="secondary"
                onClick={() => toggle(p.client_id, p.is_active)}
                className="w-full mt-4"
              >
                {p.is_active ? "DEACTIVATE" : "ACTIVATE"}
              </Button>
            </div>
          ))}
        </div>
      </div>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="CREATE_PRODUCT"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateOpen(false)} disabled={submitting}>
              CANCEL
            </Button>
            <Button
              variant="primary"
              onClick={submitCreate}
              disabled={submitting || !newId.trim()}
            >
              {submitting ? "..." : "CREATE"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <Label>CLIENT_ID</Label>
            <Input
              value={newId}
              onChange={(e) => setNewId(e.target.value.toUpperCase())}
              placeholder="BLACK_NEW_PRODUCT"
              className="font-mono"
            />
          </div>
          <div>
            <Label>DISPLAY_NAME (OPTIONAL)</Label>
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} />
          </div>
        </div>
      </Modal>
    </>
  );
}
