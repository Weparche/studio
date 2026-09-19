import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { api, type UsageResponse } from "@/client/lib/api";
import { formatUsd } from "@/client/lib/utils";

export function UsagePage() {
  const [data, setData] = useState<UsageResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void api
      .usage()
      .then(setData)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Failed to load usage"),
      );
  }, []);

  return (
    <div className="min-h-full bg-[var(--surface-0)]">
      <header className="flex h-11 items-center gap-3 border-b border-[var(--line)] bg-[var(--panel)] px-3">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-[12px] text-[var(--text-muted)] hover:text-[var(--text)]"
        >
          <ArrowLeft className="size-3.5" /> Studio
        </Link>
        <h1 className="text-[13px] font-medium">Usage</h1>
      </header>

      <div className="mx-auto max-w-4xl space-y-4 p-4">
        {error ? (
          <div className="rounded border border-danger/30 bg-danger/10 px-3 py-2 text-[12px] text-danger">
            {error}
          </div>
        ) : null}

        {!data ? (
          <div className="text-[12px] text-[var(--text-faint)]">Loading…</div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <PeriodCard title="Today" stats={data.today} />
              <PeriodCard title="This month" stats={data.month} />
            </div>

            <section className="rounded border border-[var(--line)] bg-[var(--panel)]">
              <h2 className="border-b border-[var(--line)] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-faint)]">
                By project (month)
              </h2>
              <table className="w-full text-left text-[12px]">
                <thead className="text-[10px] uppercase tracking-wide text-[var(--text-faint)]">
                  <tr>
                    <th className="px-3 py-2 font-medium">Project</th>
                    <th className="px-3 py-2 font-medium">Gens</th>
                    <th className="px-3 py-2 font-medium">Spend</th>
                  </tr>
                </thead>
                <tbody>
                  {data.byProject.map((row) => (
                    <tr key={row.project} className="border-t border-[var(--line)]">
                      <td className="px-3 py-2">{row.project}</td>
                      <td className="px-3 py-2 font-mono tabular-nums">{row.generations}</td>
                      <td className="px-3 py-2 font-mono tabular-nums">
                        {formatUsd(Number(row.spend))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section className="rounded border border-[var(--line)] bg-[var(--panel)]">
              <h2 className="border-b border-[var(--line)] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-faint)]">
                By resolution (month)
              </h2>
              <table className="w-full text-left text-[12px]">
                <thead className="text-[10px] uppercase tracking-wide text-[var(--text-faint)]">
                  <tr>
                    <th className="px-3 py-2 font-medium">Resolution</th>
                    <th className="px-3 py-2 font-medium">Gens</th>
                    <th className="px-3 py-2 font-medium">Spend</th>
                  </tr>
                </thead>
                <tbody>
                  {data.byResolution.map((row) => (
                    <tr key={row.resolution} className="border-t border-[var(--line)]">
                      <td className="px-3 py-2 font-mono">{row.resolution}</td>
                      <td className="px-3 py-2 font-mono tabular-nums">{row.generations}</td>
                      <td className="px-3 py-2 font-mono tabular-nums">
                        {formatUsd(Number(row.spend))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function PeriodCard({
  title,
  stats,
}: {
  title: string;
  stats: UsageResponse["today"];
}) {
  return (
    <div className="rounded border border-[var(--line)] bg-[var(--panel)] p-3">
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-faint)]">
        {title}
      </div>
      <div className="grid grid-cols-2 gap-2 text-[12px]">
        <Stat label="Generations" value={String(stats.generations ?? 0)} />
        <Stat label="Successful" value={String(stats.successful ?? 0)} />
        <Stat label="Failed" value={String(stats.failed ?? 0)} />
        <Stat label="Pending" value={String(stats.pending ?? 0)} />
        <Stat label="Seconds" value={String(stats.generated_seconds ?? 0)} />
        <Stat
          label="Est. spend"
          value={formatUsd(Number(stats.estimated_spend ?? 0))}
        />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-[var(--line)] bg-[var(--panel-raised)] px-2 py-1.5">
      <div className="text-[10px] text-[var(--text-faint)]">{label}</div>
      <div className="mt-0.5 font-mono tabular-nums">{value}</div>
    </div>
  );
}
