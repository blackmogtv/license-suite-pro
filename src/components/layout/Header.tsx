import { useLocation } from "react-router-dom";
import { useProducts } from "@/contexts/ProductContext";

export function Header({ action }: { action?: React.ReactNode }) {
  const location = useLocation();
  const { products, selected, setSelected } = useProducts();

  const segment = location.pathname.split("/").filter(Boolean)[0] ?? "licenses";

  return (
    <header className="h-16 border-b border-border flex items-center justify-between px-8 bg-background/80 backdrop-blur-md sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <div className="text-xs text-muted-foreground flex items-center gap-2 font-mono">
          <span>ROOT</span>
          <span className="opacity-30">/</span>
          <span className="text-foreground uppercase">{segment}</span>
        </div>
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-muted-foreground uppercase font-mono">
            SCOPE:
          </span>
          <select
            value={selected ?? ""}
            onChange={(e) => setSelected(e.target.value)}
            className="bg-surface border border-border text-xs text-foreground rounded px-2 py-1 outline-none ring-1 ring-primary/0 focus:ring-primary/50 transition-all cursor-pointer font-mono"
          >
            {products.length === 0 && <option value="">—</option>}
            {products.map((p) => (
              <option key={p.client_id} value={p.client_id}>
                {p.client_id}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex items-center gap-3">{action}</div>
    </header>
  );
}
