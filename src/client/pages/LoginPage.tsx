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
    <div className="flex min-h-full items-center justify-center bg-[var(--surface-0)] px-4">
      <div className="w-full max-w-sm rounded border border-[var(--line)] bg-[var(--panel)] p-5">
        <div className="mb-1 text-[11px] font-semibold tracking-[0.14em] text-accent">
          NEPAR SERIES
        </div>
        <h1 className="mb-1 text-[18px] font-semibold">Studio access</h1>
        <p className="mb-4 text-[12px] text-[var(--text-muted)]">
          Enter the workspace password to continue.
        </p>
        <form onSubmit={(e) => void onSubmit(e)} className="space-y-3">
          <input
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full rounded border border-[var(--line)] bg-[var(--panel-raised)] px-3 py-2 text-[13px] outline-none focus:border-accent/40"
          />
          {error ? (
            <div className="rounded border border-danger/30 bg-danger/10 px-2.5 py-1.5 text-[12px] text-danger">
              {error}
            </div>
          ) : null}
          <button
            type="submit"
            disabled={submitting || !password}
            className="w-full rounded bg-accent py-2 text-[13px] font-semibold text-[#1a140c] hover:bg-accent-hover disabled:opacity-50"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
