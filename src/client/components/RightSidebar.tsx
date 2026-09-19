import { useMemo } from "react";
import type { Generation } from "@shared/types";
import { GenerationCard } from "@/client/components/GenerationCard";
import { cn } from "@/client/lib/utils";

export type GenerationFilter = "all" | "selected" | "generating" | "failed";

interface RightSidebarProps {
  generations: Generation[];
  summary: {
    total: number;
    selected: number;
    generating: number;
    failed: number;
  };
  filter: GenerationFilter;
  onFilterChange: (f: GenerationFilter) => void;
  onOpen: (g: Generation) => void;
  onFavorite: (g: Generation) => void;
  onDuplicate: (g: Generation) => void;
  onRetry: (g: Generation) => void;
  onDelete: (g: Generation) => void;
  onContinue: (g: Generation) => void;
  onUseFirstFrame: (g: Generation) => void;
  onUseReference: (g: Generation) => void;
}

const FILTERS: Array<{ id: GenerationFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "selected", label: "Selected" },
  { id: "generating", label: "Generating" },
  { id: "failed", label: "Failed" },
];

export function RightSidebar({
  generations,
  summary,
  filter,
  onFilterChange,
  ...actions
}: RightSidebarProps) {
  const counts = useMemo(
    () => ({
      all: summary.total,
      selected: summary.selected,
      generating: summary.generating,
      failed: summary.failed,
    }),
    [summary],
  );

  return (
    <aside className="flex min-h-0 flex-col border-l border-[var(--line)] bg-[var(--panel)]">
      <div className="border-b border-[var(--line)] px-2.5 py-2">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-faint)]">
          Generations
        </div>
        <div className="flex flex-wrap gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => onFilterChange(f.id)}
              className={cn(
                "rounded border px-2 py-0.5 text-[11px]",
                filter === f.id
                  ? "border-accent/40 bg-accent-dim text-accent"
                  : "border-[var(--line)] text-[var(--text-muted)] hover:text-[var(--text)]",
              )}
            >
              {f.label}
              <span className="ml-1 font-mono tabular-nums opacity-70">
                {counts[f.id]}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-2">
        {generations.length === 0 ? (
          <div className="px-2 py-10 text-center text-[12px] text-[var(--text-faint)]">
            No generations yet
          </div>
        ) : (
          generations.map((g) => (
            <GenerationCard key={g.id} generation={g} {...actions} />
          ))
        )}
      </div>
    </aside>
  );
}
