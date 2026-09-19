import { useCallback, useEffect, useRef, useState } from "react";
import {
  ClipboardCopy,
  Eraser,
  ImagePlus,
  Loader2,
  Sparkles,
  Upload,
  Users,
  X,
} from "lucide-react";
import type {
  AspectRatio,
  Generation,
  GenerationMode,
  Resolution,
} from "@shared/types";
import { MIN_DURATION, MAX_DURATION, SUPPORTED_RATIOS } from "@shared/types";
import { renumberReferences } from "@shared/references";
import {
  api,
  type CreateGenerationBody,
  type PromptSnippet,
  type SceneDetail,
} from "@/client/lib/api";
import { CharacterLibrary, type StripItem } from "@/client/components/CharacterLibrary";
import { useDebouncedCallback } from "@/client/hooks/useDebounce";
import { cn, modKeyLabel } from "@/client/lib/utils";

const MODES: Array<{ id: GenerationMode; label: string }> = [
  { id: "text", label: "Text" },
  { id: "first_frame", label: "First frame" },
  { id: "first_last", label: "First+Last" },
  { id: "references", label: "References" },
];

const DURATION_CHIPS = [5, 10, 15, 20, 30];

export interface ComposerState {
  mode: GenerationMode;
  prompt: string;
  duration: number;
  resolution: Resolution;
  aspectRatio: AspectRatio;
  generateAudio: boolean;
  returnLastFrame: boolean;
  firstFrame: StripItem | null;
  lastFrame: StripItem | null;
  references: StripItem[];
}

interface SceneComposerProps {
  scene: SceneDetail | null;
  onGenerated: () => void;
  restoreFrom?: Generation | null;
  continueFrom?: {
    generation: Generation;
    lastFrameAssetId: string;
  } | null;
  injectFirstFrame?: StripItem | null;
  injectReference?: StripItem | null;
  onConsumedInject?: () => void;
}

export function SceneComposer({
  scene,
  onGenerated,
  restoreFrom,
  continueFrom,
  injectFirstFrame,
  injectReference,
  onConsumedInject,
}: SceneComposerProps) {
  const [state, setState] = useState<ComposerState>(defaultState());
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snippets, setSnippets] = useState<PromptSnippet[]>([]);
  const [showSnippets, setShowSnippets] = useState(false);
  const [charLibOpen, setCharLibOpen] = useState(false);
  const [customDuration, setCustomDuration] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadRoleRef = useRef<"reference_image" | "first_frame" | "last_frame">(
    "reference_image",
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!scene) return;
    setState({
      mode: scene.preferred_mode,
      prompt: scene.working_prompt ?? "",
      duration: scene.preferred_duration,
      resolution: scene.preferred_resolution,
      aspectRatio: scene.preferred_ratio,
      generateAudio: scene.preferred_audio,
      returnLastFrame: scene.preferred_return_last_frame,
      firstFrame: null,
      lastFrame: null,
      references: [],
    });
    setCustomDuration(!DURATION_CHIPS.includes(scene.preferred_duration));
    setError(null);
  }, [scene?.id]);

  useEffect(() => {
    if (!restoreFrom) return;
    setState((prev) => ({
      ...prev,
      mode: restoreFrom.mode,
      prompt: restoreFrom.prompt,
      duration: restoreFrom.duration,
      resolution: restoreFrom.resolution,
      aspectRatio: restoreFrom.aspect_ratio,
      generateAudio: restoreFrom.generate_audio,
      returnLastFrame: restoreFrom.return_last_frame,
      firstFrame: restoreFrom.first_frame_asset_id
        ? {
            id: crypto.randomUUID(),
            assetId: restoreFrom.first_frame_asset_id,
            label: "First frame",
            role: "first_frame",
          }
        : null,
      lastFrame: restoreFrom.last_frame_asset_id
        ? {
            id: crypto.randomUUID(),
            assetId: restoreFrom.last_frame_asset_id,
            label: "Last frame",
            role: "last_frame",
          }
        : null,
    }));
    setCustomDuration(!DURATION_CHIPS.includes(restoreFrom.duration));
    onConsumedInject?.();
  }, [restoreFrom, onConsumedInject]);

  useEffect(() => {
    if (!continueFrom) return;
    setState((prev) => ({
      ...prev,
      mode: "first_frame",
      firstFrame: {
        id: crypto.randomUUID(),
        assetId: continueFrom.lastFrameAssetId,
        label: "Continue frame",
        role: "first_frame",
      },
      lastFrame: null,
    }));
    onConsumedInject?.();
  }, [continueFrom, onConsumedInject]);

  useEffect(() => {
    if (injectFirstFrame) {
      setState((prev) => ({
        ...prev,
        mode: prev.mode === "text" ? "first_frame" : prev.mode,
        firstFrame: injectFirstFrame,
      }));
      onConsumedInject?.();
    }
  }, [injectFirstFrame, onConsumedInject]);

  useEffect(() => {
    if (injectReference) {
      setState((prev) => ({
        ...prev,
        mode: "references",
        references: [
          ...prev.references,
          { ...injectReference, role: "reference_image" },
        ],
      }));
      onConsumedInject?.();
    }
  }, [injectReference, onConsumedInject]);

  useEffect(() => {
    if (!scene?.project_id) return;
    void api.promptSnippets(scene.project_id).then((r) => setSnippets(r.snippets));
  }, [scene?.project_id]);

  const persistScene = useCallback(
    async (next: ComposerState) => {
      if (!scene) return;
      setSaving(true);
      try {
        await api.patchScene(scene.id, {
          workingPrompt: next.prompt,
          preferredMode: next.mode,
          preferredResolution: next.resolution,
          preferredDuration: next.duration,
          preferredRatio: next.aspectRatio,
          preferredAudio: next.generateAudio,
          preferredReturnLastFrame: next.returnLastFrame,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Save failed");
      } finally {
        setSaving(false);
      }
    },
    [scene],
  );

  const debouncedSave = useDebouncedCallback((next: ComposerState) => {
    void persistScene(next);
  }, 700);

  const update = (patch: Partial<ComposerState>) => {
    setState((prev) => {
      const next = { ...prev, ...patch };
      debouncedSave(next);
      return next;
    });
  };

  const taggedRefs = renumberReferences(
    state.references.map((r) => ({
      id: r.id,
      assetId: r.assetId,
      label: r.label,
      characterId: r.characterId,
      role: r.role ?? "reference_image",
    })),
  );

  const generate = async () => {
    if (!scene) return;
    setGenerating(true);
    setError(null);
    try {
      await persistScene(state);
      const body: CreateGenerationBody = {
        sceneId: scene.id,
        mode: state.mode,
        prompt: state.prompt,
        duration: state.duration,
        resolution: state.resolution,
        aspectRatio: state.aspectRatio,
        generateAudio: state.generateAudio,
        returnLastFrame: state.returnLastFrame,
        firstFrameAssetId: state.firstFrame?.assetId ?? null,
        lastFrameAssetId: state.lastFrame?.assetId ?? null,
        references:
          state.mode === "references"
            ? taggedRefs.map((r) => ({
                assetId: r.assetId,
                characterId: r.characterId ?? null,
                label: r.label,
              }))
            : undefined,
        idempotencyKey: crypto.randomUUID(),
      };
      await api.createGeneration(body);
      onGenerated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generate failed");
    } finally {
      setGenerating(false);
    }
  };

  const stateRef = useRef(state);
  const generateRef = useRef(generate);
  const persistRef = useRef(persistScene);
  stateRef.current = state;
  generateRef.current = generate;
  persistRef.current = persistScene;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "enter") {
        e.preventDefault();
        void generateRef.current();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void persistRef.current(stateRef.current);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const onUpload = async (file: File) => {
    if (!scene) return;
    const form = new FormData();
    form.append("file", file);
    form.append("projectId", scene.project_id);
    form.append("sceneId", scene.id);
    form.append("role", uploadRoleRef.current);
    try {
      const res = await api.uploadAsset(form);
      const item: StripItem = {
        id: crypto.randomUUID(),
        assetId: res.asset.id,
        label: file.name,
        url: res.url,
        role: uploadRoleRef.current,
      };
      if (uploadRoleRef.current === "first_frame") {
        update({ firstFrame: item, mode: state.mode === "text" ? "first_frame" : state.mode });
      } else if (uploadRoleRef.current === "last_frame") {
        update({ lastFrame: item, mode: "first_last" });
      } else {
        update({
          references: [...state.references, item],
          mode: "references",
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    }
  };

  if (!scene) {
    return (
      <div className="flex min-h-[320px] items-center justify-center bg-[var(--surface-0)] text-[13px] text-[var(--text-faint)]">
        Select a scene to compose
      </div>
    );
  }

  return (
    <section className="flex min-h-0 flex-col bg-[var(--surface-0)]">
      <div className="flex flex-wrap items-center gap-1 border-b border-[var(--line)] px-2 py-1.5">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => update({ mode: m.id })}
            className={cn(
              "rounded px-2.5 py-1 text-[12px]",
              state.mode === m.id
                ? "bg-accent-dim text-accent"
                : "text-[var(--text-muted)] hover:bg-[var(--panel-hover)] hover:text-[var(--text)]",
            )}
          >
            {m.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 text-[11px] text-[var(--text-faint)]">
          {saving ? "Saving…" : "Saved"}
          <span className="hidden sm:inline">
            {modKeyLabel()}+Enter generate · {modKeyLabel()}+S save
          </span>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
        {(state.mode === "first_frame" ||
          state.mode === "first_last" ||
          state.mode === "references") && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-faint)]">
                Reference strip
              </div>
              <div className="flex gap-1">
                <StripBtn
                  onClick={() => {
                    uploadRoleRef.current =
                      state.mode === "first_frame" || state.mode === "first_last"
                        ? "first_frame"
                        : "reference_image";
                    fileRef.current?.click();
                  }}
                >
                  <Upload className="size-3" /> Upload
                </StripBtn>
                {state.mode === "first_last" ? (
                  <StripBtn
                    onClick={() => {
                      uploadRoleRef.current = "last_frame";
                      fileRef.current?.click();
                    }}
                  >
                    <ImagePlus className="size-3" /> Last
                  </StripBtn>
                ) : null}
                <StripBtn onClick={() => setCharLibOpen(true)}>
                  <Users className="size-3" /> Characters
                </StripBtn>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {state.firstFrame ? (
                <FrameThumb
                  tag="@first"
                  item={state.firstFrame}
                  onRemove={() => update({ firstFrame: null })}
                />
              ) : null}
              {state.lastFrame ? (
                <FrameThumb
                  tag="@last"
                  item={state.lastFrame}
                  onRemove={() => update({ lastFrame: null })}
                />
              ) : null}
              {taggedRefs.map((r) => {
                const item = state.references.find((x) => x.id === r.id);
                return (
                  <FrameThumb
                    key={r.id}
                    tag={r.tag}
                    item={item ?? { id: r.id, assetId: r.assetId, label: r.label }}
                    onRemove={() =>
                      update({
                        references: state.references.filter((x) => x.id !== r.id),
                      })
                    }
                    onInsertTag={() => {
                      const ta = textareaRef.current;
                      const tag = `${r.tag} `;
                      if (!ta) {
                        update({ prompt: `${state.prompt}${tag}` });
                        return;
                      }
                      const start = ta.selectionStart;
                      const end = ta.selectionEnd;
                      const next =
                        state.prompt.slice(0, start) + tag + state.prompt.slice(end);
                      update({ prompt: next });
                      requestAnimationFrame(() => {
                        ta.focus();
                        const pos = start + tag.length;
                        ta.setSelectionRange(pos, pos);
                      });
                    }}
                  />
                );
              })}
              {!state.firstFrame &&
              !state.lastFrame &&
              state.references.length === 0 ? (
                <div className="rounded border border-dashed border-[var(--line)] px-3 py-4 text-[12px] text-[var(--text-faint)]">
                  Add frames, references, or characters
                </div>
              ) : null}
            </div>
          </div>
        )}

        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-faint)]">
              Prompt
            </label>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowSnippets((v) => !v)}
                className="rounded border border-[var(--line)] px-1.5 py-0.5 text-[11px] text-[var(--text-muted)] hover:text-[var(--text)]"
              >
                Snippets
              </button>
              <button
                type="button"
                title="Copy"
                onClick={() => void navigator.clipboard.writeText(state.prompt)}
                className="inline-flex size-6 items-center justify-center rounded border border-[var(--line)] text-[var(--text-muted)] hover:text-[var(--text)]"
              >
                <ClipboardCopy className="size-3" />
              </button>
              <button
                type="button"
                title="Clear"
                onClick={() => update({ prompt: "" })}
                className="inline-flex size-6 items-center justify-center rounded border border-[var(--line)] text-[var(--text-muted)] hover:text-[var(--text)]"
              >
                <Eraser className="size-3" />
              </button>
              <span className="ml-1 font-mono text-[11px] tabular-nums text-[var(--text-faint)]">
                {state.prompt.length}
              </span>
            </div>
          </div>
          {showSnippets && snippets.length > 0 ? (
            <div className="mb-2 flex flex-wrap gap-1">
              {snippets.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() =>
                    update({
                      prompt: state.prompt
                        ? `${state.prompt.trimEnd()}\n${s.body}`
                        : s.body,
                    })
                  }
                  className="rounded border border-[var(--line)] bg-[var(--panel-raised)] px-2 py-0.5 text-[11px] text-[var(--text-muted)] hover:border-accent/40 hover:text-accent"
                >
                  {s.title}
                </button>
              ))}
            </div>
          ) : null}
          <textarea
            ref={textareaRef}
            value={state.prompt}
            onChange={(e) => update({ prompt: e.target.value })}
            rows={8}
            placeholder="Describe the shot… use @imageN tags for references"
            className="w-full resize-y rounded border border-[var(--line)] bg-[var(--panel)] px-3 py-2 text-[13px] leading-relaxed outline-none focus:border-accent/40"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <fieldset>
            <legend className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-faint)]">
              Resolution
            </legend>
            <div className="flex flex-wrap gap-1.5">
              <ResChip
                active={state.resolution === "480p"}
                onClick={() => update({ resolution: "480p" })}
                label="480p"
                hint="Draft / Series"
              />
              <ResChip
                active={state.resolution === "720p"}
                onClick={() => update({ resolution: "720p" })}
                label="720p"
                hint="Final"
              />
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-faint)]">
              Duration
            </legend>
            <div className="flex flex-wrap gap-1.5">
              {DURATION_CHIPS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => {
                    setCustomDuration(false);
                    update({ duration: d });
                  }}
                  className={cn(
                    "rounded border px-2 py-1 font-mono text-[12px]",
                    !customDuration && state.duration === d
                      ? "border-accent/40 bg-accent-dim text-accent"
                      : "border-[var(--line)] text-[var(--text-muted)] hover:text-[var(--text)]",
                  )}
                >
                  {d}s
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCustomDuration(true)}
                className={cn(
                  "rounded border px-2 py-1 text-[12px]",
                  customDuration
                    ? "border-accent/40 bg-accent-dim text-accent"
                    : "border-[var(--line)] text-[var(--text-muted)]",
                )}
              >
                Custom
              </button>
              {customDuration ? (
                <input
                  type="number"
                  min={MIN_DURATION}
                  max={MAX_DURATION}
                  value={state.duration}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    if (Number.isFinite(n)) {
                      update({
                        duration: Math.min(MAX_DURATION, Math.max(MIN_DURATION, Math.round(n))),
                      });
                    }
                  }}
                  className="w-16 rounded border border-[var(--line)] bg-[var(--panel)] px-2 py-1 font-mono text-[12px] outline-none"
                />
              ) : null}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-faint)]">
              Aspect ratio
            </legend>
            <div className="flex flex-wrap gap-1.5">
              {SUPPORTED_RATIOS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => update({ aspectRatio: r })}
                  className={cn(
                    "rounded border px-2 py-1 font-mono text-[11px]",
                    state.aspectRatio === r
                      ? "border-accent/40 bg-accent-dim text-accent"
                      : "border-[var(--line)] text-[var(--text-muted)] hover:text-[var(--text)]",
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-faint)]">
              Options
            </legend>
            <Toggle
              label="Generate audio"
              checked={state.generateAudio}
              onChange={(v) => update({ generateAudio: v })}
            />
            <Toggle
              label="Return last frame"
              checked={state.returnLastFrame}
              onChange={(v) => update({ returnLastFrame: v })}
            />
          </fieldset>
        </div>

        {error ? (
          <div className="rounded border border-danger/30 bg-danger/10 px-2.5 py-2 text-[12px] text-danger">
            {error}
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-[var(--line)] bg-[var(--panel)] px-3 py-2">
        <button
          type="button"
          onClick={() => void persistScene(state)}
          className="rounded border border-[var(--line)] px-3 py-1.5 text-[12px] text-[var(--text-muted)] hover:text-[var(--text)]"
        >
          Save
        </button>
        <button
          type="button"
          disabled={generating}
          onClick={() => void generate()}
          className="inline-flex items-center gap-1.5 rounded bg-accent px-3.5 py-1.5 text-[12px] font-semibold text-[#1a140c] hover:bg-accent-hover disabled:opacity-60"
        >
          {generating ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Sparkles className="size-3.5" />
          )}
          Generate
        </button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*,video/*,audio/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void onUpload(file);
          e.target.value = "";
        }}
      />

      <CharacterLibrary
        open={charLibOpen}
        onOpenChange={setCharLibOpen}
        projectId={scene.project_id}
        onPick={(item) =>
          update({
            references: [...state.references, item],
            mode: "references",
          })
        }
      />
    </section>
  );
}

function defaultState(): ComposerState {
  return {
    mode: "text",
    prompt: "",
    duration: 15,
    resolution: "480p",
    aspectRatio: "9:16",
    generateAudio: true,
    returnLastFrame: true,
    firstFrame: null,
    lastFrame: null,
    references: [],
  };
}

function StripBtn({
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
      className="inline-flex items-center gap-1 rounded border border-[var(--line)] px-2 py-0.5 text-[11px] text-[var(--text-muted)] hover:border-[var(--line-strong)] hover:text-[var(--text)]"
    >
      {children}
    </button>
  );
}

function FrameThumb({
  tag,
  item,
  onRemove,
  onInsertTag,
}: {
  tag: string;
  item: StripItem;
  onRemove: () => void;
  onInsertTag?: () => void;
}) {
  const [url, setUrl] = useState(item.url ?? null);
  useEffect(() => {
    if (item.url) {
      setUrl(item.url);
      return;
    }
    let cancelled = false;
    void api.assetUrl(item.assetId).then((r) => {
      if (!cancelled) setUrl(r.url);
    });
    return () => {
      cancelled = true;
    };
  }, [item.assetId, item.url]);

  return (
    <div className="group relative w-20 overflow-hidden rounded border border-[var(--line)] bg-[var(--panel-raised)]">
      <button
        type="button"
        className="block w-full"
        onClick={onInsertTag}
        title={onInsertTag ? `Insert ${tag}` : item.label}
      >
        <div className="aspect-square bg-black">
          {url ? (
            <img src={url} alt={item.label} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-[10px] text-[var(--text-faint)]">
              …
            </div>
          )}
        </div>
        <div className="truncate px-1 py-0.5 font-mono text-[10px] text-accent">{tag}</div>
      </button>
      <button
        type="button"
        onClick={onRemove}
        className="absolute right-0.5 top-0.5 rounded bg-black/70 p-0.5 text-white opacity-0 group-hover:opacity-100"
      >
        <X className="size-3" />
      </button>
    </div>
  );
}

function ResChip({
  active,
  onClick,
  label,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded border px-2.5 py-1 text-left",
        active
          ? "border-accent/40 bg-accent-dim"
          : "border-[var(--line)] hover:border-[var(--line-strong)]",
      )}
    >
      <div className={cn("font-mono text-[12px]", active ? "text-accent" : "text-[var(--text)]")}>
        {label}
      </div>
      <div className="text-[10px] text-[var(--text-faint)]">{hint}</div>
    </button>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded border border-[var(--line)] bg-[var(--panel)] px-2.5 py-1.5">
      <span className="text-[12px] text-[var(--text-muted)]">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-5 w-9 rounded-full transition-colors",
          checked ? "bg-accent" : "bg-[var(--surface-4)]",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-4 rounded-full bg-[#1a140c] transition-transform",
            checked ? "left-4" : "left-0.5",
          )}
        />
      </button>
    </label>
  );
}
