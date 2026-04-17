import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { callManageKeys } from "@/lib/supabase";
import type { Product } from "@/lib/types";
import { KNOWN_PRODUCTS } from "@/lib/types";
import { useAuth } from "./AuthContext";

interface ProductCtx {
  products: Product[];
  selected: string | null;
  setSelected: (id: string) => void;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  authorized: boolean;
}

const ProductContext = createContext<ProductCtx | undefined>(undefined);

export function ProductProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authorized, setAuthorized] = useState(true);

  const refresh = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError(null);
    try {
      const data = await callManageKeys<{ products?: any[]; items?: any[] } | any[]>("list_products");
      const raw: any[] = Array.isArray(data)
        ? data
        : (data?.items ?? data?.products ?? []);
      const list: Product[] = raw.map((p) => ({
        id: p.id,
        client_id: p.client_id,
        name: p.display_name ?? p.name ?? p.client_id,
        is_active: !!p.is_active,
        created_at: p.created_at,
      }));
      // Fallback: if backend returns nothing, surface the known product slugs as inactive placeholders.
      const final =
        list.length > 0
          ? list
          : KNOWN_PRODUCTS.map((c) => ({ client_id: c, name: c, is_active: true }));
      setProducts(final);
      setAuthorized(true);
      if (!selected) {
        const firstActive = final.find((p) => p.is_active) ?? final[0];
        if (firstActive) setSelected(firstActive.client_id);
      }
    } catch (e) {
      const err = e as Error & { status?: number };
      if (err.status === 401 || err.status === 403) {
        setAuthorized(false);
      }
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [session, selected]);

  useEffect(() => {
    if (session) refresh();
    else {
      setProducts([]);
      setSelected(null);
    }
  }, [session, refresh]);

  return (
    <ProductContext.Provider
      value={{ products, selected, setSelected, loading, error, refresh, authorized }}
    >
      {children}
    </ProductContext.Provider>
  );
}

export function useProducts() {
  const ctx = useContext(ProductContext);
  if (!ctx) throw new Error("useProducts must be used within ProductProvider");
  return ctx;
}
