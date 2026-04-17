import { NavLink, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { KeyRound, Package, Activity, LogOut } from "lucide-react";

const nav = [
  { to: "/licenses", label: "LICENSES", icon: KeyRound },
  { to: "/products", label: "PRODUCTS", icon: Package },
  { to: "/activity", label: "ACTIVITY_LOG", icon: Activity },
];

export function Sidebar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <aside className="w-60 border-r border-border flex flex-shrink-0 flex-col bg-background">
      <div className="h-16 flex items-center px-6 border-b border-border">
        <div className="size-6 bg-primary rounded-sm mr-3 accent-glow" />
        <span className="font-bold tracking-tighter text-foreground uppercase text-sm">
          BLACK.PANEL
        </span>
      </div>
      <nav className="p-4 space-y-1 flex-1">
        <div className="text-[10px] font-bold text-muted-foreground tracking-[0.2em] mb-4 mt-2 px-2">
          PRIMARY_INTERFACE
        </div>
        {nav.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2 rounded-sm transition-colors text-sm font-medium",
                  isActive
                    ? "text-foreground bg-surface border-l-2 border-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-surface/50 border-l-2 border-transparent",
                )
              }
            >
              <Icon className="size-4" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
      <div className="mt-auto p-4 border-t border-border">
        <div className="flex items-center gap-3 px-2 mb-3">
          <div className="size-8 rounded bg-secondary flex items-center justify-center text-xs font-bold text-muted-foreground font-mono">
            {(user?.email?.[0] ?? "?").toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-foreground truncate">
              {user?.email ?? "—"}
            </p>
            <p className="text-[10px] text-muted-foreground truncate font-mono">
              SESSION_ACTIVE
            </p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-surface rounded-sm transition-colors"
        >
          <LogOut className="size-3.5" />
          <span className="font-mono">SIGN_OUT</span>
        </button>
      </div>
    </aside>
  );
}
