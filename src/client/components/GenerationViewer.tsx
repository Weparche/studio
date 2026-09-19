import { useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Copy,
  Heart,
  Image as ImageIcon,
  Play,
  RotateCcw,
  X,
} from "lucide-react";
import type { Generation } from "@shared/types";
import { lastFrameUrl, videoUrl } from "@/client/lib/api";
import { cn, formatUsd } from "@/client/lib/utils";

interface GenerationViewerProps {
  generation: Generation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFavorite: (g: Generation) => void;
  onDuplicate: (g: Generation) => void;
  onRetry: (g: Generation) => void;
  onContinue: (g: Generation) => void;
  onUseFirstFrame: (g: Generation) => void;
  onUseReference: (g: Generation) => void;
}

export function GenerationViewer({
  generation: g,
  open,
  onOpenChange,
  onFavorite,
  onDuplicate,
  onRetry,
  onContinue,
  onUseFirstFrame,
  onUseReference,
}: GenerationViewerProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80" />
        <Dialog.Content className="fixed inset-3 z-50 flex flex-col overflow-hidden rounded border border-[var(--line)] bg-[var(--panel)] outline-none md:inset-8">
          <div className="flex items-center justify-between border-b border-[var(--line)] px-3 py-2">
            <Dialog.Title className="text-[13px] font-medium">
              Generation viewer
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                className="inline-flex size-7 items-center justify-center rounded text-[var(--text-muted)] hover:bg-[var(--panel-hover)] hover:text-[var(--text)]"
              >
                <X className="size-4" />
              </button>
            </Dialog.Close>
          </div>

          {g ? (
            <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[minmax(0,1fr)_280px]">
              <div className="flex min-h-0 items-center justify-center bg-black p-2">
                {g.status === "succeeded" ? (
                  <video
                    key={g.id}
                    src={videoUrl(g.id)}
                    controls
                    autoPlay
                    className="max-h-full max-w-full"
                  />
                ) : (
                  <div className="text-[13px] text-[var(--text-muted)]">
                    Status: {g.status}
                    {g.error_message ? ` — ${g.error_message}` : ""}
                  </div>
                )}
              </div>

              <aside className="overflow-y-auto border-t border-[var(--line)] p-3 md:border-l md:border-t-0">
                <div className="space-y-3 text-[12px]">
                  <Meta label="Status" value={g.status} />
                  <Meta label="Mode" value={g.mode} />
                  <Meta label="Resolution" value={g.resolution} />
                  <Meta label="Duration" value={`${g.duration}s`} />
                  <Meta label="Ratio" value={g.aspect_ratio} />
                  <Meta
                    label="Est. cost"
                    value={
                      g.estimated_cost_usd != null
                        ? `~${formatUsd(g.estimated_cost_usd, 3)}`
                        : "—"
                    }
                  />
                  <div>
                    <div className="mb-1 text-[10px] uppercase tracking-wide text-[var(--text-faint)]">
                      Prompt
                    </div>
                    <p className="whitespace-pre-wrap rounded border border-[var(--line)] bg-[var(--panel-raised)] p-2 text-[12px] leading-relaxed">
                      {g.prompt || "—"}
                    </p>
                  </div>

                  {g.r2_last_frame_key ? (
                    <div>
                      <div className="mb-1 text-[10px] uppercase tracking-wide text-[var(--text-faint)]">
                        Last frame
                      </div>
                      <img
                        src={lastFrameUrl(g.id)}
                        alt="Last frame"
                        className="w-full rounded border border-[var(--line)]"
                      />
                    </div>
                  ) : null}

                  <div className="flex flex-col gap-1.5 pt-1">
                    <Action onClick={() => onFavorite(g)}>
                      <Heart className={cn("size-3.5", g.is_favorite && "fill-current text-accent")} />
                      {g.is_favorite ? "Selected" : "Mark selected"}
                    </Action>
                    <Action onClick={() => onDuplicate(g)}>
                      <Copy className="size-3.5" /> Duplicate settings
                    </Action>
                    {g.status === "failed" ? (
                      <Action onClick={() => onRetry(g)}>
                        <RotateCcw className="size-3.5" /> Retry
                      </Action>
                    ) : null}
                    {g.status === "succeeded" ? (
                      <>
                        <Action onClick={() => onContinue(g)}>
                          <Play className="size-3.5" /> Continue from last frame
                        </Action>
                        <Action onClick={() => onUseFirstFrame(g)}>
                          <ImageIcon className="size-3.5" /> Use as first frame
                        </Action>
                        <Action onClick={() => onUseReference(g)}>
                          <ImageIcon className="size-3.5" /> Use as reference
                        </Action>
                      </>
                    ) : null}
                  </div>
                </div>
              </aside>
            </div>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-[var(--line)] pb-1.5">
      <span className="text-[10px] uppercase tracking-wide text-[var(--text-faint)]">{label}</span>
      <span className="font-mono text-[var(--text)]">{value}</span>
    </div>
  );
}

function Action({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded border border-[var(--line)] px-2.5 py-1.5 text-left text-[12px] text-[var(--text-muted)] hover:border-[var(--line-strong)] hover:text-[var(--text)]"
    >
      {children}
    </button>
  );
}
