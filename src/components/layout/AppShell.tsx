import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ProductProvider, useProducts } from "@/contexts/ProductContext";
import { Sidebar } from "./Sidebar";
import { ShieldAlert } from "lucide-react";

function AuthGate() {
  const { authorized, loading, error } = useProducts();

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="font-mono text-xs text-muted-foreground tracking-widest animate-pulse">
          AUTHENTICATING...
        </div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="flex-1 flex items-center justify-center radar-grid">
        <div className="bg-surface border border-destructive/30 p-8 max-w-md text-center rounded-sm">
          <ShieldAlert className="size-10 mx-auto text-destructive mb-4" />
          <h2 className="text-foreground font-bold mb-2 font-mono uppercase">
            Access Denied
          </h2>
          <p className="text-muted-foreground text-sm">
            Your account is authenticated but not authorized to use this admin panel.
          </p>
          {error && (
            <p className="text-xs text-muted-foreground mt-4 font-mono">{error}</p>
          )}
        </div>
      </div>
    );
  }

  return <Outlet />;
}

export function AppShell() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <div className="font-mono text-xs text-muted-foreground tracking-widest animate-pulse">
          INITIALIZING...
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return (
    <ProductProvider>
      <div className="flex min-h-dvh">
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0">
          <AuthGate />
        </main>
      </div>
    </ProductProvider>
  );
}
