import * as Popover from "@radix-ui/react-popover";
import { AlertTriangle, CreditCard, ExternalLink, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import type { ProviderBilling, ProviderStatus } from "@/client/lib/api";
import { cn, formatUsd } from "@/client/lib/utils";

interface BytePlusPopoverProps {
  status: ProviderStatus | null;
  billing: ProviderBilling | null;
  loading?: boolean;
}

export function BytePlusPopover({ status, billing, loading }: BytePlusPopoverProps) {
  const configured = status?.configured ?? false;
  const remaining = billing?.estimatedRemaining ?? null;
  const low = billing?.lowBalance ?? false;

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1.5 rounded border px-2 py-1 text-[12px] transition-colors",
            !configured
              ? "border-danger/40 bg-danger/10 text-danger"
              : low
                ? "border-warning/40 bg-warning/10 text-warning"
                : "border-[var(--line)] bg-[var(--panel-raised)] text-[var(--text-muted)] hover:border-[var(--line-strong)] hover:text-[var(--text)]",
          )}
        >
          <Wallet className="size-3.5" />
          {!configured ? (
            <span>BytePlus key needed</span>
          ) : remaining == null ? (
            <span>Budget unset</span>
          ) : (
            <span className="font-mono tabular-nums">
              ~{formatUsd(remaining)} est.
            </span>
          )}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={6}
          className="z-50 w-80 rounded border border-[var(--line)] bg-[var(--panel)] p-3 shadow-xl outline-none"
        >
          <div className="mb-2 flex items-center justify-between">
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-faint)]">
              BytePlus Budget
            </div>
            {loading ? (
              <span className="text-[11px] text-[var(--text-faint)]">Refreshing…</span>
            ) : null}
          </div>

          {!configured ? (
            <div className="space-y-2 rounded border border-danger/30 bg-danger/5 p-2.5">
              <div className="flex items-start gap-2 text-[12px] text-danger">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                <div>
                  <div className="font-medium">BytePlus not configured</div>
                  <div className="mt-0.5 text-[var(--text-muted)]">
                    Add BYTEPLUS_API_KEY in Workers secrets, then verify in Settings.
                  </div>
                </div>
              </div>
              <Link
                to="/settings"
                className="inline-flex items-center gap-1 text-[12px] text-accent hover:text-accent-hover"
              >
                Open Settings <ExternalLink className="size-3" />
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded border border-[var(--line)] bg-[var(--panel-raised)] p-2.5">
                <div className="text-[11px] text-[var(--text-faint)]">
                  Estimated remaining
                </div>
                <div className="mt-0.5 font-mono text-[18px] font-semibold tabular-nums text-[var(--text)]">
                  {remaining == null ? "—" : `~${formatUsd(remaining)}`}
                </div>
                <div className="mt-1 text-[11px] leading-snug text-[var(--text-muted)]">
                  {billing?.note ??
                    "Estimated from NEPAR Studio usage against funded budget."}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[12px]">
                <Stat label="Month spend" value={formatUsd(billing?.monthSpend)} />
                <Stat label="Tracked spend" value={formatUsd(billing?.trackedSpend)} />
              </div>

              {low ? (
                <div className="flex items-center gap-1.5 rounded border border-warning/30 bg-warning/10 px-2 py-1.5 text-[12px] text-warning">
                  <AlertTriangle className="size-3.5" />
                  Low balance — add funds soon
                </div>
              ) : null}

              <div className="flex flex-col gap-1.5">
                {billing?.addFundsUrl || status?.addFundsUrl ? (
                  <a
                    href={billing?.addFundsUrl || status?.addFundsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 rounded bg-accent px-2.5 py-1.5 text-[12px] font-medium text-[#1a140c] hover:bg-accent-hover"
                  >
                    <CreditCard className="size-3.5" />
                    Add funds
                  </a>
                ) : (
                  <div className="rounded border border-[var(--line)] px-2.5 py-1.5 text-center text-[11px] text-[var(--text-faint)]">
                    Add funds URL not configured
                  </div>
                )}
                <div className="grid grid-cols-2 gap-1.5">
                  {(billing?.billingCenterUrl || status?.billingCenterUrl) && (
                    <a
                      href={billing?.billingCenterUrl || status?.billingCenterUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-1 rounded border border-[var(--line)] px-2 py-1.5 text-[12px] text-[var(--text-muted)] hover:border-[var(--line-strong)] hover:text-[var(--text)]"
                    >
                      Billing Center
                    </a>
                  )}
                  <Link
                    to="/usage"
                    className="inline-flex items-center justify-center gap-1 rounded border border-[var(--line)] px-2 py-1.5 text-[12px] text-[var(--text-muted)] hover:border-[var(--line-strong)] hover:text-[var(--text)]"
                  >
                    Usage
                  </Link>
                </div>
              </div>
            </div>
          )}
          <Popover.Arrow className="fill-[var(--line)]" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-[var(--line)] bg-[var(--panel-raised)] px-2 py-1.5">
      <div className="text-[10px] uppercase tracking-wide text-[var(--text-faint)]">{label}</div>
      <div className="mt-0.5 font-mono tabular-nums text-[var(--text)]">{value}</div>
    </div>
  );
}
