import { FormEvent, useState } from "react";
import { Navigate } from "react-router-dom";
import { api } from "@/client/lib/api";
import { useAuth } from "@/client/hooks/useAuth";

export function LoginPage() {
  const { status, loading, refresh } = useAuth();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!loading && status && (!status.required || status.authenticated)) {
    return <Navigate to="/" replace />;
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.login(password);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-full items-center justify-center px-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 30%, rgba(94,234,212,0.12), transparent 60%)",
        }}
      />
      <div className="panel-surface login-card relative w-full max-w-sm p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
        <div className="mb-1 text-[11px] font-semibold tracking-[0.16em] text-accent">
          NEPAR SERIES
        </div>
        <h1 className="mb-1 text-[22px] font-semibold tracking-tight">Studio access</h1>
        <p className="mb-5 text-[13px] text-[var(--text-muted)]">
          Internal Seedance production workspace.
        </p>
        <form onSubmit={(e) => void onSubmit(e)} className="space-y-3">
          <label className="block space-y-1.5">
            <span className="text-[12px] font-medium text-[var(--text-muted)]">Password</span>
            <input
              type="password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Workspace password"
              className="w-full rounded-full border border-[var(--line)] bg-[var(--panel-raised)] px-4 py-2.5 text-[13px] outline-none focus:border-accent/40"
            />
          </label>
          {error ? (
            <div className="rounded-[var(--radius-sm)] border border-danger/30 bg-danger/10 px-3 py-2 text-[12px] text-danger">
              {error}
            </div>
          ) : null}
          <button
            type="submit"
            disabled={submitting || !password}
            className="gen-btn w-full py-2.5 text-[13px]"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
