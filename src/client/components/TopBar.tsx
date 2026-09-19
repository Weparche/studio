import { Link } from "react-router-dom";
import { Activity, Settings } from "lucide-react";
import { BytePlusPopover } from "@/client/components/BytePlusPopover";
import type { ProviderBilling, ProviderStatus } from "@/client/lib/api";

interface TopBarProps {
  projectName?: string | null;
  episodeName?: string | null;
  sceneTitle?: string | null;
  activeGenerations: number;
  providerStatus: ProviderStatus | null;
  billing: ProviderBilling | null;
  billingLoading?: boolean;
}

export function TopBar({
  projectName,
  episodeName,
  sceneTitle,
  activeGenerations,
  providerStatus,
  billing,
  billingLoading,
}: TopBarProps) {
  return (
    <header className="col-span-full flex h-14 items-center gap-3 border-b border-[var(--line)] bg-[var(--panel)]/85 px-4 backdrop-blur-md">
      <Link
        to="/"
        className="shrink-0 text-[13px] font-semibold tracking-[0.16em] text-[var(--text)]"
      >
        NEPAR SERIES
      </Link>
      <span className="hidden text-[11px] text-[var(--text-faint)] sm:inline">Seedance Studio</span>

      <div className="hidden min-w-0 flex-1 items-center gap-1.5 truncate text-[12px] text-[var(--text-muted)] md:flex">
        <span className="text-[var(--text-faint)]">/</span>
        <span className="truncate">{projectName || "Project"}</span>
        <span className="text-[var(--text-faint)]">/</span>
        <span className="truncate">{episodeName || "Episode"}</span>
        <span className="text-[var(--text-faint)]">/</span>
        <span className="truncate font-medium text-[var(--text)]">{sceneTitle || "Scene"}</span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className="hidden items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--panel-raised)] px-2.5 py-1 text-[11px] text-[var(--text-muted)] sm:inline-flex">
          <Activity className="size-3.5 text-accent" />
          <span className="font-mono tabular-nums text-[var(--text)]">{activeGenerations}</span>
          <span>active</span>
        </div>

        <BytePlusPopover
          status={providerStatus}
          billing={billing}
          loading={billingLoading}
        />

        <Link
          to="/usage"
          className="hidden rounded-full border border-[var(--line)] px-2.5 py-1 text-[11px] text-[var(--text-muted)] hover:text-[var(--text)] sm:inline"
        >
          Usage
        </Link>

        <Link
          to="/settings"
          className="inline-flex size-8 items-center justify-center rounded-full border border-[var(--line)] text-[var(--text-muted)] hover:border-[var(--line-strong)] hover:text-[var(--text)]"
          title="Settings"
        >
          <Settings className="size-3.5" />
        </Link>
      </div>
    </header>
  );
}
