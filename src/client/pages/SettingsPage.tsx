import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Loader2, LogOut, XCircle } from "lucide-react";
import { api, type SettingsResponse } from "@/client/lib/api";
import { useAuth } from "@/client/hooks/useAuth";
import { formatUsd } from "@/client/lib/utils";

export function SettingsPage() {
  const { logout } = useAuth();
  const [settings, setSettings] = useState<SettingsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    void api
      .settings()
      .then(setSettings)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Failed to load settings"),
      );
  }, []);

  const runTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await api.testProvider();
      setTestResult(
        res.ok
          ? `Connected — ${res.message ?? res.status}`
          : `Failed — ${res.message ?? res.status}`,
      );
    } catch (err) {
      setTestResult(err instanceof Error ? err.message : "Test failed");
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="min-h-full bg-[var(--surface-0)]">
      <header className="flex h-11 items-center gap-3 border-b border-[var(--line)] bg-[var(--panel)] px-3">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-[12px] text-[var(--text-muted)] hover:text-[var(--text)]"
        >
          <ArrowLeft className="size-3.5" /> Studio
        </Link>
        <h1 className="text-[13px] font-medium">Settings</h1>
        <button
          type="button"
          onClick={() => void logout()}
          className="ml-auto inline-flex items-center gap-1.5 rounded border border-[var(--line)] px-2 py-1 text-[12px] text-[var(--text-muted)] hover:text-[var(--text)]"
        >
          <LogOut className="size-3.5" /> Log out
        </button>
      </header>

      <div className="mx-auto max-w-2xl space-y-4 p-4">
        {error ? (
          <div className="rounded border border-danger/30 bg-danger/10 px-3 py-2 text-[12px] text-danger">
            {error}
          </div>
        ) : null}

        {!settings ? (
          <div className="text-[12px] text-[var(--text-faint)]">Loading…</div>
        ) : (
          <>
            <section className="rounded border border-[var(--line)] bg-[var(--panel)] p-3">
              <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-faint)]">
                BytePlus / Seedance
              </h2>
              <div className="space-y-2 text-[12px]">
                <Row label="Model" value={settings.byteplus.model} mono />
                <Row
                  label="Status"
                  value={settings.byteplus.status}
                  icon={
                    settings.byteplus.status === "connected" ? (
                      <CheckCircle2 className="size-3.5 text-success" />
                    ) : (
                      <XCircle className="size-3.5 text-danger" />
                    )
                  }
                />
                <Row label="Billing mode" value={settings.byteplus.billingMode} mono />
                <Row
                  label="Est. 480p / 5s"
                  value={`~${formatUsd(settings.byteplus.estimate480p, 3)}`}
                  mono
                />
                <Row
                  label="Est. 720p / 5s"
                  value={`~${formatUsd(settings.byteplus.estimate720p, 3)}`}
                  mono
                />
              </div>

              {settings.byteplus.status !== "connected" ? (
                <div className="mt-3 rounded border border-warning/30 bg-warning/10 px-2.5 py-2 text-[12px] text-warning">
                  BytePlus setup required — set BYTEPLUS_API_KEY in Workers secrets.
                </div>
              ) : null}

              <button
                type="button"
                onClick={() => void runTest()}
                disabled={testing}
                className="mt-3 inline-flex items-center gap-1.5 rounded border border-[var(--line)] px-2.5 py-1.5 text-[12px] text-[var(--text-muted)] hover:text-[var(--text)] disabled:opacity-50"
              >
                {testing ? <Loader2 className="size-3.5 animate-spin" /> : null}
                Test connection
              </button>
              {testResult ? (
                <div className="mt-2 text-[12px] text-[var(--text-muted)]">{testResult}</div>
              ) : null}
            </section>

            <section className="rounded border border-[var(--line)] bg-[var(--panel)] p-3">
              <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-faint)]">
                Cloudflare
              </h2>
              <div className="space-y-2 text-[12px]">
                <Row label="D1" value={settings.cloudflare.d1} />
                <Row label="R2" value={settings.cloudflare.r2} />
                <Row label="Cron" value={settings.cloudflare.cron} mono />
              </div>
            </section>

            <section className="rounded border border-[var(--line)] bg-[var(--panel)] p-3">
              <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-faint)]">
                Defaults
              </h2>
              <div className="space-y-2 text-[12px]">
                <Row label="Resolution" value={settings.defaults.resolution} mono />
                <Row label="Aspect ratio" value={settings.defaults.aspectRatio} mono />
                <Row label="Duration" value={`${settings.defaults.duration}s`} mono />
                <Row label="Audio" value={settings.defaults.audio ? "On" : "Off"} />
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
  icon,
}: {
  label: string;
  value: string;
  mono?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] pb-1.5 last:border-0 last:pb-0">
      <span className="text-[var(--text-faint)]">{label}</span>
      <span className={`inline-flex items-center gap-1.5 ${mono ? "font-mono" : ""}`}>
        {icon}
        {value}
      </span>
    </div>
  );
}
