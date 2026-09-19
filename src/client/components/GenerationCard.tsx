import {
  Copy,
  Heart,
  Image as ImageIcon,
  Loader2,
  Play,
  RotateCcw,
  Trash2,
} from "lucide-react";
import type { Generation, GenerationStatus } from "@shared/types";
import { cn, formatUsd, shortId } from "@/client/lib/utils";
import { lastFrameUrl, videoUrl } from "@/client/lib/api";

interface GenerationCardProps {
  generation: Generation;
  onOpen: (g: Generation) => void;
  onFavorite: (g: Generation) => void;
  onDuplicate: (g: Generation) => void;
  onRetry: (g: Generation) => void;
  onDelete: (g: Generation) => void;
  onContinue: (g: Generation) => void;
  onUseFirstFrame: (g: Generation) => void;
  onUseReference: (g: Generation) => void;
}

const STATUS_STYLES: Record<GenerationStatus, string> = {
  queued: "text-[var(--text-muted)] border-[var(--line)]",
  running: "text-info border-info/30 bg-info/10",
  succeeded: "text-success border-success/30 bg-success/10",
  failed: "text-danger border-danger/30 bg-danger/10",
  expired: "text-[var(--text-faint)] border-[var(--line)]",
  cancelled: "text-[var(--text-faint)] border-[var(--line)]",
};

export function GenerationCard({
  generation: g,
  onOpen,
  onFavorite,
  onDuplicate,
  onRetry,
  onDelete,
  onContinue,
  onUseFirstFrame,
  onUseReference,
}: GenerationCardProps) {
  const active = g.status === "queued" || g.status === "running";
  const ok = g.status === "succeeded";

  return (
    <article
      className={cn(
        "rounded border border-[var(--line)] bg-[var(--panel-raised)] transition-colors",
        g.is_favorite && "border-accent/40",
      )}
    >
      <button
        type="button"
        onClick={() => onOpen(g)}
        className="block w-full overflow-hidden rounded-t text-left"
      >
        <div className="relative aspect-video bg-black">
          {ok ? (
            <video
              src={videoUrl(g.id)}
              muted
              playsInline
              preload="metadata"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-[var(--text-faint)]">
              {active ? (
                <Loader2 className="size-5 animate-spin text-accent" />
              ) : (
                <Play className="size-5 opacity-40" />
              )}
            </div>
          )}
          <div
            className={cn(
              "absolute left-1.5 top-1.5 rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wide",
              STATUS_STYLES[g.status],
            )}
          >
            {g.status}
          </div>
        </div>
      </button>

      <div className="space-y-2 p-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate font-mono text-[11px] text-[var(--text-faint)]">
              {shortId(g.id, 10)}
            </div>
            <div className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-[var(--text)]">
              {g.prompt || "(empty prompt)"}
            </div>
          </div>
          <button
            type="button"
            title={g.is_favorite ? "Remove from selected" : "Mark as selected"}
            aria-label={g.is_favorite ? "Remove from selected" : "Mark as selected"}
            onClick={() => onFavorite(g)}
            className={cn(
              "shrink-0 rounded p-1",
              g.is_favorite ? "text-accent" : "text-[var(--text-muted)] hover:text-accent",
            )}
          >
            <Heart className={cn("size-3.5", g.is_favorite && "fill-current")} />
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5 text-[10px] text-[var(--text-muted)]">
          <Chip>{g.mode.replace("_", " ")}</Chip>
          <Chip>{g.resolution}</Chip>
          <Chip>{g.duration}s</Chip>
          <Chip>{g.aspect_ratio}</Chip>
          {g.estimated_cost_usd != null ? (
            <Chip>~{formatUsd(g.estimated_cost_usd, 3)}</Chip>
          ) : null}
        </div>

        {g.status === "failed" && g.error_message ? (
          <div className="line-clamp-2 text-[11px] text-danger">{g.error_message}</div>
        ) : null}

        <div className="flex flex-wrap gap-1">
          <IconBtn title="Duplicate settings" onClick={() => onDuplicate(g)}>
            <Copy className="size-3" />
          </IconBtn>
          {g.status === "failed" ? (
            <IconBtn title="Retry" onClick={() => onRetry(g)}>
              <RotateCcw className="size-3" />
            </IconBtn>
          ) : null}
          {ok ? (
            <>
              <IconBtn title="Continue from last frame" onClick={() => onContinue(g)}>
                <Play className="size-3" />
              </IconBtn>
              <IconBtn title="Use as first frame" onClick={() => onUseFirstFrame(g)}>
                <ImageIcon className="size-3" />
              </IconBtn>
              <IconBtn title="Use as reference" onClick={() => onUseReference(g)}>
                <ImageIcon className="size-3 opacity-70" />
              </IconBtn>
            </>
          ) : null}
          <IconBtn title="Delete" onClick={() => onDelete(g)} danger>
            <Trash2 className="size-3" />
          </IconBtn>
        </div>

        {ok && g.r2_last_frame_key ? (
          <img
            src={lastFrameUrl(g.id)}
            alt="Last frame"
            className="h-10 w-auto rounded border border-[var(--line)] object-cover"
          />
        ) : null}
      </div>
    </article>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded border border-[var(--line)] bg-[var(--panel)] px-1.5 py-0.5 font-mono uppercase">
      {children}
    </span>
  );
}

function IconBtn({
  children,
  onClick,
  title,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn(
        "inline-flex size-6 items-center justify-center rounded border border-[var(--line)] text-[var(--text-muted)] hover:border-[var(--line-strong)] hover:text-[var(--text)]",
        danger && "hover:border-danger/40 hover:text-danger",
      )}
    >
      {children}
    </button>
  );
}
