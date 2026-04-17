import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button, Input, Label } from "@/components/ui/primitives";
import { ShieldCheck } from "lucide-react";

export default function Login() {
  const { signIn, session } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (session) return <Navigate to="/licenses" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signIn(email, password);
      navigate("/licenses");
    } catch (err) {
      setError((err as Error).message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-background flex items-center justify-center p-4 radar-grid">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="size-12 bg-primary mx-auto mb-4 rounded-sm accent-glow flex items-center justify-center">
            <ShieldCheck className="size-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tighter uppercase">
            BLACK.PANEL
          </h1>
          <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest mt-1">
            Operator Authentication Required
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-surface border border-border p-6 rounded-sm space-y-4"
        >
          <div>
            <Label htmlFor="email">EMAIL</Label>
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operator@black.dev"
            />
          </div>
          <div>
            <Label htmlFor="password">PASSWORD</Label>
            <Input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="text-xs text-destructive font-mono bg-destructive/10 border border-destructive/20 p-2 rounded-sm">
              {error}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            className="w-full py-2.5"
          >
            {loading ? "AUTHENTICATING..." : "SIGN_IN"}
          </Button>

          <p className="text-[10px] text-muted-foreground font-mono text-center pt-2">
            UNAUTHORIZED_ACCESS_PROHIBITED
          </p>
        </form>
      </div>
    </div>
  );
}
